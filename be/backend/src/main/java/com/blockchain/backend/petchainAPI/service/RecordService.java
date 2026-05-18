package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.blockchain.backend.petchainAPI.dto.record.RecordDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.RecordApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.DiseaseCode;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Hospital;
import com.blockchain.backend.petchainDB.entity.MedicalRecord;
import com.blockchain.backend.petchainDB.entity.MedicalRecordDisease;
import com.blockchain.backend.petchainDB.entity.MedicalRecordFile;
import com.blockchain.backend.petchainDB.entity.MedicalRecordTreatment;
import com.blockchain.backend.petchainDB.entity.Pet;
import com.blockchain.backend.petchainDB.entity.TreatmentCode;
import com.blockchain.backend.petchainDB.repository.DiseaseCodeRepository;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordDiseaseRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordFileRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordTreatmentRepository;
import com.blockchain.backend.petchainDB.repository.PetRepository;
import com.blockchain.backend.petchainDB.repository.TreatmentCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RecordService implements RecordApiPort {
    private final ApiDomainSupport support;
    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalRecordFileRepository medicalRecordFileRepository;
    private final MedicalRecordTreatmentRepository medicalRecordTreatmentRepository;
    private final MedicalRecordDiseaseRepository medicalRecordDiseaseRepository;
    private final PetRepository petRepository;
    private final GuardianRepository guardianRepository;
    private final TreatmentCodeRepository treatmentCodeRepository;
    private final DiseaseCodeRepository diseaseCodeRepository;

    @Override
    @Transactional
    public RecordDtos.CreateRecordResponse createRecord(ApiActor actor,
                                                        RecordDtos.CreateRecordRequest request,
                                                        MultipartFile recordFile,
                                                        List<MultipartFile> attachments) {
        if (recordFile == null || recordFile.isEmpty()) {
            throw ApiException.validation("recordFile은 필수입니다.", java.util.Map.of("recordFile", "required"));
        }

        Hospital hospital = support.hospitalByExternalId(request.hospitalId());
        support.requireHospitalScope(actor, hospital);
        Guardian guardian = support.guardianByExternalId(request.guardianId());
        List<Pet> guardianPets = petRepository.findByGuardian_Id(guardian.getId());
        Pet pet = support.petByExternalId(guardianPets, request.petId());

        MedicalRecord record = new MedicalRecord();
        record.setHospital(hospital);
        record.setPet(pet);
        record.setTreatmentDate(request.treatmentDate());
        record.setTotalCost(request.treatmentCost() == null ? 0 : request.treatmentCost().intValue());
        record.setFindingsEncrypted(String.join(",", safeList(request.diagnosisCodes())));
        record.setPrescriptionEncrypted(String.join(",", safeList(request.treatmentCodes())));
        record.setTestResultsEncrypted(request.metadata() == null ? null : request.metadata().toString());
        record.setDetailDataHash(sha256(fileBytes(recordFile)));
        MedicalRecord saved = medicalRecordRepository.save(record);

        saveCodes(saved, request.treatmentCodes(), request.diagnosisCodes());
        List<CommonDtos.AttachmentHash> fileHashes = new ArrayList<>();
        fileHashes.add(saveFile(saved, recordFile, "record"));
        for (MultipartFile attachment : attachments == null ? List.<MultipartFile>of() : attachments) {
            if (attachment != null && !attachment.isEmpty()) {
                fileHashes.add(saveFile(saved, attachment, "other"));
            }
        }
        return new RecordDtos.CreateRecordResponse(saved.getRecordId(), saved.getDetailDataHash(), fileHashes);
    }

    @Override
    @Transactional(readOnly = true)
    public RecordDtos.RecordListResponse listRecords(ApiActor actor, RecordDtos.RecordSearchRequest request) {
        int page = Math.max(0, request.page());
        int size = Math.max(1, Math.min(200, request.size()));
        List<MedicalRecord> filtered = medicalRecordRepository.findAll().stream()
                .filter(record -> request.guardianId() == null || Objects.equals(String.valueOf(record.getPet().getGuardian().getId()), request.guardianId()) || Objects.equals(record.getPet().getGuardian().getMemberNumber(), request.guardianId()))
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
                record.getTreatmentDate(),
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
        String hash = sha256(fileBytes(multipartFile));
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

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }

    private static List<String> safeList(List<String> values) {
        return values == null ? List.of() : values.stream().filter(v -> v != null && !v.isBlank()).toList();
    }

    private static Instant toInstant(java.time.LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
