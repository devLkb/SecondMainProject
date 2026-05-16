package com.blockchain.backend.petchainAPI.dto.admin;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public final class AdminDtos {
    private AdminDtos() {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record IssuePointsRequest(
            @Positive int amount,
            @NotBlank String reason
    ) {
    }

    public record IssuePointsResponse(
            @NotBlank String insurerId,
            @NotBlank String transactionId,
            int issuedAmount,
            int balance,
            String auditLogId,
            Instant issuedAt
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record ReversePointTransactionRequest(
            @NotBlank String reason
    ) {
    }

    public record ReversePointTransactionResponse(
            @NotBlank String originalTransactionId,
            @NotBlank String reversalTransactionId,
            int reversedAmount,
            String auditLogId,
            Instant reversedAt
    ) {
    }
}
