package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.service.FileUploadService;
import com.blockchain.backend.petchainDB.entity.MedicalRecordFile;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/records/{recordId}/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    // S3 업로드 완료 후 프론트에서 s3Key를 받아 DB에 메타데이터 저장
    // 가이드 패턴: S3 Presigned URL로 프론트가 직접 업로드 → 완료 후 이 엔드포인트 호출
    @PostMapping
    public ResponseEntity<Map<String, Object>> saveFileMeta(
            @PathVariable Long recordId,
            @RequestBody Map<String, Object> body) {

        String s3Key          = (String) body.get("s3Key");
        String originalFilename = (String) body.get("originalFilename");
        String mimeType       = (String) body.get("mimeType");
        String fileType       = (String) body.getOrDefault("fileType", "other").toString();
        Long   fileSize       = body.get("fileSize") != null
                ? Long.parseLong(body.get("fileSize").toString()) : null;

        MedicalRecordFile saved = fileUploadService.saveFileMeta(
                recordId, s3Key, originalFilename, fileSize, mimeType, fileType);

        return ResponseEntity.ok(Map.of(
                "id",               saved.getId(),
                "s3Key",            saved.getS3Key(),
                "originalFilename", saved.getOriginalFilename(),
                "fileType",         saved.getFileType(),
                "uploadedAt",       saved.getUploadedAt().toString()
        ));
    }

    @GetMapping
    public ResponseEntity<List<MedicalRecordFile>> getFiles(@PathVariable Long recordId) {
        return ResponseEntity.ok(fileUploadService.getFiles(recordId));
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long recordId,
                                           @PathVariable Long fileId) {
        fileUploadService.softDelete(fileId);
        return ResponseEntity.noContent().build();
    }
}
