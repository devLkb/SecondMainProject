package com.blockchain.backend.petchainLOGIN.oauth;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class KakaoOAuthClient {

    private static final String TOKEN_URL     = "https://kauth.kakao.com/oauth/token";
    private static final String USER_INFO_URL = "https://kapi.kakao.com/v2/user/me";
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    private final OAuthProperties props;
    private final RestTemplate restTemplate;

    public OAuthUserInfo getUserInfo(String code) {
        String accessToken = fetchAccessToken(code);
        return fetchUserInfo(accessToken);
    }

    private String fetchAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", props.getKakao().getClientId());
        body.add("redirect_uri", props.getKakao().getRedirectUri());
        body.add("code", code);
        String secret = props.getKakao().getClientSecret();
        if (secret != null && !secret.isBlank()) {
            body.add("client_secret", secret);
        }

        Map<String, Object> response = restTemplate.exchange(
                TOKEN_URL, HttpMethod.POST, new HttpEntity<>(body, headers), MAP_TYPE).getBody();
        if (response == null || response.get("access_token") == null) {
            throw new IllegalStateException("카카오 액세스 토큰 발급에 실패했습니다. 다시 시도해주세요.");
        }
        return (String) response.get("access_token");
    }

    @SuppressWarnings("unchecked")
    private OAuthUserInfo fetchUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        Map<String, Object> body = restTemplate.exchange(
                USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), MAP_TYPE).getBody();
        if (body == null || body.get("id") == null) {
            throw new IllegalStateException("카카오 사용자 정보를 가져오지 못했습니다.");
        }

        String providerId = String.valueOf(body.get("id"));
        Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");

        String email = null;
        String name  = "카카오 사용자";
        boolean emailVerified = false;
        if (kakaoAccount != null) {
            email = (String) kakaoAccount.get("email");
            // 카카오 이메일은 미인증/유효하지 않은 경우가 있으므로 두 플래그를 모두 확인한다.
            emailVerified = Boolean.TRUE.equals(kakaoAccount.get("is_email_valid"))
                    && Boolean.TRUE.equals(kakaoAccount.get("is_email_verified"));
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            if (profile != null && profile.get("nickname") != null) {
                name = (String) profile.get("nickname");
            }
        }

        return OAuthUserInfo.builder()
                .provider("kakao")
                .providerId(providerId)
                .email(email)
                .emailVerified(emailVerified)
                .name(name)
                .build();
    }
}
