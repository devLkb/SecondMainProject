package com.blockchain.backend.petchainLOGIN.oauth;

import com.blockchain.backend.common.DomainValues.AccountStatus;
import com.blockchain.backend.common.DomainValues.MemberType;
import com.blockchain.backend.common.IdentifierGenerator;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.RefreshToken;
import com.blockchain.backend.petchainDB.entity.User;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.RefreshTokenRepository;
import com.blockchain.backend.petchainDB.repository.UserRepository;
import com.blockchain.backend.petchainLOGIN.dto.response.AuthResponse;
import com.blockchain.backend.petchainLOGIN.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OAuthService {

    private final UserRepository userRepository;
    private final GuardianRepository guardianRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OAuthStateStore stateStore;
    private final GoogleOAuthClient googleClient;
    private final NaverOAuthClient naverClient;
    private final KakaoOAuthClient kakaoClient;
    private final OAuthProperties props;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // OAuth 인가 URL 생성 + state 발급
    public String buildAuthorizationUrl(String provider) {
        String state = stateStore.generate();
        return switch (provider.toLowerCase()) {
            case "google" -> googleAuthUrl(state);
            case "naver"  -> naverAuthUrl(state);
            case "kakao"  -> kakaoAuthUrl(state);
            default -> throw new IllegalArgumentException("지원하지 않는 OAuth 제공자: " + provider);
        };
    }

    // 콜백 처리: code -> 사용자 정보 -> find-or-create -> JWT 발급
    @Transactional
    public AuthResponse processCallback(String provider, String code, String state) {
        stateStore.validate(state);

        OAuthUserInfo userInfo = switch (provider.toLowerCase()) {
            case "google" -> googleClient.getUserInfo(code);
            case "naver"  -> naverClient.getUserInfo(code, state);
            case "kakao"  -> kakaoClient.getUserInfo(code);
            default -> throw new IllegalArgumentException("지원하지 않는 OAuth 제공자: " + provider);
        };

        return findOrCreate(userInfo);
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }

    // ── find-or-create 핵심 로직 ──────────────────────────────────────────────

    private AuthResponse findOrCreate(OAuthUserInfo info) {
        // 1단계: provider + providerId로 기존 OAuth 계정 조회
        Optional<User> byProvider = userRepository
                .findByOauthProviderAndOauthProviderId(info.getProvider(), info.getProviderId());
        if (byProvider.isPresent()) {
            return loginExisting(byProvider.get());
        }

        // 2단계: 같은 이메일로 가입된 계정이 있으면 OAuth 연동 후 로그인
        if (info.getEmail() != null && !info.getEmail().isBlank()) {
            Optional<User> byEmail = userRepository.findByLoginId(info.getEmail());
            if (byEmail.isPresent()) {
                User user = byEmail.get();
                // 보호자 계정에만 OAuth 연동 허용
                if (MemberType.USER.equals(user.getMemberType())) {
                    user.setOauthProvider(info.getProvider());
                    user.setOauthProviderId(info.getProviderId());
                    userRepository.save(user);
                    return loginExisting(user);
                }
            }
        }

        // 3단계: 완전 신규 → 자동 가입 후 로그인
        return createGuardian(info);
    }

    private AuthResponse loginExisting(User user) {
        user.setLastLoginAt(LocalDateTime.now());
        String memberNumber = guardianRepository.findByUser_Id(user.getId())
                .map(Guardian::getMemberNumber)
                .orElse(null);
        return issueTokens(user, memberNumber);
    }

    private AuthResponse createGuardian(OAuthUserInfo info) {
        // loginId: 이메일 우선, 없으면 "provider_providerId"
        String loginId = (info.getEmail() != null && !info.getEmail().isBlank())
                ? info.getEmail()
                : info.getProvider() + "_" + info.getProviderId();

        User user = new User();
        user.setLoginId(loginId);
        // OAuth 전용 계정이므로 비밀번호는 랜덤값으로 채움 (사용 불가)
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setMemberType(MemberType.USER);
        user.setStatus(AccountStatus.ACTIVE);
        user.setOauthProvider(info.getProvider());
        user.setOauthProviderId(info.getProviderId());
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String memberNumber = uniqueMemberNumber();
        String name = (info.getName() != null && !info.getName().isBlank()) ? info.getName() : "사용자";

        Guardian guardian = new Guardian();
        guardian.setUser(user);
        guardian.setMemberNumber(memberNumber);
        guardian.setName(name);
        guardian.setEmail(info.getEmail());
        guardianRepository.save(guardian);

        return issueTokens(user, memberNumber);
    }

    private AuthResponse issueTokens(User user, String memberNumber) {
        // 기존 세션 무효화 후 새 토큰 발급
        refreshTokenRepository.revokeAllByUserId(user.getId());

        String accessToken    = jwtUtil.generateAccessToken(user.getId(), user.getMemberType());
        String rawRefreshToken = jwtUtil.generateRefreshTokenValue();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(jwtUtil.hashToken(rawRefreshToken));
        refreshToken.setExpiresAt(
                LocalDateTime.now().plusSeconds(jwtUtil.getRefreshTokenExpirationSeconds()));
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .userId(user.getId())
                .memberNumber(memberNumber)
                .memberType(user.getMemberType())
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .message("로그인이 완료되었습니다.")
                .build();
    }

    private String uniqueMemberNumber() {
        for (int i = 0; i < 10; i++) {
            String num = IdentifierGenerator.generateUserNumber();
            if (!guardianRepository.existsByMemberNumber(num)) return num;
        }
        throw new IllegalStateException("회원번호 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }

    // ── OAuth 인가 URL 빌더 ───────────────────────────────────────────────────

    private String googleAuthUrl(String state) {
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id="     + encode(props.getGoogle().getClientId())
                + "&redirect_uri="  + encode(props.getGoogle().getRedirectUri())
                + "&response_type=code"
                + "&scope="         + encode("openid email profile")
                + "&state="         + state;
    }

    private String naverAuthUrl(String state) {
        return "https://nid.naver.com/oauth2.0/authorize"
                + "?client_id="     + encode(props.getNaver().getClientId())
                + "&redirect_uri="  + encode(props.getNaver().getRedirectUri())
                + "&response_type=code"
                + "&state="         + state;
    }

    private String kakaoAuthUrl(String state) {
        return "https://kauth.kakao.com/oauth/authorize"
                + "?client_id="     + encode(props.getKakao().getClientId())
                + "&redirect_uri="  + encode(props.getKakao().getRedirectUri())
                + "&response_type=code"
                + "&state="         + state;
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
