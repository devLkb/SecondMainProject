package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.common.DomainValues;
import com.blockchain.backend.petchainAPI.dto.common.VerificationDataAccessStatus;
import com.blockchain.backend.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.VerificationApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.ClaimPackage;
import com.blockchain.backend.petchainDB.entity.PointBalance;
import com.blockchain.backend.petchainDB.entity.PointTransaction;
import com.blockchain.backend.petchainDB.entity.VerificationLog;
import com.blockchain.backend.petchainDB.repository.ClaimPackageRepository;
import com.blockchain.backend.petchainDB.repository.PointBalanceRepository;
import com.blockchain.backend.petchainDB.repository.PointTransactionRepository;
import com.blockchain.backend.petchainDB.repository.VerificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VerificationService implements VerificationApiPort {
    private final ApiDomainSupport support;
    private final ClaimPackageRepository claimPackageRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final PointTransactionRepository pointTransactionRepository;

    @Override
    @Transactional
    public VerificationDtos.VerificationResponse verifySubmission(ApiActor actor,
                                                                  String submissionId,
                                                                  VerificationDtos.VerificationRequest request,
                                                                  String idempotencyKeyHeader) {
        ClaimPackage claim = support.claimBySubmissionId(submissionId);
        support.requireInsurerScope(actor, claim.getInsuranceCompany());
        if (!claim.getMedicalRecord().getRecordId().equals(request.recordId())) {
            throw ApiException.validation("recordId가 제출 건과 일치하지 않습니다.", java.util.Map.of("recordId", request.recordId()));
        }
        if (!claim.getMedicalRecord().getDetailDataHash().equals(request.recordHash())) {
            return persistVerification(claim, request.requestedBy(), "hash_mismatch", 0).toResponse(false);
        }
        if (!"active".equalsIgnoreCase(claim.getConsentStatus())) {
            return persistVerification(claim, request.requestedBy(), "consent_revoked", 0).toResponse(false);
        }

        PointBalance insurerBalance = balance(DomainValues.PointOwnerType.INSURANCE, claim.getInsuranceCompany().getId());
        if (insurerBalance.getBalance() < ApiDomainSupport.VERIFY_POINT_COST) {
            throw new ApiException(ApiErrorCode.INSUFFICIENT_POINTS, "Insurer point balance is insufficient");
        }
        insurerBalance.setBalance(insurerBalance.getBalance() - ApiDomainSupport.VERIFY_POINT_COST);
        PointBalance hospitalBalance = balance(DomainValues.PointOwnerType.HOSPITAL, claim.getMedicalRecord().getHospital().getId());
        hospitalBalance.setBalance(hospitalBalance.getBalance() + ApiDomainSupport.HOSPITAL_VERIFY_CREDIT);

        PointTransaction spend = transaction("spend", DomainValues.PointOwnerType.INSURANCE, claim.getInsuranceCompany().getId(), DomainValues.PointOwnerType.HOSPITAL, claim.getMedicalRecord().getHospital().getId(), ApiDomainSupport.VERIFY_POINT_COST, "검증 API 호출", claim);
        pointTransactionRepository.save(spend);
        claim.setClaimStatus("verified");
        claim.setVerifiedAt(java.time.LocalDateTime.now());
        claimPackageRepository.save(claim);
        return persistVerification(claim, request.requestedBy(), "verified", ApiDomainSupport.VERIFY_POINT_COST).toResponse(true);
    }

    @Override
    @Transactional(readOnly = true)
    public VerificationDtos.VerificationDetailResponse getVerification(ApiActor actor, String verificationId) {
        VerificationLog log = support.verificationById(verificationId);
        return detailResponse(log);
    }

    @Override
    @Transactional(readOnly = true)
    public VerificationDtos.DeidentifiedDataResponse getDeidentifiedData(ApiActor actor, String verificationId) {
        VerificationLog log = support.verificationById(verificationId);
        boolean available = "verified".equalsIgnoreCase(log.getResult()) && "active".equalsIgnoreCase(log.getClaimPackage().getConsentStatus());
        return new VerificationDtos.DeidentifiedDataResponse(
                support.verificationId(log),
                available ? VerificationDataAccessStatus.AVAILABLE : VerificationDataAccessStatus.BLOCKED_BY_CONSENT,
                available ? support.deidentifiedData(log.getClaimPackage()) : null
        );
    }

    @Override
    @Transactional(readOnly = true)
    public VerificationDtos.AuditLogResponse getVerificationAudit(ApiActor actor, String verificationId) {
        VerificationLog log = support.verificationById(verificationId);
        return new VerificationDtos.AuditLogResponse(support.verificationId(log), support.verificationAuditEntries(log));
    }

    private PersistedVerification persistVerification(ClaimPackage claim, String requestedBy, String result, int pointsSpent) {
        VerificationLog log = new VerificationLog();
        log.setClaimPackage(claim);
        log.setInsuranceCompany(claim.getInsuranceCompany());
        log.setResult(result);
        log.setPointsSpent(pointsSpent);
        log.setRequestedBy(requestedBy);
        VerificationLog saved = verificationLogRepository.save(log);
        return new PersistedVerification(saved);
    }

    private VerificationDtos.VerificationDetailResponse detailResponse(VerificationLog log) {
        boolean canAccess = "verified".equalsIgnoreCase(log.getResult()) && "active".equalsIgnoreCase(log.getClaimPackage().getConsentStatus());
        return new VerificationDtos.VerificationDetailResponse(
                support.verificationId(log),
                log.getClaimPackage().getClaimId(),
                support.verificationStatus(log),
                canAccess ? VerificationDataAccessStatus.AVAILABLE : VerificationDataAccessStatus.BLOCKED_BY_CONSENT,
                canAccess,
                support.failureReasons(log),
                canAccess ? List.of("CONSENT_ACTIVE", "RECORD_HASH_MATCHED", "POINT_CHARGED") : List.of(),
                log.getClaimPackage().getMedicalRecord().getDetailDataHash(),
                support.consentSnapshot(log.getClaimPackage()),
                canAccess ? support.deidentifiedData(log.getClaimPackage()) : null,
                log.getPointsSpent(),
                canAccess ? ApiDomainSupport.HOSPITAL_VERIFY_CREDIT : 0,
                support.toInstant(log.getRequestedAt()),
                "verification-" + log.getId()
        );
    }

    private PointBalance balance(String ownerType, Long ownerId) {
        return pointBalanceRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
                .orElseGet(() -> {
                    PointBalance balance = new PointBalance();
                    balance.setOwnerType(ownerType);
                    balance.setOwnerId(ownerId);
                    balance.setBalance(0);
                    return pointBalanceRepository.save(balance);
                });
    }

    private static PointTransaction transaction(String type,
                                                String fromType,
                                                Long fromId,
                                                String toType,
                                                Long toId,
                                                int amount,
                                                String description,
                                                ClaimPackage claim) {
        PointTransaction tx = new PointTransaction();
        tx.setTxType(type);
        tx.setFromOwnerType(fromType);
        tx.setFromOwnerId(fromId);
        tx.setToOwnerType(toType);
        tx.setToOwnerId(toId);
        tx.setAmount(amount);
        tx.setDescription(description);
        tx.setRelatedClaim(claim);
        return tx;
    }

    private class PersistedVerification {
        private final VerificationLog log;

        PersistedVerification(VerificationLog log) {
            this.log = log;
        }

        VerificationDtos.VerificationResponse toResponse(boolean success) {
            return new VerificationDtos.VerificationResponse(
                    support.verificationId(log),
                    log.getClaimPackage().getClaimId(),
                    support.verificationStatus(log),
                    success,
                    support.failureReasons(log),
                    success ? List.of("CONSENT_ACTIVE", "RECORD_HASH_MATCHED", "POINT_CHARGED") : List.of(),
                    log.getClaimPackage().getMedicalRecord().getDetailDataHash(),
                    support.consentSnapshot(log.getClaimPackage()),
                    success ? support.deidentifiedData(log.getClaimPackage()) : null,
                    log.getPointsSpent(),
                    success ? ApiDomainSupport.HOSPITAL_VERIFY_CREDIT : 0,
                    support.toInstant(log.getRequestedAt()),
                    "verification-" + log.getId()
            );
        }
    }
}
