package com.blockchain.backend.petchainAPI.dto.record;

import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class RecordDtos {
    private RecordDtos() {
    }

    // 프론트엔드는 metadata 파트로 { petId, diseases, treatments, cost, date, memo } 를 보낸다.
    // @JsonAlias 로 그 필드명을 그대로 받고, hospitalId/guardianId 는 생략 가능(서버에서 도출).
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CreateRecordRequest(
            String hospitalId,
            String guardianId,
            @NotBlank String petId,
            String insurerId,
            @JsonAlias("date") @NotNull @PastOrPresent LocalDate treatmentDate,
            @JsonAlias("cost") BigDecimal treatmentCost,
            @JsonAlias("treatments") List<@NotBlank String> treatmentCodes,
            @JsonAlias("diseases") List<@NotBlank String> diagnosisCodes,
            String memo,
            Map<String, Object> metadata
    ) {
    }

    public record CreateRecordResponse(
            @NotBlank String recordId,
            @NotBlank String recordHash,
            @Valid List<CommonDtos.AttachmentHash> attachments
    ) {
    }

    public record RecordSearchRequest(
            String guardianId,
            String petId,
            @Min(0) int page,
            @Min(1) @Max(200) int size
    ) {
    }

    public record RecordSummaryResponse(
            @NotBlank String recordId,
            @NotBlank String hospitalId,
            String guardianId,
            String petId,
            LocalDate treatmentDate,
            Instant createdAt,
            @NotBlank String recordHash
    ) {
    }

    public record RecordDetailResponse(
            @NotBlank String recordId,
            @NotBlank String hospitalId,
            String guardianId,
            String petId,
            LocalDate treatmentDate,
            BigDecimal treatmentCost,
            List<String> treatmentCodes,
            List<String> diagnosisCodes,
            @NotBlank String recordHash,
            @Valid List<CommonDtos.AttachmentHash> attachments,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record RecordListResponse(
            List<@Valid RecordSummaryResponse> records,
            int page,
            int size,
            long totalElements
    ) {
    }
}
