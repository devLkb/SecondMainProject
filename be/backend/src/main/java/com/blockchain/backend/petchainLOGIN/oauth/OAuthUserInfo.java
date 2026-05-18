package com.blockchain.backend.petchainLOGIN.oauth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OAuthUserInfo {
    private String provider;    // google | naver | kakao
    private String providerId;  // 제공자의 고유 사용자 ID
    private String email;       // Kakao 미동의 시 null 가능
    private String name;        // 닉네임 또는 실명
}
