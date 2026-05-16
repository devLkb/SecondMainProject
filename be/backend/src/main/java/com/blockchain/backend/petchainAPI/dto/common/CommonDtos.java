package com.blockchain.backend.petchainAPI.dto.common;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class CommonDtos {
    private CommonDtos() {
    }

    public record AttachmentHash(
            @NotBlank String attachmentId,
            String fileName,
            @NotBlank String sha256
    ) {
    }

    public record SignedFileUrl(
            @NotBlank String fileId,
            String fileName,
            @NotBlank String url,
            @NotNull Instant expiresAt,
            boolean singleUse
    ) {
    }

    public record ConsentSnapshot(
            @NotBlank String consentId,
            @NotNull ConsentStatus status,
            @NotBlank String guardianId,
            @NotBlank String insurerId,
            Instant consentedAt,
            Instant expiresAt,
            Instant revokedAt
    ) {
    }

    public record HospitalMinimumInfo(
            @NotBlank String hospitalId,
            String name,
            String businessRegistrationNumber
    ) {
    }

    public record GuardianMinimumInfo(
            @NotBlank String guardianId,
            String nameMasked,
            String phoneMasked
    ) {
    }

    public record PetMinimumInfo(
            @NotBlank String petId,
            String name,
            String species,
            String breed
    ) {
    }

    public record VerificationSummary(
            String verificationId,
            VerificationStatus status,
            List<String> failureReasons,
            Instant verifiedAt
    ) {
    }

    public record DeidentifiedVerificationData(
            BigDecimal treatmentCost,
            List<String> treatmentCodes,
            List<String> diagnosisCodes,
            LocalDate treatmentDate,
            String hospitalId,
            String insurerId
    ) {
    }

    public record AuditLogEntry(
            @NotBlank String auditLogId,
            @NotBlank String eventType,
            String actorId,
            String actorOrgId,
            String actorRole,
            String resourceType,
            String resourceId,
            String submissionId,
            String verificationId,
            String result,
            String failureCode,
            int pointsDelta,
            int creditDelta,
            @NotNull Instant createdAt,
            Map<String, Object> metadata
    ) {
    }

    public record TransactionSummary(
            @NotBlank String transactionId,
            @NotBlank String transactionType,
            @PositiveOrZero int amount,
            String actorId,
            String actorOrgId,
            String relatedVerificationId,
            String relatedRecordId,
            String reason,
            @NotNull Instant createdAt
    ) {
    }
}
