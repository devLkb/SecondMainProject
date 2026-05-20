package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.flag.FlagDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.RecordFlag;
import com.blockchain.backend.petchainDB.repository.MedicalRecordRepository;
import com.blockchain.backend.petchainDB.repository.RecordFlagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

// 이상 신고 생성(보험사)·조회(플랫폼)·처리(플랫폼) 서비스.
@Service
@RequiredArgsConstructor
public class FlagService {

    // 신고 사유 코드 → 표시 라벨 (프론트 FLAG_REASONS 와 동일)
    private static final Map<String, String> REASON_LABELS = Map.of(
            "DUPLICATE_SUSPECTED", "중복 청구 의심",
            "COST_INCONSISTENT", "진료비 불일치",
            "DIAGNOSIS_MISMATCH", "진단 코드 불일치",
            "TREATMENT_UNREASONABLE", "진료 행위 부적절",
            "DOCUMENT_SUSPICIOUS", "서류 위조 의심",
            "OTHER", "기타"
    );

    private final ApiDomainSupport support;
    private final RecordFlagRepository recordFlagRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    @Transactional
    public FlagDtos.FlagResponse createFlag(ApiActor actor, FlagDtos.CreateFlagRequest request) {
        // 신고는 보험사만 생성 가능. actor 가 보험사가 아니면 여기서 차단된다.
        InsuranceCompany insurer = support.insurerByActor(actor);
        support.requireInsurerScope(actor, insurer);

        // 같은 보험사가 같은 record 에 대해 미처리(PENDING) 신고를 또 만드는 것을 차단.
        if (recordFlagRepository.existsByRecordIdAndReportedByInsurerIdAndStatus(
                request.recordId(), insurer.getId(), "PENDING")) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "이미 검토 대기 중인 신고가 있습니다.");
        }

        // verificationId 가 진짜 BE 발급 형식(VER-<숫자>)이 아니면 저장하지 않는다.
        // FE 로컬 폴백에서 만든 가짜 verificationId 가 DB 에 들어가는 것을 막는다.
        String verificationId = isRealVerificationId(request.verificationId()) ? request.verificationId() : null;

        RecordFlag flag = new RecordFlag();
        flag.setRecordId(request.recordId());
        flag.setVerificationId(verificationId);
        flag.setReasonCode(request.reasonCode());
        flag.setNote(request.note());
        flag.setStatus("PENDING");
        flag.setReportedByInsurerId(insurer.getId());

        // 진료기록이 DB에 있으면 펫/병원/질병/진료비를 스냅샷으로 저장한다.
        medicalRecordRepository.findByRecordId(request.recordId()).ifPresent(record -> {
            flag.setPetName(record.getPet().getName());
            flag.setHospitalName(record.getHospital().getName());
            flag.setCost(record.getTotalCost());
            List<String> diagnoses = support.diagnosisCodes(record);
            flag.setDisease(diagnoses.isEmpty() ? null : diagnoses.get(0));
        });

        return toResponse(recordFlagRepository.save(flag));
    }

    @Transactional(readOnly = true)
    public List<FlagDtos.FlagResponse> listFlags(ApiActor actor) {
        // 전체 신고 목록은 플랫폼 관리자만 조회 가능.
        support.requireAdmin(actor);
        return recordFlagRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    // BE 가 발급한 verificationId 만 "VER-숫자" 형식. FE 폴백은 "VER-XXXXXXXX" hex.
    private static boolean isRealVerificationId(String value) {
        return value != null && value.matches("^VER-\\d+$");
    }

    @Transactional
    public FlagDtos.FlagResponse resolveFlag(ApiActor actor, String flagId, FlagDtos.ResolveFlagRequest request) {
        support.requireAdmin(actor);
        RecordFlag flag = recordFlagRepository.findById(parseFlagId(flagId))
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "신고 건을 찾을 수 없습니다."));
        flag.setStatus("RESOLVED");
        flag.setResolveCode(request.resolveCode());
        flag.setResolveNote(request.resolveNote());
        flag.setResolvedAt(LocalDateTime.now());
        return toResponse(recordFlagRepository.save(flag));
    }

    private FlagDtos.FlagResponse toResponse(RecordFlag flag) {
        return new FlagDtos.FlagResponse(
                "FLAG-" + flag.getId(),
                flag.getRecordId(),
                flag.getVerificationId(),
                flag.getPetName(),
                flag.getHospitalName(),
                flag.getDisease(),
                flag.getCost() == null ? null : BigDecimal.valueOf(flag.getCost()),
                flag.getReasonCode(),
                REASON_LABELS.getOrDefault(flag.getReasonCode(), flag.getReasonCode()),
                flag.getNote(),
                support.toInstant(flag.getCreatedAt()),
                flag.getStatus(),
                flag.getReportedByInsurerId() == null ? null : String.valueOf(flag.getReportedByInsurerId()),
                flag.getResolveCode(),
                flag.getResolveNote(),
                support.toInstant(flag.getResolvedAt())
        );
    }

    private static Long parseFlagId(String flagId) {
        String digits = flagId == null ? "" : flagId.trim().replaceFirst("^[A-Za-z]+-", "");
        try {
            return Long.parseLong(digits);
        } catch (NumberFormatException ignored) {
            throw new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "신고 건을 찾을 수 없습니다.");
        }
    }
}
