package com.blockchain.backend.petchainAPI.dto.point;

import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;
import java.util.List;

public final class PointDtos {
    private PointDtos() {
    }

    public record PointBalanceResponse(
            @NotBlank String insurerId,
            @Min(0) int balance,
            Instant updatedAt
    ) {
    }

    public record TransactionSearchRequest(
            String insurerId,
            String hospitalId,
            String type,
            String from,
            String to,
            @Min(0) int page,
            @Min(1) int size
    ) {
    }

    public record TransactionListResponse(
            @Valid List<CommonDtos.TransactionSummary> transactions,
            int page,
            int size,
            long totalElements
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record SpendSaasCreditsRequest(
            @NotBlank String featureCode,
            @NotBlank String requestedBy
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record ChargePointsRequest(
            @Positive int amount
    ) {
    }

    public record SpendSaasCreditsResponse(
            @NotBlank String entitlementId,
            @NotBlank String hospitalId,
            @NotBlank String featureCode,
            @Positive int creditsSpent,
            @NotNull Instant validFrom,
            @NotNull Instant expiresAt,
            String auditLogId
    ) {
    }
}
