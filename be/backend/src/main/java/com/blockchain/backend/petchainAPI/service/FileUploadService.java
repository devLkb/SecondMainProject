package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.MedicalRecord;
import com.blockchain.backend.petchainDB.entity.MedicalRecordFile;
import com.blockchain.backend.petchainDB.repository.MedicalRecordFileRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final ApiDomainSupport support;
    private final MedicalRecordRepository medicalRecordRepository;
    private final MedicalRecordFileRepository medicalRecordFileRepository;

    // 가이드 패턴: S3 업로드는 프론트/별도 서비스에서 처리, 여기선 DB 메타데이터만 저장.
    // 진료기록을 발급한 본인 병원만 파일 메타를 다룰 수 있다.
    @Transactional
    public MedicalRecordFile saveFileMeta(ApiActor actor, Long recordId, String s3Key, String originalFilename,
                                          Long fileSize, String mimeType, String fileType) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("진료기록을 찾을 수 없습니다."));
        support.requireHospitalScope(actor, record.getHospital());

        if (s3Key == null || s3Key.isBlank()) {
            throw new IllegalArgumentException("s3Key는 필수입니다.");
        }
        validateFileType(fileType);
        validateMimeType(mimeType);

        MedicalRecordFile file = new MedicalRecordFile();
        file.setMedicalRecord(record);
        file.setS3Key(s3Key);
        file.setOriginalFilename(originalFilename);
        file.setFileSize(fileSize);
        file.setMimeType(mimeType);
        file.setFileType(fileType);
        file.setIsDeleted(false);

        return medicalRecordFileRepository.save(file);
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordFile> getFiles(ApiActor actor, Long recordId) {
        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("진료기록을 찾을 수 없습니다."));
        support.requireHospitalScope(actor, record.getHospital());
        return medicalRecordFileRepository.findByMedicalRecord_IdAndIsDeletedFalse(recordId);
    }

    @Transactional
    public void softDelete(ApiActor actor, Long recordId, Long fileId) {
        MedicalRecordFile file = medicalRecordFileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다."));
        // path 의 recordId 와 파일의 실제 소속이 일치하는지 확인(다른 record 의 파일 삭제 방지).
        if (file.getMedicalRecord() == null || !file.getMedicalRecord().getId().equals(recordId)) {
            throw new IllegalArgumentException("해당 진료기록의 파일이 아닙니다.");
        }
        support.requireHospitalScope(actor, file.getMedicalRecord().getHospital());
        file.setIsDeleted(true);
    }

    private void validateFileType(String fileType) {
        if (!List.of("xray", "ultrasound", "receipt", "other").contains(fileType)) {
            throw new IllegalArgumentException("허용되지 않는 파일 유형입니다: " + fileType);
        }
    }

    private void validateMimeType(String mimeType) {
        if (mimeType != null && !mimeType.startsWith("image/") && !mimeType.equals("application/pdf")) {
            throw new IllegalArgumentException("허용되지 않는 MIME 타입입니다: " + mimeType);
        }
    }
}
