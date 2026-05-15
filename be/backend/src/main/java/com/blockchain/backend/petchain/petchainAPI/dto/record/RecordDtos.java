package com.blockchain.backend.petchain.petchainAPI.dto.record;

import com.blockchain.backend.petchain.petchainAPI.dto.common.CommonDtos;
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

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record CreateRecordRequest(
            @NotBlank String hospitalId,
            @NotBlank String guardianId,
            @NotBlank String petId,
            String insurerId,
            @NotNull @PastOrPresent LocalDate treatmentDate,
            BigDecimal treatmentCost,
            List<@NotBlank String> treatmentCodes,
            List<@NotBlank String> diagnosisCodes,
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
