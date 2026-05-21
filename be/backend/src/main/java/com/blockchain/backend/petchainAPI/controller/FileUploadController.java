package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainAPI.service.FileUploadService;
import com.blockchain.backend.petchainDB.entity.MedicalRecordFile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Validated
@RestController
@RequestMapping({"/records/{recordId}/files", "/api/records/{recordId}/files"})
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @PostMapping
    public ApiResponse<FileMetaResponse> saveFileMeta(
            ApiActor actor,
            @PathVariable Long recordId,
            @Validated @RequestBody SaveFileMetaRequest body,
            HttpServletRequest request) {
        MedicalRecordFile saved = fileUploadService.saveFileMeta(
                actor,
                recordId,
                body.s3Key(),
                body.originalFilename(),
                body.fileSize(),
                body.mimeType(),
                body.fileType() == null || body.fileType().isBlank() ? "other" : body.fileType());
        return ApiResponse.of(toResponse(saved), request);
    }

    @GetMapping
    public ApiResponse<List<FileMetaResponse>> getFiles(ApiActor actor, @PathVariable Long recordId, HttpServletRequest request) {
        return ApiResponse.of(fileUploadService.getFiles(actor, recordId).stream().map(FileUploadController::toResponse).toList(), request);
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(ApiActor actor,
                                           @PathVariable Long recordId,
                                           @PathVariable Long fileId) {
        fileUploadService.softDelete(actor, recordId, fileId);
        return ResponseEntity.noContent().build();
    }

    private static FileMetaResponse toResponse(MedicalRecordFile file) {
        return new FileMetaResponse(file.getId(), file.getS3Key(), file.getOriginalFilename(), file.getFileType(), file.getMimeType(), file.getFileSize(), file.getUploadedAt());
    }

    public record SaveFileMetaRequest(
            @NotBlank String s3Key,
            @Size(max = 255) String originalFilename,
            Long fileSize,
            @Size(max = 100) String mimeType,
            String fileType
    ) {
    }

    public record FileMetaResponse(
            Long id,
            String s3Key,
            String originalFilename,
            String fileType,
            String mimeType,
            Long fileSize,
            LocalDateTime uploadedAt
    ) {
    }
}
