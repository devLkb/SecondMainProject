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
public class GoogleOAuthClient {

    private static final String TOKEN_URL     = "https://oauth2.googleapis.com/token";
    private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
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
        body.add("code", code);
        body.add("redirect_uri", props.getGoogle().getRedirectUri());
        body.add("client_id", props.getGoogle().getClientId());
        body.add("client_secret", props.getGoogle().getClientSecret());

        Map<String, Object> response = restTemplate.exchange(
                TOKEN_URL, HttpMethod.POST, new HttpEntity<>(body, headers), MAP_TYPE).getBody();
        if (response == null || response.get("access_token") == null) {
            throw new IllegalStateException("구글 액세스 토큰 발급에 실패했습니다. 다시 시도해주세요.");
        }
        return (String) response.get("access_token");
    }

    private OAuthUserInfo fetchUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        Map<String, Object> body = restTemplate.exchange(
                USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), MAP_TYPE).getBody();
        if (body == null || body.get("id") == null) {
            throw new IllegalStateException("구글 사용자 정보를 가져오지 못했습니다.");
        }

        return OAuthUserInfo.builder()
                .provider("google")
                .providerId(String.valueOf(body.get("id")))
                .email((String) body.get("email"))
                // Google userinfo v2는 검증된 이메일에 verified_email=true를 반환한다.
                .emailVerified(Boolean.TRUE.equals(body.get("verified_email")))
                .name((String) body.get("name"))
                .build();
    }
}
