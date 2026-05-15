package com.blockchain.backend.petchain.petchainAPI.error;

import org.springframework.http.HttpStatus;

public enum ApiErrorCode {
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND),
    CONFLICT(HttpStatus.CONFLICT),

    UNAUTHORIZED_INSURER(HttpStatus.UNAUTHORIZED),
    FORBIDDEN_ORG_SCOPE(HttpStatus.FORBIDDEN),
    INSUFFICIENT_POINTS(HttpStatus.PAYMENT_REQUIRED),
    VERIFICATION_DATA_BLOCKED_BY_CONSENT(HttpStatus.CONFLICT),
    VERIFICATION_DATA_EXPIRED(HttpStatus.GONE),
    VERIFICATION_DATA_NOT_FOUND(HttpStatus.NOT_FOUND),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),

    SUBMISSION_NOT_FOUND(HttpStatus.NOT_FOUND),
    HOSPITAL_INVALID(HttpStatus.FORBIDDEN),
    INSURER_INVALID(HttpStatus.FORBIDDEN),
    CONSENT_MISSING(HttpStatus.CONFLICT),
    CONSENT_REVOKED(HttpStatus.CONFLICT),
    CONSENT_EXPIRED(HttpStatus.CONFLICT),
    INSURER_MISMATCH(HttpStatus.FORBIDDEN),
    RECORD_HASH_MISMATCH(HttpStatus.CONFLICT),
    INVALID_SUBMISSION_STATUS(HttpStatus.CONFLICT),

    PACKAGE_BLOCKED_BY_CONSENT(HttpStatus.CONFLICT),
    PACKAGE_BLOCKED_BY_PERMISSION(HttpStatus.FORBIDDEN),
    PACKAGE_SUPERSEDED(HttpStatus.CONFLICT),
    PACKAGE_DELETED(HttpStatus.GONE),
    PACKAGE_EXPIRED(HttpStatus.GONE),

    AUDIT_LOG_WRITE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus httpStatus;

    ApiErrorCode(HttpStatus httpStatus) {
        this.httpStatus = httpStatus;
    }

    public HttpStatus httpStatus() {
        return httpStatus;
    }
}
