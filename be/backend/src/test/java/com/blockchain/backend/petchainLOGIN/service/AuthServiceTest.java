package com.blockchain.backend.petchainLOGIN.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.blockchain.backend.common.DomainValues.AccountStatus;
import com.blockchain.backend.common.DomainValues.MemberType;
import com.blockchain.backend.common.DomainValues.PointOwnerType;
import com.blockchain.backend.petchainDB.entity.Hospital;
import com.blockchain.backend.petchainDB.entity.PointBalance;
import com.blockchain.backend.petchainDB.entity.RefreshToken;
import com.blockchain.backend.petchainDB.entity.User;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.HospitalRepository;
import com.blockchain.backend.petchainDB.repository.InsuranceCompanyRepository;
import com.blockchain.backend.petchainDB.repository.PointBalanceRepository;
import com.blockchain.backend.petchainDB.repository.RefreshTokenRepository;
import com.blockchain.backend.petchainDB.repository.UserRepository;
import com.blockchain.backend.petchainLOGIN.dto.request.HospitalRegisterRequest;
import com.blockchain.backend.petchainLOGIN.dto.request.LoginRequest;
import com.blockchain.backend.petchainLOGIN.dto.response.AuthResponse;
import com.blockchain.backend.petchainLOGIN.util.JwtUtil;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    UserRepository userRepository;
    @Mock
    GuardianRepository guardianRepository;
    @Mock
    HospitalRepository hospitalRepository;
    @Mock
    InsuranceCompanyRepository insuranceCompanyRepository;
    @Mock
    RefreshTokenRepository refreshTokenRepository;
    @Mock
    PointBalanceRepository pointBalanceRepository;
    @Mock
    PasswordEncoder passwordEncoder;
    @Mock
    JwtUtil jwtUtil;

    AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                guardianRepository,
                hospitalRepository,
                insuranceCompanyRepository,
                refreshTokenRepository,
                pointBalanceRepository,
                passwordEncoder,
                jwtUtil
        );
    }

    @Test
    void hospitalRegistrationCreatesSuspendedAccountAndZeroPointBalance() {
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(7L);
            return user;
        });
        when(hospitalRepository.save(any(Hospital.class))).thenAnswer(invocation -> {
            Hospital hospital = invocation.getArgument(0);
            hospital.setId(11L);
            return hospital;
        });

        AuthResponse response = authService.registerHospital(hospitalRequest());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<PointBalance> balanceCaptor = ArgumentCaptor.forClass(PointBalance.class);
        verify(userRepository).save(userCaptor.capture());
        verify(pointBalanceRepository).save(balanceCaptor.capture());

        assertThat(userCaptor.getValue().getLoginId()).isEqualTo("hospital-org-1");
        assertThat(userCaptor.getValue().getMemberType()).isEqualTo(MemberType.HOSPITAL);
        assertThat(userCaptor.getValue().getStatus()).isEqualTo(AccountStatus.SUSPENDED);
        assertThat(balanceCaptor.getValue().getOwnerType()).isEqualTo(PointOwnerType.HOSPITAL);
        assertThat(balanceCaptor.getValue().getOwnerId()).isEqualTo(11L);
        assertThat(balanceCaptor.getValue().getBalance()).isZero();
        assertThat(response.getUserId()).isEqualTo(7L);
        assertThat(response.getMemberType()).isEqualTo(MemberType.HOSPITAL);
        assertThat(response.getAccessToken()).isNull();
    }

    @Test
    void loginRevokesExistingRefreshTokensAndIssuesNewPair() {
        User user = new User();
        user.setId(9L);
        user.setLoginId("user@example.com");
        user.setPasswordHash("encoded-password");
        user.setMemberType(MemberType.USER);
        user.setStatus(AccountStatus.ACTIVE);

        when(userRepository.findByLoginId("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);
        when(jwtUtil.generateAccessToken(9L, MemberType.USER)).thenReturn("access-token");
        when(jwtUtil.generateRefreshTokenValue()).thenReturn("refresh-token");
        when(jwtUtil.hashToken("refresh-token")).thenReturn("refresh-hash");
        when(jwtUtil.getRefreshTokenExpirationSeconds()).thenReturn(3600L);

        AuthResponse response = authService.login(loginRequest());

        ArgumentCaptor<RefreshToken> tokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).revokeAllByUserId(9L);
        verify(refreshTokenRepository).save(tokenCaptor.capture());
        assertThat(tokenCaptor.getValue().getUser()).isSameAs(user);
        assertThat(tokenCaptor.getValue().getTokenHash()).isEqualTo("refresh-hash");
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
    }

    @Test
    void loginRejectsSuspendedAccount() {
        User user = new User();
        user.setLoginId("hospital-org-1");
        user.setPasswordHash("encoded-password");
        user.setStatus(AccountStatus.SUSPENDED);

        when(userRepository.findByLoginId("hospital-org-1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded-password")).thenReturn(true);

        LoginRequest request = new LoginRequest();
        request.setLoginId("hospital-org-1");
        request.setPassword("password123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("관리자 승인 대기 중인 계정입니다.");
    }

    private static HospitalRegisterRequest hospitalRequest() {
        HospitalRegisterRequest request = new HospitalRegisterRequest();
        request.setName("Care Hospital");
        request.setBusinessNumber("123-45");
        request.setAddress("Seoul");
        request.setPhone("02-1234");
        request.setFabricOrgId("hospital-org-1");
        request.setAdminEmail("admin@hospital.example");
        request.setPassword("password123");
        return request;
    }

    private static LoginRequest loginRequest() {
        LoginRequest request = new LoginRequest();
        request.setLoginId("user@example.com");
        request.setPassword("password123");
        return request;
    }
}
