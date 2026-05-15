package com.blockchain.backend.petchainAPI.error;

import java.util.Collections;
import java.util.Map;

public class ApiException extends RuntimeException {
    private final ApiErrorCode errorCode;
    private final Map<String, Object> details;

    public ApiException(ApiErrorCode errorCode, String message) {
        this(errorCode, message, Collections.emptyMap());
    }

    public ApiException(ApiErrorCode errorCode, String message, Map<String, Object> details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details == null ? Collections.emptyMap() : Map.copyOf(details);
    }

    public static ApiException validation(String message, Map<String, Object> details) {
        return new ApiException(ApiErrorCode.VALIDATION_FAILED, message, details);
    }

    public ApiErrorCode errorCode() {
        return errorCode;
    }

    public Map<String, Object> details() {
        return details;
    }
}
