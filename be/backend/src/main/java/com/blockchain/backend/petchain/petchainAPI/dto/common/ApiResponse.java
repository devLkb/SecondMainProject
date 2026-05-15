package com.blockchain.backend.petchain.petchainAPI.dto.common;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

public record ApiResponse<T>(T data, String traceId) {
    public static <T> ApiResponse<T> of(T data, HttpServletRequest request) {
        return new ApiResponse<>(data, traceId(request));
    }

    private static String traceId(HttpServletRequest request) {
        String headerTraceId = request.getHeader("X-Trace-Id");
        if (headerTraceId != null && !headerTraceId.isBlank()) {
            return headerTraceId;
        }
        return UUID.randomUUID().toString();
    }
}
