package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.consent.ConsentDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.ConsentApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.ClaimPackage;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.MedicalRecord;
import com.blockchain.backend.petchainDB.entity.PetInsurance;
import com.blockchain.backend.petchainDB.repository.ClaimPackageRepository;
import com.blockchain.backend.petchainDB.repository.PetInsuranceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ConsentService implements ConsentApiPort {
    private final ApiDomainSupport support;
    private final ClaimPackageRepository claimPackageRepository;
    private final PetInsuranceRepository petInsuranceRepository;

    @Override
    @Transactional
    public ConsentDtos.ConsentResponse createConsent(ApiActor actor, ConsentDtos.CreateConsentRequest request) {
        MedicalRecord record = support.recordByRecordId(request.recordId());
        // 보호자는 요청 body가 아니라 인증된 액터에서 도출한다(클라이언트가 보낸 식별자를 신뢰하지 않음).
        Long actorUserId = support.parseActorUserId(actor);
        Guardian guardian = (actorUserId != null)
                ? support.guardianByActor(actor)
                : support.guardianByExternalId(request.guardianId());
        InsuranceCompany insurer = support.insurerByExternalId(request.insurerId());
        support.requireGuardianScope(actor, guardian);
        if (!Objects.equals(record.getPet().getGuardian().getId(), guardian.getId())) {
            throw new ApiException(ApiErrorCode.FORBIDDEN_ORG_SCOPE, "진료기록의 보호자가 일치하지 않습니다.");
        }

        ClaimPackage claim = claimPackageRepository
                .findByMedicalRecord_RecordIdAndInsuranceCompany_Id(record.getRecordId(), insurer.getId())
                .orElseGet(() -> newClaim(record, guardian, insurer));
        claim.setConsentStatus("active");
        claim.setConsentedAt(java.time.LocalDateTime.now());
        claim.setClaimStatus("requested");
        ClaimPackage saved = claimPackageRepository.save(claim);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ConsentDtos.ConsentListResponse listConsents(ApiActor actor, String recordId, String guardianId, String insurerId) {
        // 프론트는 로그인 회원 본인 id를 모르고 userId만 갖고 있어 "me"를 보낸다 → 인증 액터로 치환한다.
        String gId = "me".equalsIgnoreCase(guardianId) ? String.valueOf(support.guardianByActor(actor).getId()) : guardianId;
        String iId = "me".equalsIgnoreCase(insurerId) ? String.valueOf(support.insurerByActor(actor).getId()) : insurerId;
        List<ClaimPackage> claims = claimPackageRepository.findAll().stream()
                .filter(claim -> recordId == null || Objects.equals(claim.getMedicalRecord().getRecordId(), recordId))
                .filter(claim -> gId == null || Objects.equals(String.valueOf(claim.getGuardian().getId()), gId) || Objects.equals(claim.getGuardian().getMemberNumber(), gId))
                .filter(claim -> iId == null || Objects.equals(String.valueOf(claim.getInsuranceCompany().getId()), iId) || Objects.equals(claim.getInsuranceCompany().getMemberNumber(), iId))
                .toList();
        return new ConsentDtos.ConsentListResponse(claims.stream().map(this::toResponse).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ConsentDtos.ConsentResponse getConsent(ApiActor actor, String consentId) {
        return toResponse(support.claimBySubmissionId(consentId));
    }

    @Override
    @Transactional
    public ConsentDtos.ConsentResponse revokeConsent(ApiActor actor, String consentId, ConsentDtos.RevokeConsentRequest request) {
        ClaimPackage claim = support.claimBySubmissionId(consentId);
        support.requireGuardianScope(actor, claim.getGuardian());
        claim.setConsentStatus("revoked");
        claim.setClaimStatus("pending");
        return toResponse(claim);
    }

    private ClaimPackage newClaim(MedicalRecord record, Guardian guardian, InsuranceCompany insurer) {
        PetInsurance petInsurance = petInsuranceRepository
                .findFirstByPet_IdAndInsuranceCompany_Id(record.getPet().getId(), insurer.getId())
                .orElseGet(() -> createPolicy(record, guardian, insurer));
        ClaimPackage claim = new ClaimPackage();
        claim.setMedicalRecord(record);
        claim.setGuardian(guardian);
        claim.setInsuranceCompany(insurer);
        claim.setPetInsurance(petInsurance);
        claim.setConsentStatus("active");
        claim.setClaimStatus("requested");
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

    private ConsentDtos.ConsentResponse toResponse(ClaimPackage claim) {
        var snapshot = support.consentSnapshot(claim);
        MedicalRecord record = claim.getMedicalRecord();
        List<String> diagnoses = support.diagnosisCodes(record);
        return new ConsentDtos.ConsentResponse(
                claim.getClaimId(),
                record.getRecordId(),
                String.valueOf(claim.getInsuranceCompany().getId()),
                String.valueOf(claim.getGuardian().getId()),
                snapshot.status(),
                snapshot.consentedAt(),
                snapshot.expiresAt(),
                claim.getFabricTxId(),
                claim.getClaimId(),
                record.getPet().getName(),
                record.getHospital().getName(),
                claim.getInsuranceCompany().getName(),
                diagnoses.isEmpty() ? null : diagnoses.get(0),
                java.math.BigDecimal.valueOf(record.getTotalCost()),
                record.getTreatmentDate(),
                String.valueOf(record.getPet().getId()),
                String.valueOf(record.getHospital().getId()),
                record.getDetailDataHash()
        );
    }
}
