package com.blockchain.backend.petchainLOGIN.service;

import com.blockchain.backend.petchainLOGIN.dto.request.*;
import com.blockchain.backend.petchainLOGIN.dto.response.AuthResponse;
import com.blockchain.backend.petchainDB.entity.*;
import com.blockchain.backend.petchainDB.repository.*;
import com.blockchain.backend.petchainLOGIN.util.JwtUtil;
import com.blockchain.backend.petchainLOGIN.util.MemberNumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final GuardianRepository guardianRepository;
    private final HospitalRepository hospitalRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // 보호자(user) 회원가입
    @Transactional
    public AuthResponse registerUser(UserRegisterRequest req) {
        if (userRepository.existsByLoginId(req.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = new User();
        user.setLoginId(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setMemberType("user");
        user.setStatus("active");
        userRepository.save(user);

        String memberNumber = uniqueUserNumber();

        Guardian guardian = new Guardian();
        guardian.setUser(user);
        guardian.setMemberNumber(memberNumber);
        guardian.setName(req.getName());
        guardian.setPhone(req.getPhone());
        guardian.setEmail(req.getEmail());
        guardian.setAddress(req.getAddress());
        guardianRepository.save(guardian);

        return issueTokens(user, memberNumber, "회원가입이 완료되었습니다.");
    }

    // 병원 등록 신청 (관리자 승인 대기)
    @Transactional
    public AuthResponse registerHospital(HospitalRegisterRequest req) {
        if (userRepository.existsByLoginId(req.getFabricOrgId())) {
            throw new IllegalArgumentException("이미 등록된 Org ID입니다.");
        }
        if (hospitalRepository.existsByFabricOrgId(req.getFabricOrgId())) {
            throw new IllegalArgumentException("이미 등록된 Fabric Org ID입니다.");
        }
        if (hospitalRepository.existsByBusinessNumber(req.getBusinessNumber())) {
            throw new IllegalArgumentException("이미 등록된 사업자등록번호입니다.");
        }

        User user = new User();
        user.setLoginId(req.getFabricOrgId());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setMemberType("hospital");
        user.setStatus("suspended");  // 관리자 승인 후 active 전환
        userRepository.save(user);

        String memberNumber = uniqueHospitalNumber();

        Hospital hospital = new Hospital();
        hospital.setUser(user);
        hospital.setMemberNumber(memberNumber);
        hospital.setName(req.getName());
        hospital.setBusinessNumber(req.getBusinessNumber());
        hospital.setAddress(req.getAddress());
        hospital.setPhone(req.getPhone());
        hospital.setFabricOrgId(req.getFabricOrgId());
        hospital.setAdminEmail(req.getAdminEmail());
        hospital.setIsActive(false);
        hospitalRepository.save(hospital);

        return AuthResponse.builder()
                .userId(user.getId())
                .memberNumber(memberNumber)
                .memberType("hospital")
                .message("등록 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.")
                .build();
    }

    // 보험사 등록 신청 (관리자 승인 대기)
    @Transactional
    public AuthResponse registerInsurance(InsuranceRegisterRequest req) {
        if (userRepository.existsByLoginId(req.getFabricOrgId())) {
            throw new IllegalArgumentException("이미 등록된 Org ID입니다.");
        }
        if (insuranceCompanyRepository.existsByFabricOrgId(req.getFabricOrgId())) {
            throw new IllegalArgumentException("이미 등록된 Fabric Org ID입니다.");
        }
        if (insuranceCompanyRepository.existsByBusinessNumber(req.getBusinessNumber())) {
            throw new IllegalArgumentException("이미 등록된 사업자등록번호입니다.");
        }

        User user = new User();
        user.setLoginId(req.getFabricOrgId());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setMemberType("insurance");
        user.setStatus("suspended");
        userRepository.save(user);

        String memberNumber = uniqueInsuranceNumber();

        InsuranceCompany company = new InsuranceCompany();
        company.setUser(user);
        company.setMemberNumber(memberNumber);
        company.setName(req.getName());
        company.setBusinessNumber(req.getBusinessNumber());
        company.setFabricOrgId(req.getFabricOrgId());
        company.setAdminEmail(req.getAdminEmail());
        insuranceCompanyRepository.save(company);

        return AuthResponse.builder()
                .userId(user.getId())
                .memberNumber(memberNumber)
                .memberType("insurance")
                .message("등록 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.")
                .build();
    }

    // 로그인 (모든 역할 공통)
    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByLoginId(req.getLoginId())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        if ("suspended".equals(user.getStatus())) {
            throw new IllegalStateException("관리자 승인 대기 중인 계정입니다.");
        }
        if ("withdrawn".equals(user.getStatus())) {
            throw new IllegalStateException("탈퇴한 계정입니다.");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 로그인 시 memberNumber는 각 프로필 테이블에서 가져와야 하나, 토큰 발급만 담당하는 흐름이므로 null 허용
        return issueTokens(user, null, "로그인이 완료되었습니다.");
    }

    private AuthResponse issueTokens(User user, String memberNumber, String message) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getMemberType());
        String rawRefreshToken = jwtUtil.generateRefreshTokenValue();
        String tokenHash = jwtUtil.hashToken(rawRefreshToken);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(tokenHash);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshTokenExpirationSeconds()));
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .userId(user.getId())
                .memberNumber(memberNumber)
                .memberType(user.getMemberType())
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .message(message)
                .build();
    }

    private String uniqueUserNumber() {
        for (int i = 0; i < 10; i++) {
            String num = MemberNumberGenerator.generateUserNumber();
            if (!guardianRepository.existsByMemberNumber(num)) return num;
        }
        throw new IllegalStateException("회원번호 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    private String uniqueHospitalNumber() {
        for (int i = 0; i < 10; i++) {
            String num = MemberNumberGenerator.generateHospitalNumber();
            if (!hospitalRepository.existsByMemberNumber(num)) return num;
        }
        throw new IllegalStateException("회원번호 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }

    private String uniqueInsuranceNumber() {
        for (int i = 0; i < 10; i++) {
            String num = MemberNumberGenerator.generateInsuranceNumber();
            if (!insuranceCompanyRepository.existsByMemberNumber(num)) return num;
        }
        throw new IllegalStateException("회원번호 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
}
