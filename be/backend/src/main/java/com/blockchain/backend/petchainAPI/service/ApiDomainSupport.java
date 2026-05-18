package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.common.DomainValues;
import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.blockchain.backend.petchainAPI.dto.common.ConsentStatus;
import com.blockchain.backend.petchainAPI.dto.common.SubmissionStatus;
import com.blockchain.backend.petchainAPI.dto.common.VerificationStatus;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.security.ActorType;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.ClaimPackage;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Hospital;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.MedicalRecord;
import com.blockchain.backend.petchainDB.entity.MedicalRecordDisease;
import com.blockchain.backend.petchainDB.entity.MedicalRecordFile;
import com.blockchain.backend.petchainDB.entity.MedicalRecordTreatment;
import com.blockchain.backend.petchainDB.entity.Pet;
import com.blockchain.backend.petchainDB.entity.PointTransaction;
import com.blockchain.backend.petchainDB.entity.VerificationLog;
import com.blockchain.backend.petchainDB.repository.ClaimPackageRepository;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.HospitalRepository;
import com.blockchain.backend.petchainDB.repository.InsuranceCompanyRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordDiseaseRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordFileRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordTreatmentRepository;
import com.blockchain.backend.petchainDB.repository.PointTransactionRepository;
import com.blockchain.backend.petchainDB.repository.VerificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

@Component
@RequiredArgsConstructor
class ApiDomainSupport {
    static final int VERIFY_POINT_COST = 1;
    static final int HOSPITAL_VERIFY_CREDIT = 1;

    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalRecordFileRepository medicalRecordFileRepository;
    private final MedicalRecordTreatmentRepository medicalRecordTreatmentRepository;
    private final MedicalRecordDiseaseRepository medicalRecordDiseaseRepository;
    private final ClaimPackageRepository claimPackageRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final HospitalRepository hospitalRepository;
    private final GuardianRepository guardianRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;

    MedicalRecord recordByRecordId(String recordId) {
        return medicalRecordRepository.findByRecordId(recordId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "진료기록을 찾을 수 없습니다."));
    }

    ClaimPackage claimBySubmissionId(String submissionId) {
        return claimPackageRepository.findByClaimId(submissionId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.SUBMISSION_NOT_FOUND, "제출 건을 찾을 수 없습니다."));
    }

    VerificationLog verificationById(String verificationId) {
        Long id = parseNumericId(verificationId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.VERIFICATION_DATA_NOT_FOUND, "검증 결과를 찾을 수 없습니다."));
        return verificationLogRepository.findById(id)
                .orElseThrow(() -> new ApiException(ApiErrorCode.VERIFICATION_DATA_NOT_FOUND, "검증 결과를 찾을 수 없습니다."));
    }

    Optional<Long> parseNumericId(String value) {
        if (value == null || value.isBlank()) return Optional.empty();
        String digits = value.trim().replaceFirst("^[A-Za-z]+-", "");
        try {
            return Optional.of(Long.parseLong(digits));
        } catch (NumberFormatException ignored) {
            return Optional.empty();
        }
    }

    Hospital hospitalByExternalId(String hospitalId) {
        return parseNumericId(hospitalId)
                .flatMap(hospitalRepository::findById)
                .or(() -> hospitalRepository.findAll().stream()
                        .filter(h -> Objects.equals(h.getMemberNumber(), hospitalId) || Objects.equals(h.getFabricOrgId(), hospitalId))
                        .findFirst())
                .orElseThrow(() -> new ApiException(ApiErrorCode.HOSPITAL_INVALID, "병원을 찾을 수 없습니다."));
    }

    Guardian guardianByExternalId(String guardianId) {
        return parseNumericId(guardianId)
                .flatMap(guardianRepository::findById)
                .or(() -> guardianRepository.findAll().stream()
                        .filter(g -> Objects.equals(g.getMemberNumber(), guardianId))
                        .findFirst())
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "보호자를 찾을 수 없습니다."));
    }

    InsuranceCompany insurerByExternalId(String insurerId) {
        return parseNumericId(insurerId)
                .flatMap(insuranceCompanyRepository::findById)
                .or(() -> insuranceCompanyRepository.findAll().stream()
                        .filter(i -> Objects.equals(i.getMemberNumber(), insurerId) || Objects.equals(i.getFabricOrgId(), insurerId))
                        .findFirst())
                .orElseThrow(() -> new ApiException(ApiErrorCode.INSURER_INVALID, "보험사를 찾을 수 없습니다."));
    }

    Pet petByExternalId(List<Pet> candidates, String petId) {
        return parseNumericId(petId)
                .flatMap(id -> candidates.stream().filter(p -> p.getId().equals(id)).findFirst())
                .or(() -> candidates.stream().filter(p -> Objects.equals(p.getPetNumber(), petId)).findFirst())
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "반려동물을 찾을 수 없습니다."));
    }

    void requireHospitalScope(ApiActor actor, Hospital hospital) {
        if (actor.actorType() == ActorType.UNKNOWN) return;
        if (actor.actorType() != ActorType.HOSPITAL || !Objects.equals(parseActorUserId(actor), hospital.getUser().getId())) {
            throw new ApiException(ApiErrorCode.FORBIDDEN_ORG_SCOPE, "병원 권한이 없습니다.");
        }
    }

    void requireGuardianScope(ApiActor actor, Guardian guardian) {
        if (actor.actorType() == ActorType.UNKNOWN) return;
        if (actor.actorType() != ActorType.GUARDIAN && actor.actorType() != ActorType.UNKNOWN) {
            throw new ApiException(ApiErrorCode.FORBIDDEN_ORG_SCOPE, "보호자 권한이 없습니다.");
        }
        if (!Objects.equals(parseActorUserId(actor), guardian.getUser().getId())) {
            throw new ApiException(ApiErrorCode.FORBIDDEN_ORG_SCOPE, "보호자 범위가 일치하지 않습니다.");
        }
    }

    void requireInsurerScope(ApiActor actor, InsuranceCompany insurer) {
        if (actor.actorType() == ActorType.UNKNOWN) return;
        if (actor.actorType() != ActorType.INSURER || !Objects.equals(parseActorUserId(actor), insurer.getUser().getId())) {
            throw new ApiException(ApiErrorCode.UNAUTHORIZED_INSURER, "보험사 권한이 없습니다.");
        }
    }

    void requireAdmin(ApiActor actor) {
        if (actor.actorType() == ActorType.UNKNOWN) return;
        if (actor.actorType() != ActorType.ADMIN && !"admin".equalsIgnoreCase(actor.actorRole()) && !"platform".equalsIgnoreCase(actor.actorRole())) {
            throw new ApiException(ApiErrorCode.FORBIDDEN_ORG_SCOPE, "관리자 권한이 없습니다.");
        }
    }

    Long parseActorUserId(ApiActor actor) {
        return parseNumericId(actor.actorId()).orElse(null);
    }

    ConsentStatus consentStatus(ClaimPackage claim) {
        String status = lower(claim.getConsentStatus());
        if ("active".equals(status)) return ConsentStatus.ACTIVE;
        if ("revoked".equals(status)) return ConsentStatus.REVOKED;
        return ConsentStatus.EXPIRED;
    }

    SubmissionStatus submissionStatus(ClaimPackage claim) {
        if ("revoked".equals(lower(claim.getConsentStatus()))) return SubmissionStatus.DELETED_BY_CONSENT_WITHDRAWAL;
        return switch (lower(claim.getClaimStatus())) {
            case "verified" -> SubmissionStatus.VERIFICATION_PASSED;
            case "verification_failed" -> SubmissionStatus.VERIFICATION_FAILED;
            case "requested" -> SubmissionStatus.SUBMITTED;
            case "approved", "rejected" -> SubmissionStatus.VERIFICATION_PASSED;
            default -> SubmissionStatus.DRAFT;
        };
    }

    VerificationStatus verificationStatus(VerificationLog log) {
        return switch (lower(log.getResult())) {
            case "verified" -> VerificationStatus.PASSED;
            case "consent_revoked" -> VerificationStatus.BLOCKED;
            case "hash_mismatch", "duplicate", "error" -> VerificationStatus.FAILED;
            default -> VerificationStatus.PENDING;
        };
    }

    List<String> failureReasons(VerificationLog log) {
        return "verified".equals(lower(log.getResult())) ? List.of() : List.of(log.getResult());
    }

    List<String> treatmentCodes(MedicalRecord record) {
        List<String> codes = medicalRecordTreatmentRepository.findByMedicalRecord_Id(record.getId()).stream()
                .map(MedicalRecordTreatment::getTreatmentCode)
                .filter(Objects::nonNull)
                .map(c -> c.getCode())
                .toList();
        if (!codes.isEmpty()) return codes;
        return splitCodes(record.getPrescriptionEncrypted());
    }

    List<String> diagnosisCodes(MedicalRecord record) {
        List<String> codes = medicalRecordDiseaseRepository.findByMedicalRecord_Id(record.getId()).stream()
                .map(MedicalRecordDisease::getDiseaseCode)
                .filter(Objects::nonNull)
                .map(c -> c.getCode())
                .toList();
        if (!codes.isEmpty()) return codes;
        return splitCodes(record.getFindingsEncrypted());
    }

    List<CommonDtos.AttachmentHash> attachmentHashes(MedicalRecord record) {
        return medicalRecordFileRepository.findByMedicalRecord_IdAndIsDeletedFalse(record.getId()).stream()
                .map(file -> new CommonDtos.AttachmentHash(String.valueOf(file.getId()), file.getOriginalFilename(), shaOrKey(file)))
                .toList();
    }

    CommonDtos.ConsentSnapshot consentSnapshot(ClaimPackage claim) {
        Instant consentedAt = toInstant(claim.getConsentedAt());
        Instant revokedAt = "revoked".equals(lower(claim.getConsentStatus())) ? toInstant(claim.getUpdatedAt()) : null;
        Instant expiresAt = consentedAt == null ? null : consentedAt.plusSeconds(365L * 24 * 60 * 60);
        return new CommonDtos.ConsentSnapshot(
                claim.getClaimId(),
                consentStatus(claim),
                String.valueOf(claim.getGuardian().getId()),
                String.valueOf(claim.getInsuranceCompany().getId()),
                consentedAt,
                expiresAt,
                revokedAt
        );
    }

    CommonDtos.DeidentifiedVerificationData deidentifiedData(ClaimPackage claim) {
        MedicalRecord record = claim.getMedicalRecord();
        return new CommonDtos.DeidentifiedVerificationData(
                BigDecimal.valueOf(record.getTotalCost()),
                treatmentCodes(record),
                diagnosisCodes(record),
                record.getTreatmentDate(),
                String.valueOf(record.getHospital().getId()),
                String.valueOf(claim.getInsuranceCompany().getId())
        );
    }

    CommonDtos.VerificationSummary latestVerificationSummary(ClaimPackage claim) {
        return verificationLogRepository.findByClaimPackage_Id(claim.getId()).stream()
                .max(Comparator.comparing(VerificationLog::getRequestedAt))
                .map(log -> new CommonDtos.VerificationSummary(verificationId(log), verificationStatus(log), failureReasons(log), toInstant(log.getRequestedAt())))
                .orElse(null);
    }

    List<CommonDtos.AuditLogEntry> verificationAuditEntries(VerificationLog log) {
        return List.of(new CommonDtos.AuditLogEntry(
                "verification-" + log.getId(),
                "VERIFICATION_" + log.getResult().toUpperCase(Locale.ROOT),
                log.getRequestedBy(),
                String.valueOf(log.getInsuranceCompany().getId()),
                "INSURER",
                "verification",
                verificationId(log),
                log.getClaimPackage().getClaimId(),
                verificationId(log),
                log.getResult(),
                "verified".equals(lower(log.getResult())) ? null : log.getResult(),
                -log.getPointsSpent(),
                "verified".equals(lower(log.getResult())) ? HOSPITAL_VERIFY_CREDIT : 0,
                toInstant(log.getRequestedAt()),
                java.util.Map.of("claimId", log.getClaimPackage().getClaimId())
        ));
    }

    CommonDtos.TransactionSummary transactionSummary(PointTransaction tx) {
        return new CommonDtos.TransactionSummary(
                String.valueOf(tx.getId()),
                tx.getTxType(),
                Math.abs(tx.getAmount()),
                tx.getFromOwnerId() == null ? null : String.valueOf(tx.getFromOwnerId()),
                tx.getFromOwnerType(),
                tx.getRelatedClaim() == null ? null : tx.getRelatedClaim().getClaimId(),
                tx.getRelatedClaim() == null ? null : tx.getRelatedClaim().getMedicalRecord().getRecordId(),
                tx.getDescription(),
                toInstant(tx.getCreatedAt())
        );
    }

    String verificationId(VerificationLog log) {
        return "VER-" + log.getId();
    }

    Instant toInstant(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }

    private static String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private static String shaOrKey(MedicalRecordFile file) {
        String key = file.getS3Key() == null ? String.valueOf(file.getId()) : file.getS3Key();
        int idx = key.lastIndexOf('/');
        return idx >= 0 && idx + 1 < key.length() ? key.substring(idx + 1) : key;
    }

    private static List<String> splitCodes(String stored) {
        if (stored == null || stored.isBlank()) return List.of();
        return java.util.Arrays.stream(stored.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }
}
