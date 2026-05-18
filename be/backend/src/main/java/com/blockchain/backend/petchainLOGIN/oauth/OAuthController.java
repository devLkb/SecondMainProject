package com.blockchain.backend.petchainLOGIN.oauth;

import com.blockchain.backend.petchainLOGIN.dto.response.AuthResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * OAuth 2.0 Authorization Code Flow 엔드포인트
 *
 * 1. GET /api/auth/oauth/{provider}           → 제공자 인가 페이지로 리다이렉트
 * 2. GET /api/auth/oauth/{provider}/callback  → code 수신 → JWT 발급 → 프론트로 리다이렉트
 *
 * 콜백 성공 후 프론트엔드(기본 http://localhost:5173)로 아래 파라미터를 포함해 리다이렉트:
 *   ?accessToken=...&refreshToken=...&memberType=user&userId=...&memberNumber=...
 *
 * 프론트엔드에서 URL 파라미터를 읽어 localStorage에 저장하면 로그인 완료됩니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private final OAuthService oAuthService;

    // 제공자 인가 페이지로 리다이렉트
    @GetMapping("/{provider}")
    public void authorize(@PathVariable String provider,
                          HttpServletResponse response) throws IOException {
        String url = oAuthService.buildAuthorizationUrl(provider);
        response.sendRedirect(url);
    }

    // 인가 코드 수신 → 사용자 조회/생성 → 프론트로 리다이렉트
    // code는 동의 거부 시 누락되므로 required=false. error 파라미터를 먼저 확인한다.
    @GetMapping("/{provider}/callback")
    public void callback(@PathVariable String provider,
                         @RequestParam(required = false) String code,
                         @RequestParam(required = false, defaultValue = "") String state,
                         @RequestParam(required = false) String error,
                         HttpServletResponse response) throws IOException {
        if (error != null && !error.isBlank()) {
            log.warn("OAuth 동의 거부/오류 [{}]: {}", provider, error);
            redirectWithError(response, "소셜 로그인이 취소되었습니다.");
            return;
        }
        if (code == null || code.isBlank()) {
            log.warn("OAuth 콜백에 인가 코드가 없습니다 [{}]", provider);
            redirectWithError(response, "OAuth 인가 코드가 없습니다. 다시 시도해주세요.");
            return;
        }
        try {
            AuthResponse auth = oAuthService.processCallback(provider, code, state);
            response.sendRedirect(buildSuccessUrl(oAuthService.getFrontendUrl(), auth));
        } catch (Exception e) {
            log.error("OAuth 콜백 처리 실패 [{}]: {}", provider, e.getMessage());
            String errorMsg = e.getMessage() != null ? e.getMessage() : "OAuth 처리 중 오류가 발생했습니다.";
            redirectWithError(response, errorMsg);
        }
    }

    private void redirectWithError(HttpServletResponse response, String message) throws IOException {
        response.sendRedirect(oAuthService.getFrontendUrl()
                + "?oauth_error=" + URLEncoder.encode(message, StandardCharsets.UTF_8));
    }

    private String buildSuccessUrl(String base, AuthResponse auth) {
        return base
                + "?accessToken="  + enc(auth.getAccessToken())
                + "&refreshToken=" + enc(auth.getRefreshToken())
                + "&memberType="   + enc(auth.getMemberType())
                + "&userId="       + auth.getUserId()
                + "&memberNumber=" + enc(auth.getMemberNumber() != null ? auth.getMemberNumber() : "");
    }

    private static String enc(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
