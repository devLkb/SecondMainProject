package com.blockchain.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private Long userId;
    private String memberNumber;
    private String memberType;
    private String accessToken;
    private String refreshToken;
    private String message;
}
