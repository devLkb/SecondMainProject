package com.blockchain.backend.petchainAPI.dto.flag;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;

// 이상 신고(flag) 생성·처리·조회 DTO. 프론트(보험사/플랫폼 대시보드)가 쓰는 필드명에 맞춘다.
public final class FlagDtos {
    private FlagDtos() {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CreateFlagRequest(
            @NotBlank String recordId,
            String verificationId,
            @NotBlank String reasonCode,
            String note
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ResolveFlagRequest(
            @NotBlank String resolveCode,
            String resolveNote
    ) {
    }

    public record FlagResponse(
            String flagId,
            String recordId,
            String verificationId,
            String pet,
            String hospital,
            String disease,
            BigDecimal cost,
            String reasonCode,
            String reasonLabel,
            String note,
            Instant flaggedAt,
            String status,
            String reportedBy,
            String resolveCode,
            String resolveNote,
            Instant resolvedAt
    ) {
    }
}
