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
public class NaverOAuthClient {

    private static final String TOKEN_URL     = "https://nid.naver.com/oauth2.0/token";
    private static final String USER_INFO_URL = "https://openapi.naver.com/v1/nid/me";
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    private final OAuthProperties props;
    private final RestTemplate restTemplate;

    public OAuthUserInfo getUserInfo(String code, String state) {
        String accessToken = fetchAccessToken(code, state);
        return fetchUserInfo(accessToken);
    }

    private String fetchAccessToken(String code, String state) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", props.getNaver().getClientId());
        body.add("client_secret", props.getNaver().getClientSecret());
        body.add("code", code);
        body.add("state", state);

        Map<String, Object> response = restTemplate.exchange(
                TOKEN_URL, HttpMethod.POST, new HttpEntity<>(body, headers), MAP_TYPE).getBody();
        if (response == null || response.get("access_token") == null) {
            throw new IllegalStateException("네이버 액세스 토큰 발급에 실패했습니다. 다시 시도해주세요.");
        }
        return (String) response.get("access_token");
    }

    @SuppressWarnings("unchecked")
    private OAuthUserInfo fetchUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        Map<String, Object> body = restTemplate.exchange(
                USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), MAP_TYPE).getBody();

        Map<String, Object> profile = body == null ? null : (Map<String, Object>) body.get("response");
        if (profile == null || profile.get("id") == null) {
            throw new IllegalStateException("네이버 사용자 정보를 가져오지 못했습니다.");
        }
        String email = (String) profile.get("email");

        return OAuthUserInfo.builder()
                .provider("naver")
                .providerId(String.valueOf(profile.get("id")))
                .email(email)
                // 네이버가 반환하는 이메일은 사용자의 검증된 네이버 계정 이메일이다.
                .emailVerified(email != null && !email.isBlank())
                .name((String) profile.get("name"))
                .build();
    }
}
