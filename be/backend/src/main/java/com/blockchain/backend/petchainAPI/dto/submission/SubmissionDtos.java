package com.blockchain.backend.petchainAPI.dto.submission;

import com.blockchain.backend.petchainAPI.dto.common.ClaimReviewStatus;
import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.blockchain.backend.petchainAPI.dto.common.PackageAccessStatus;
import com.blockchain.backend.petchainAPI.dto.common.SubmissionStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

public final class SubmissionDtos {
    private SubmissionDtos() {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record CreateSubmissionRequest(
            @NotBlank String recordId,
            @NotBlank String insurerId
    ) {
    }

    public record CreateSubmissionResponse(
            @NotBlank String submissionId,
            @NotNull SubmissionStatus status,
            String verificationJobId,
            Instant submittedAt
    ) {
    }

    public record SubmissionStatusResponse(
            @NotBlank String submissionId,
            @NotNull SubmissionStatus status,
            CommonDtos.VerificationSummary verification,
            List<String> failureReasons,
            Instant submittedAt,
            Instant updatedAt
    ) {
    }

    public record SubmissionPackageResponse(
            @NotBlank String submissionId,
            String verificationId,
            @NotBlank String recordId,
            @NotNull PackageAccessStatus packageAccessStatus,
            CommonDtos.SignedFileUrl recordFileUrl,
            @Valid List<CommonDtos.SignedFileUrl> attachmentFileUrls,
            @NotBlank String recordHash,
            @Valid List<CommonDtos.AttachmentHash> attachmentHashes,
            CommonDtos.VerificationSummary verificationResult,
            CommonDtos.ConsentSnapshot consentSnapshot,
            CommonDtos.HospitalMinimumInfo hospital,
            CommonDtos.GuardianMinimumInfo guardian,
            CommonDtos.PetMinimumInfo pet,
            Instant submittedAt,
            Instant verifiedAt,
            String auditLogId
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record ClaimStatusRequest(
            @NotNull ClaimReviewStatus status,
            Boolean disclosable,
            String claimReferenceId
    ) {
        @AssertTrue(message = "disclosable can be true only for APPROVED_BY_INSURER or REJECTED_BY_INSURER")
        public boolean isDisclosableAllowed() {
            return !Boolean.TRUE.equals(disclosable)
                    || status == ClaimReviewStatus.APPROVED_BY_INSURER
                    || status == ClaimReviewStatus.REJECTED_BY_INSURER;
        }
    }

    public record ClaimStatusResponse(
            @NotBlank String submissionId,
            @NotNull ClaimReviewStatus status,
            Boolean disclosable,
            String auditLogId,
            Instant updatedAt
    ) {
    }
}
