package com.blockchain.backend.petchainAPI.dto.common;

public enum SubmissionStatus {
    DRAFT,
    SUBMITTED,
    VERIFICATION_PENDING,
    VERIFICATION_PASSED,
    VERIFICATION_FAILED,
    PENDING_PAYMENT,
    BLOCKED,
    SUPERSEDED,
    DELETED_BY_CONSENT_WITHDRAWAL
}
