package com.blockchain.backend.petchain.petchainAPI.controller;

import com.blockchain.backend.petchain.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchain.petchainAPI.dto.record.RecordDtos;
import com.blockchain.backend.petchain.petchainAPI.port.RecordApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
public class RecordController {
    private final RecordApiPort recordApiPort;

    public RecordController(RecordApiPort recordApiPort) {
        this.recordApiPort = recordApiPort;
    }

    @PostMapping(value = "/records", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<RecordDtos.CreateRecordResponse>> createRecord(
            ApiActor actor,
            @Valid @RequestPart("metadata") RecordDtos.CreateRecordRequest metadata,
            @RequestPart("recordFile") MultipartFile recordFile,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments,
            HttpServletRequest request) {
        RecordDtos.CreateRecordResponse response = recordApiPort.createRecord(actor, metadata, recordFile, attachments == null ? List.of() : attachments);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(response, request));
    }

    @GetMapping("/records")
    public ApiResponse<RecordDtos.RecordListResponse> listRecords(
            ApiActor actor,
            @RequestParam(required = false) String guardianId,
            @RequestParam(required = false) String petId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(200) int size,
            HttpServletRequest request) {
        RecordDtos.RecordSearchRequest searchRequest = new RecordDtos.RecordSearchRequest(guardianId, petId, page, size);
        return ApiResponse.of(recordApiPort.listRecords(actor, searchRequest), request);
    }

    @GetMapping("/records/{recordId}")
    public ApiResponse<RecordDtos.RecordDetailResponse> getRecord(
            ApiActor actor,
            @PathVariable String recordId,
            HttpServletRequest request) {
        return ApiResponse.of(recordApiPort.getRecord(actor, recordId), request);
    }
}
