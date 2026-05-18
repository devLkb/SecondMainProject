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
        return (String) response.get("access_token");
    }

    @SuppressWarnings("unchecked")
    private OAuthUserInfo fetchUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        Map<String, Object> body = restTemplate.exchange(
                USER_INFO_URL, HttpMethod.GET, new HttpEntity<>(headers), MAP_TYPE).getBody();

        Map<String, Object> profile = (Map<String, Object>) body.get("response");

        return OAuthUserInfo.builder()
                .provider("naver")
                .providerId(String.valueOf(profile.get("id")))
                .email((String) profile.get("email"))
                .name((String) profile.get("name"))
                .build();
    }
}
