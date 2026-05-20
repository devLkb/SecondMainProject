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

        // Idempotent: 이미 verified 이고 동의가 여전히 active 일 때만 기존 verification_log 를 그대로 돌려준다.
        // 같은 record 에 verify 가 N번 호출되어도 포인트가 한 번만 차감되도록 한다.
        // consent 가 revoked 면 아래 일반 분기로 떨어져서 consent_revoked 로그를 새로 남기고 BLOCKED 응답을 낸다
        // (이전 PASSED 응답을 재사용하면 보호자 동의 철회 후에도 비식별 데이터가 누출됨).
        if ("verified".equalsIgnoreCase(claim.getClaimStatus())
                && "active".equalsIgnoreCase(claim.getConsentStatus())) {
            VerificationLog existing = verificationLogRepository.findByClaimPackage_Id(claim.getId()).stream()
                    .filter(log -> "verified".equalsIgnoreCase(log.getResult()))
                    .max(java.util.Comparator.comparing(VerificationLog::getRequestedAt))
                    .orElse(null);
            if (existing != null) {
                // 이번 호출에선 실제로 차감/적립이 일어나지 않았으므로 pointsCharged=0, hospitalCredit=0 으로 응답한다.
                return new PersistedVerification(existing).toResponse(true, true);
            }
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
            return toResponse(success, false);
        }

        // idempotent=true 이면 이번 호출에서 새로 일어난 변화가 없다는 뜻이므로
        // pointsCharged·hospitalCredit 을 0 으로, checks 에는 ALREADY_VERIFIED 를 표시한다.
        VerificationDtos.VerificationResponse toResponse(boolean success, boolean idempotent) {
            List<String> checks;
            if (!success) {
                checks = List.of();
            } else if (idempotent) {
                checks = List.of("CONSENT_ACTIVE", "RECORD_HASH_MATCHED", "ALREADY_VERIFIED");
            } else {
                checks = List.of("CONSENT_ACTIVE", "RECORD_HASH_MATCHED", "POINT_CHARGED");
            }
            int pointsCharged = idempotent ? 0 : log.getPointsSpent();
            int hospitalCredit = (success && !idempotent) ? ApiDomainSupport.HOSPITAL_VERIFY_CREDIT : 0;
            return new VerificationDtos.VerificationResponse(
                    support.verificationId(log),
                    log.getClaimPackage().getClaimId(),
                    support.verificationStatus(log),
                    success,
                    support.failureReasons(log),
                    checks,
                    log.getClaimPackage().getMedicalRecord().getDetailDataHash(),
                    support.consentSnapshot(log.getClaimPackage()),
                    success ? support.deidentifiedData(log.getClaimPackage()) : null,
                    pointsCharged,
                    hospitalCredit,
                    support.toInstant(log.getRequestedAt()),
                    "verification-" + log.getId()
            );
        }
    }
}
