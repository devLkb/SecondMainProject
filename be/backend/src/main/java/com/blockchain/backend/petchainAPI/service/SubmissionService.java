package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.common.ClaimReviewStatus;
import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.blockchain.backend.petchainAPI.dto.common.PackageAccessStatus;
import com.blockchain.backend.petchainAPI.dto.common.SubmissionStatus;
import com.blockchain.backend.petchainAPI.dto.submission.SubmissionDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.SubmissionApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.ClaimPackage;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.MedicalRecord;
import com.blockchain.backend.petchainDB.entity.MedicalRecordFile;
import com.blockchain.backend.petchainDB.entity.PetInsurance;
import com.blockchain.backend.petchainDB.repository.ClaimPackageRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordFileRepository;
import com.blockchain.backend.petchainDB.repository.PetInsuranceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubmissionService implements SubmissionApiPort {
    private final ApiDomainSupport support;
    private final ClaimPackageRepository claimPackageRepository;
    private final PetInsuranceRepository petInsuranceRepository;
    private final MedicalRecordFileRepository medicalRecordFileRepository;

    @Override
    @Transactional
    public SubmissionDtos.CreateSubmissionResponse createSubmission(ApiActor actor, SubmissionDtos.CreateSubmissionRequest request) {
        MedicalRecord record = support.recordByRecordId(request.recordId());
        InsuranceCompany insurer = support.insurerByExternalId(request.insurerId());
        support.requireInsurerScope(actor, insurer);
        ClaimPackage claim = claimPackageRepository
                .findByMedicalRecord_RecordIdAndInsuranceCompany_Id(record.getRecordId(), insurer.getId())
                .orElseGet(() -> createClaim(record, record.getPet().getGuardian(), insurer));
        if (!"active".equalsIgnoreCase(claim.getConsentStatus())) {
            throw new ApiException(ApiErrorCode.CONSENT_MISSING, "활성 동의가 없습니다.");
        }
        claim.setClaimStatus("requested");
        ClaimPackage saved = claimPackageRepository.save(claim);
        return new SubmissionDtos.CreateSubmissionResponse(
                saved.getClaimId(),
                support.submissionStatus(saved),
                null,
                support.toInstant(saved.getCreatedAt())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionDtos.SubmissionStatusResponse getSubmission(ApiActor actor, String submissionId) {
        ClaimPackage claim = support.claimBySubmissionId(submissionId);
        return new SubmissionDtos.SubmissionStatusResponse(
                claim.getClaimId(),
                support.submissionStatus(claim),
                support.latestVerificationSummary(claim),
                "revoked".equalsIgnoreCase(claim.getConsentStatus()) ? List.of("CONSENT_REVOKED") : List.of(),
                support.toInstant(claim.getCreatedAt()),
                support.toInstant(claim.getUpdatedAt())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public SubmissionDtos.SubmissionPackageResponse getSubmissionPackage(ApiActor actor, String submissionId) {
        ClaimPackage claim = support.claimBySubmissionId(submissionId);
        if (!"active".equalsIgnoreCase(claim.getConsentStatus())) {
            throw new ApiException(ApiErrorCode.PACKAGE_BLOCKED_BY_CONSENT, "동의가 활성 상태가 아닙니다.");
        }
        MedicalRecord record = claim.getMedicalRecord();
        List<MedicalRecordFile> files = medicalRecordFileRepository.findByMedicalRecord_IdAndIsDeletedFalse(record.getId());
        CommonDtos.SignedFileUrl recordFile = files.stream()
                .filter(f -> "record".equalsIgnoreCase(f.getFileType()))
                .findFirst()
                .map(this::signedFileUrl)
                .orElse(null);
        List<CommonDtos.SignedFileUrl> attachments = files.stream()
                .filter(f -> !"record".equalsIgnoreCase(f.getFileType()))
                .map(this::signedFileUrl)
                .toList();
        var verification = support.latestVerificationSummary(claim);
        return new SubmissionDtos.SubmissionPackageResponse(
                claim.getClaimId(),
                verification == null ? null : verification.verificationId(),
                record.getRecordId(),
                PackageAccessStatus.AVAILABLE,
                recordFile,
                attachments,
                record.getDetailDataHash(),
                support.attachmentHashes(record),
                verification,
                support.consentSnapshot(claim),
                new CommonDtos.HospitalMinimumInfo(String.valueOf(record.getHospital().getId()), record.getHospital().getName(), record.getHospital().getBusinessNumber()),
                new CommonDtos.GuardianMinimumInfo(String.valueOf(claim.getGuardian().getId()), mask(claim.getGuardian().getName()), mask(claim.getGuardian().getPhone())),
                new CommonDtos.PetMinimumInfo(String.valueOf(record.getPet().getId()), record.getPet().getName(), record.getPet().getSpecies(), record.getPet().getBreed()),
                support.toInstant(claim.getCreatedAt()),
                claim.getVerifiedAt() == null ? null : support.toInstant(claim.getVerifiedAt()),
                claim.getClaimId()
        );
    }

    @Override
    @Transactional
    public SubmissionDtos.ClaimStatusResponse updateClaimStatus(ApiActor actor, String submissionId, SubmissionDtos.ClaimStatusRequest request) {
        ClaimPackage claim = support.claimBySubmissionId(submissionId);
        support.requireInsurerScope(actor, claim.getInsuranceCompany());
        claim.setReviewNote(request.claimReferenceId());
        claim.setReviewResult(mapReviewResult(request.status()));
        claim.setClaimStatus(mapClaimStatus(request.status()));
        claim.setReviewedAt(java.time.LocalDateTime.now());
        return new SubmissionDtos.ClaimStatusResponse(
                claim.getClaimId(),
                request.status(),
                request.disclosable(),
                claim.getClaimId(),
                Instant.now()
        );
    }

    private ClaimPackage createClaim(MedicalRecord record, Guardian guardian, InsuranceCompany insurer) {
        PetInsurance policy = petInsuranceRepository.findFirstByPet_IdAndInsuranceCompany_Id(record.getPet().getId(), insurer.getId())
                .orElseGet(() -> createPolicy(record, guardian, insurer));
        ClaimPackage claim = new ClaimPackage();
        claim.setMedicalRecord(record);
        claim.setGuardian(guardian);
        claim.setInsuranceCompany(insurer);
        claim.setPetInsurance(policy);
        claim.setConsentStatus("pending");
        claim.setClaimStatus("pending");
        return claim;
    }

    private PetInsurance createPolicy(MedicalRecord record, Guardian guardian, InsuranceCompany insurer) {
        PetInsurance policy = new PetInsurance();
        policy.setPet(record.getPet());
        policy.setGuardian(guardian);
        policy.setInsuranceCompany(insurer);
        policy.setProductName("PetChain 기본 연동 보험");
        policy.setPolicyNumber("POL-" + record.getPet().getId() + "-" + insurer.getId());
        policy.setStartDate(LocalDate.now());
        policy.setStatus("active");
        return petInsuranceRepository.save(policy);
    }

    private CommonDtos.SignedFileUrl signedFileUrl(MedicalRecordFile file) {
        return new CommonDtos.SignedFileUrl(
                String.valueOf(file.getId()),
                file.getOriginalFilename(),
                "/api/records/" + file.getMedicalRecord().getId() + "/files/" + file.getId(),
                Instant.now().plusSeconds(600),
                true
        );
    }

    private static String mapReviewResult(ClaimReviewStatus status) {
        return switch (status) {
            case APPROVED_BY_INSURER -> "approved";
            case REJECTED_BY_INSURER -> "rejected";
            default -> null;
        };
    }

    private static String mapClaimStatus(ClaimReviewStatus status) {
        return switch (status) {
            case APPROVED_BY_INSURER -> "approved";
            case REJECTED_BY_INSURER -> "rejected";
            case UNDER_REVIEW, RECEIVED_BY_INSURER -> "verified";
            case CLOSED -> "closed";
        };
    }

    private static String mask(String value) {
        if (value == null || value.isBlank()) return null;
        if (value.length() <= 1) return "*";
        return value.charAt(0) + "*".repeat(Math.min(3, value.length() - 1));
    }
}
