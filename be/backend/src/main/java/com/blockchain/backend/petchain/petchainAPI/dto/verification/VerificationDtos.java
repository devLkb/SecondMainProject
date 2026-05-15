package com.blockchain.backend.petchain.petchainAPI.dto.verification;

import com.blockchain.backend.petchain.petchainAPI.dto.common.CommonDtos;
import com.blockchain.backend.petchain.petchainAPI.dto.common.VerificationDataAccessStatus;
import com.blockchain.backend.petchain.petchainAPI.dto.common.VerificationStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

public final class VerificationDtos {
    private VerificationDtos() {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record VerificationRequest(
            @NotBlank String submissionId,
            @NotBlank String recordId,
            @NotBlank String hospitalId,
            @NotBlank String insurerId,
            @NotBlank String consentId,
            @NotBlank String recordHash,
            @NotBlank String requestedBy,
            @NotNull Instant requestedAt,
            String claimReferenceId,
            String petId,
            String guardianId,
            @Valid List<CommonDtos.AttachmentHash> attachmentHashes,
            String idempotencyKey
    ) {
    }

    public record VerificationResponse(
            @NotBlank String verificationId,
            @NotBlank String submissionId,
            @NotNull VerificationStatus status,
            boolean canInsurerAccessRecord,
            List<String> failureReasons,
            List<String> verifiedChecks,
            @NotBlank String recordHash,
            CommonDtos.ConsentSnapshot consentSnapshot,
            CommonDtos.DeidentifiedVerificationData deidentifiedVerificationData,
            int pointsCharged,
            int hospitalCreditAccrued,
            Instant verifiedAt,
            String auditLogId
    ) {
    }

    public record VerificationDetailResponse(
            @NotBlank String verificationId,
            @NotBlank String submissionId,
            @NotNull VerificationStatus status,
            @NotNull VerificationDataAccessStatus dataAccessStatus,
            boolean canInsurerAccessRecord,
            List<String> failureReasons,
            List<String> verifiedChecks,
            @NotBlank String recordHash,
            CommonDtos.ConsentSnapshot consentSnapshot,
            CommonDtos.DeidentifiedVerificationData deidentifiedVerificationData,
            int pointsCharged,
            int hospitalCreditAccrued,
            Instant verifiedAt,
            String auditLogId
    ) {
    }

    public record DeidentifiedDataResponse(
            @NotBlank String verificationId,
            @NotNull VerificationDataAccessStatus dataAccessStatus,
            CommonDtos.DeidentifiedVerificationData deidentifiedVerificationData
    ) {
    }

    public record AuditLogResponse(
            @NotBlank String verificationId,
            @Valid List<CommonDtos.AuditLogEntry> auditLogs
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record InternalVerifyRequest(
            String requestedBy,
            String reason,
            boolean force
    ) {
    }

    public record InternalVerifyResponse(
            @NotBlank String submissionId,
            @NotBlank String verificationId,
            @NotNull VerificationStatus status,
            List<String> failureReasons,
            String auditLogId,
            Instant verifiedAt
    ) {
    }
}
