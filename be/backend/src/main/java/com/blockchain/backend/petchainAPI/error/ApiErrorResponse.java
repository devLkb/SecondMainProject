package com.blockchain.backend.petchainAPI.error;

import java.util.Map;

public record ApiErrorResponse(
        ApiErrorCode errorCode,
        String message,
        String traceId,
        Map<String, Object> details
) {
}
