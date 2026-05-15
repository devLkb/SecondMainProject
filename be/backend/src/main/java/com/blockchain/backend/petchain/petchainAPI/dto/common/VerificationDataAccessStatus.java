package com.blockchain.backend.petchain.petchainAPI.dto.common;

public enum VerificationDataAccessStatus {
    AVAILABLE,
    BLOCKED_BY_CONSENT,
    BLOCKED_BY_PERMISSION,
    BLOCKED_BY_POINTS,
    RATE_LIMITED,
    EXPIRED
}
