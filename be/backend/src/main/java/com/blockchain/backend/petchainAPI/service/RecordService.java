package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.chain.PetChainLedger;
import com.blockchain.backend.common.HashContract;
import com.blockchain.backend.common.IdentifierGenerator;
import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.blockchain.backend.petchainAPI.dto.record.RecordDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.RecordApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.ClaimPackage;
import com.blockchain.backend.petchainDB.entity.DiseaseCode;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Hospital;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.MedicalRecord;
import com.blockchain.backend.petchainDB.entity.MedicalRecordDisease;
import com.blockchain.backend.petchainDB.entity.MedicalRecordFile;
import com.blockchain.backend.petchainDB.entity.MedicalRecordTreatment;
import com.blockchain.backend.petchainDB.entity.Pet;
import com.blockchain.backend.petchainDB.entity.PetInsurance;
import com.blockchain.backend.petchainDB.entity.TreatmentCode;
import com.blockchain.backend.petchainDB.repository.ClaimPackageRepository;
import com.blockchain.backend.petchainDB.repository.DiseaseCodeRepository;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordDiseaseRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordFileRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordTreatmentRepository;
import com.blockchain.backend.petchainDB.repository.PetInsuranceRepository;
import com.blockchain.backend.petchainDB.repository.PetRepository;
import com.blockchain.backend.petchainDB.repository.TreatmentCodeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RecordService implements RecordApiPort {
    private static final Logger log = LoggerFactory.getLogger(RecordService.class);

    private final ApiDomainSupport support;
    private final PetChainLedger chainLedger;
    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalRecordFileRepository medicalRecordFileRepository;
    private final MedicalRecordTreatmentRepository medicalRecordTreatmentRepository;
    private final MedicalRecordDiseaseRepository medicalRecordDiseaseRepository;
    private final PetRepository petRepository;
    private final GuardianRepository guardianRepository;
    private final TreatmentCodeRepository treatmentCodeRepository;
    private final DiseaseCodeRepository diseaseCodeRepository;
    private final ClaimPackageRepository claimPackageRepository;
    private final PetInsuranceRepository petInsuranceRepository;

    @Override
    @Transactional
    public RecordDtos.CreateRecordResponse createRecord(ApiActor actor,
                                                        RecordDtos.CreateRecordRequest request,
                                                        MultipartFile recordFile,
                                                        List<MultipartFile> attachments) {
        // 펫: id 또는 펫번호로 전역 조회
        Pet pet = resolvePet(request.petId());
        // 병원: 요청에 있으면 그것, 없으면 인증된 병원 계정에서 도출
        Hospital hospital = hasText(request.hospitalId())
                ? support.hospitalByExternalId(request.hospitalId())
                : support.hospitalByActor(actor);
        support.requireHospitalScope(actor, hospital);
        // 보호자: 요청에 있으면 그것, 없으면 펫의 보호자
        Guardian guardian = hasText(request.guardianId())
                ? support.guardianByExternalId(request.guardianId())
                : pet.getGuardian();
        if (!Objects.equals(pet.getGuardian().getId(), guardian.getId())) {
            throw ApiException.validation("반려동물과 보호자가 일치하지 않습니다.",
                    java.util.Map.of("petId", "guardian_mismatch"));
        }

        MedicalRecord record = new MedicalRecord();
        // recordId는 canonicalRecordPayload의 필수 필드라 save 전에 미리 발급한다(@PrePersist는 null일 때만 채움).
        record.setRecordId(IdentifierGenerator.generateRecordId());
        record.setRecordVersion(1);
        record.setHospital(hospital);
        record.setPet(pet);
        record.setTreatmentDate(request.treatmentDate());
        int treatmentCostKrw = toCostKrw(request.treatmentCost());
        record.setTotalCost(treatmentCostKrw);
        record.setIntendedInsurerId(emptyToNull(request.insurerId()));

        List<String> treatmentCodes = sortedCodes(request.treatmentCodes());
        List<String> diagnosisCodes = sortedCodes(request.diagnosisCodes());
        record.setFindingsEncrypted(String.join(",", diagnosisCodes));
        record.setPrescriptionEncrypted(String.join(",", treatmentCodes));
        record.setTestResultsEncrypted(hasText(request.memo()) ? request.memo()
                : (request.metadata() == null ? null : request.metadata().toString()));
        // EMR-lite: recordHash는 원문 파일 bytes가 아니라 canonicalRecordPayload(구조화 JSON)의 SHA-256.
        record.setDetailDataHash(HashContract.hashCanonical(
                canonicalRecordPayload(record, treatmentCostKrw, treatmentCodes, diagnosisCodes,
                        request.memo(), request.metadata())));
        MedicalRecord saved = medicalRecordRepository.save(record);

        // 코드 관계 저장은 요청 순서를 유지해 첫 진단코드를 primary로 둔다.
        saveCodes(saved, request.treatmentCodes(), request.diagnosisCodes());
        // EMR-lite: 원문 파일 업로드는 선택. 첨부 해시는 각 파일 원본 bytes의 SHA-256.
        List<CommonDtos.AttachmentHash> fileHashes = new ArrayList<>();
        if (recordFile != null && !recordFile.isEmpty()) {
            fileHashes.add(saveFile(saved, recordFile, "record"));
        }
        for (MultipartFile attachment : attachments == null ? List.<MultipartFile>of() : attachments) {
            if (attachment != null && !attachment.isEmpty()) {
                fileHashes.add(saveFile(saved, attachment, "other"));
            }
        }

        // EMR 흐름 연결: 진료기록 저장과 동시에 보호자가 동의 토글할 수 있도록 pending ClaimPackage 를 자동 생성한다.
        // 요청에 insurerId 가 명시되면 그 보험사 한 곳, 아니면 펫이 가입한 모든 보험사로 fan-out.
        autoCreateClaimPackages(saved, guardian, pet);

        // ── 체인코드 연동: 진료기록 해시 등록 ────────────────────────────────
        // 온체인 실패해도 오프체인 진료기록은 유지하고 로그만 남긴다.
        if (chainLedger.isEnabled()) {
            try {
                String attachJson = fileHashes.stream()
                        .filter(h -> h.sha256() != null && h.sha256().startsWith("sha256:"))
                        .map(h -> "\"" + h.sha256() + "\"")
                        .collect(java.util.stream.Collectors.joining(",", "[", "]"));
                if (attachJson.equals("[]") && !fileHashes.isEmpty()) {
                    attachJson = "[]";
                }
                String createdAtIso = (saved.getCreatedAt() != null)
                        ? saved.getCreatedAt().toInstant(ZoneOffset.UTC).toString()
                        : Instant.now().toString();
                String txId = chainLedger.registerRecord(
                        saved.getRecordId(),
                        String.valueOf(hospital.getId()),
                        saved.getDetailDataHash(),
                        attachJson,
                        createdAtIso);
                saved.setFabricTxId(txId.isEmpty() ? null : txId);
                saved.setOnChainStatus("confirmed");
            } catch (Exception e) {
                log.warn("RegisterRecord 온체인 반영 실패 (recordId={}): {}", saved.getRecordId(), e.getMessage());
                saved.setOnChainStatus("failed");
            }
        }

        return new RecordDtos.CreateRecordResponse(saved.getRecordId(), saved.getDetailDataHash(), fileHashes);
    }

    private void autoCreateClaimPackages(MedicalRecord savedRecord, Guardian guardian, Pet pet) {
        List<InsuranceCompany> targets = new ArrayList<>();
        String intendedInsurerId = savedRecord.getIntendedInsurerId();

        if (intendedInsurerId != null && !intendedInsurerId.isBlank()) {
            // 요청에 보험사가 명시된 경우 그 한 곳. 잘못된 식별자는 무시(진료기록 저장은 이미 끝났음).
            try {
                targets.add(support.insurerByExternalId(intendedInsurerId));
            } catch (ApiException ignored) {
            }
        } else {
            // 명시 안 됐으면 펫이 가입한 모든 보험사로 fan-out.
            petInsuranceRepository.findByPet_Id(pet.getId()).stream()
                    .map(PetInsurance::getInsuranceCompany)
                    .filter(Objects::nonNull)
                    .forEach(targets::add);
        }

        for (InsuranceCompany insurer : targets) {
            boolean exists = claimPackageRepository
                    .findByMedicalRecord_RecordIdAndInsuranceCompany_Id(savedRecord.getRecordId(), insurer.getId())
                    .isPresent();
            if (exists) continue;

            // PetInsurance 가 없으면 만들어서 ClaimPackage 와 연결한다(ConsentService 패턴 미러링).
            PetInsurance policy = petInsuranceRepository
                    .findFirstByPet_IdAndInsuranceCompany_Id(pet.getId(), insurer.getId())
                    .orElseGet(() -> createPetInsurancePolicy(pet, guardian, insurer));

            ClaimPackage claim = new ClaimPackage();
            claim.setMedicalRecord(savedRecord);
            claim.setGuardian(guardian);
            claim.setInsuranceCompany(insurer);
            claim.setPetInsurance(policy);
            claim.setConsentStatus("pending");
            claim.setClaimStatus("pending");
            claimPackageRepository.save(claim);
        }
    }

    private PetInsurance createPetInsurancePolicy(Pet pet, Guardian guardian, InsuranceCompany insurer) {
        PetInsurance policy = new PetInsurance();
        policy.setPet(pet);
        policy.setGuardian(guardian);
        policy.setInsuranceCompany(insurer);
        policy.setProductName("PetChain 기본 연동 보험");
        policy.setPolicyNumber("POL-" + pet.getId() + "-" + insurer.getId());
        policy.setStartDate(LocalDate.now());
        policy.setStatus("active");
        return petInsuranceRepository.save(policy);
    }

    // EMR-lite: Hash Contract v1의 canonicalRecordPayload. 키 정렬·NFC·공백 제거·null 생략은
    // HashContract가 처리하므로 여기서는 필드만 채운다.
    private static Map<String, Object> canonicalRecordPayload(MedicalRecord record,
                                                              int treatmentCostKrw,
                                                              List<String> treatmentCodes,
                                                              List<String> diagnosisCodes,
                                                              String memo,
                                                              Map<String, Object> metadata) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("hashContractVersion", HashContract.VERSION);
        payload.put("recordId", record.getRecordId());
        payload.put("recordVersion", record.getRecordVersion());
        payload.put("hospitalId", String.valueOf(record.getHospital().getId()));
        payload.put("petId", String.valueOf(record.getPet().getId()));
        // 날짜만 입력받아도 UTC 자정(T00:00:00Z)으로 정규화한다.
        payload.put("treatmentDate", record.getTreatmentDate().atStartOfDay(ZoneOffset.UTC).toInstant().toString());
        payload.put("treatmentCostKrw", treatmentCostKrw);
        payload.put("treatmentCodes", treatmentCodes);
        payload.put("diagnosisCodes", diagnosisCodes);
        // 선택 필드: null이면 HashContract canonical 규칙에 따라 payload에서 생략된다.
        payload.put("insurerId", record.getIntendedInsurerId());
        payload.put("memo", emptyToNull(memo));
        payload.put("metadata", canonicalMetadata(metadata));
        return payload;
    }

    // 해시 입력 metadata는 source, externalRecordId 키만 허용한다(Hash Contract v1).
    private static Map<String, Object> canonicalMetadata(Map<String, Object> metadata) {
        if (metadata == null) {
            return null;
        }
        Map<String, Object> filtered = new LinkedHashMap<>();
        Object source = metadata.get("source");
        Object externalRecordId = metadata.get("externalRecordId");
        if (source != null) {
            filtered.put("source", String.valueOf(source));
        }
        if (externalRecordId != null) {
            filtered.put("externalRecordId", String.valueOf(externalRecordId));
        }
        return filtered.isEmpty() ? null : filtered;
    }

    // 진료비를 원화 정수 원 단위로 변환한다(Hash Contract v1: scale 0, 음수·소수 거부).
    private static int toCostKrw(BigDecimal cost) {
        if (cost == null) {
            return 0;
        }
        if (cost.signum() < 0) {
            throw ApiException.validation("진료비는 음수일 수 없습니다.", Map.of("treatmentCost", "negative"));
        }
        if (cost.stripTrailingZeros().scale() > 0) {
            throw ApiException.validation("진료비는 원 단위 정수여야 합니다.", Map.of("treatmentCost", "not_integer"));
        }
        return cost.intValueExact();
    }

    private static List<String> sortedCodes(List<String> codes) {
        return safeList(codes).stream().sorted().toList();
    }

    private static String emptyToNull(String value) {
        return hasText(value) ? value : null;
    }

    @Override
    @Transactional(readOnly = true)
    public RecordDtos.RecordListResponse listRecords(ApiActor actor, RecordDtos.RecordSearchRequest request) {
        int page = Math.max(0, request.page());
        int size = Math.max(1, Math.min(200, request.size()));
        // 프론트는 보호자 본인 id를 모르고 userId만 갖고 있어 "me"를 보낸다 → 인증 액터로 치환한다.
        String guardianId = "me".equalsIgnoreCase(request.guardianId())
                ? String.valueOf(support.guardianByActor(actor).getId())
                : request.guardianId();
        List<MedicalRecord> filtered = medicalRecordRepository.findAll().stream()
                .filter(record -> guardianId == null || Objects.equals(String.valueOf(record.getPet().getGuardian().getId()), guardianId) || Objects.equals(record.getPet().getGuardian().getMemberNumber(), guardianId))
                .filter(record -> request.petId() == null || Objects.equals(String.valueOf(record.getPet().getId()), request.petId()) || Objects.equals(record.getPet().getPetNumber(), request.petId()))
                .sorted(java.util.Comparator.comparing(MedicalRecord::getTreatmentDate).reversed())
                .toList();
        int from = Math.min(page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());
        List<RecordDtos.RecordSummaryResponse> records = filtered.subList(from, to).stream()
                .map(this::toSummary)
                .toList();
        return new RecordDtos.RecordListResponse(records, page, size, filtered.size());
    }

    @Override
    @Transactional(readOnly = true)
    public RecordDtos.RecordDetailResponse getRecord(ApiActor actor, String recordId) {
        MedicalRecord record = support.recordByRecordId(recordId);
        return new RecordDtos.RecordDetailResponse(
                record.getRecordId(),
                String.valueOf(record.getHospital().getId()),
                String.valueOf(record.getPet().getGuardian().getId()),
                String.valueOf(record.getPet().getId()),
                record.getTreatmentDate(),
                BigDecimal.valueOf(record.getTotalCost()),
                support.treatmentCodes(record),
                support.diagnosisCodes(record),
                record.getDetailDataHash(),
                support.attachmentHashes(record),
                toInstant(record.getCreatedAt()),
                toInstant(record.getUpdatedAt())
        );
    }

    private RecordDtos.RecordSummaryResponse toSummary(MedicalRecord record) {
        return new RecordDtos.RecordSummaryResponse(
                record.getRecordId(),
                String.valueOf(record.getHospital().getId()),
                String.valueOf(record.getPet().getGuardian().getId()),
                String.valueOf(record.getPet().getId()),
                record.getPet().getName(),
                record.getTreatmentDate(),
                BigDecimal.valueOf(record.getTotalCost()),
                support.treatmentCodes(record),
                support.diagnosisCodes(record),
                record.getTestResultsEncrypted(),
                record.getOnChainStatus(),
                toInstant(record.getCreatedAt()),
                record.getDetailDataHash()
        );
    }

    private void saveCodes(MedicalRecord record, List<String> treatmentCodes, List<String> diagnosisCodes) {
        for (String code : safeList(treatmentCodes)) {
            treatmentCodeRepository.findById(code).ifPresent(treatmentCode -> {
                MedicalRecordTreatment relation = new MedicalRecordTreatment();
                relation.setMedicalRecord(record);
                relation.setTreatmentCode(treatmentCode);
                medicalRecordTreatmentRepository.save(relation);
            });
        }
        boolean primary = true;
        for (String code : safeList(diagnosisCodes)) {
            final boolean isPrimary = primary;
            diseaseCodeRepository.findById(code).ifPresent(diseaseCode -> {
                MedicalRecordDisease relation = new MedicalRecordDisease();
                relation.setMedicalRecord(record);
                relation.setDiseaseCode(diseaseCode);
                relation.setIsPrimary(isPrimary);
                medicalRecordDiseaseRepository.save(relation);
            });
            primary = false;
        }
    }

    private CommonDtos.AttachmentHash saveFile(MedicalRecord record, MultipartFile multipartFile, String fileType) {
        String hash = HashContract.hashBytes(fileBytes(multipartFile));
        MedicalRecordFile file = new MedicalRecordFile();
        file.setMedicalRecord(record);
        file.setFileType(fileType);
        file.setS3Key("local/records/" + record.getRecordId() + "/" + hash);
        file.setOriginalFilename(multipartFile.getOriginalFilename());
        file.setFileSize(multipartFile.getSize());
        file.setMimeType(multipartFile.getContentType());
        file.setIsDeleted(false);
        MedicalRecordFile saved = medicalRecordFileRepository.save(file);
        return new CommonDtos.AttachmentHash(String.valueOf(saved.getId()), saved.getOriginalFilename(), hash);
    }

    private byte[] fileBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "파일을 읽을 수 없습니다.");
        }
    }

    private static List<String> safeList(List<String> values) {
        return values == null ? List.of() : values.stream().filter(v -> v != null && !v.isBlank()).toList();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    // 펫을 DB id 또는 펫번호(pet_number) 어느 쪽으로든 조회한다.
    private Pet resolvePet(String petId) {
        return support.parseNumericId(petId)
                .flatMap(petRepository::findById)
                .or(() -> petRepository.findByPetNumber(petId))
                .orElseThrow(() -> ApiException.validation("반려동물을 찾을 수 없습니다.",
                        java.util.Map.of("petId", "not_found")));
    }

    private static Instant toInstant(java.time.LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
