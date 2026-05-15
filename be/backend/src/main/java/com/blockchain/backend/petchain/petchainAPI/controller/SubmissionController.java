package com.blockchain.backend.petchain.petchainAPI.controller;

import com.blockchain.backend.petchain.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchain.petchainAPI.dto.submission.SubmissionDtos;
import com.blockchain.backend.petchain.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchain.petchainAPI.error.ApiException;
import com.blockchain.backend.petchain.petchainAPI.port.SubmissionApiPort;
import com.blockchain.backend.petchain.petchainAPI.port.VerificationApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SubmissionController {
    private final SubmissionApiPort submissionApiPort;
    private final VerificationApiPort verificationApiPort;

    public SubmissionController(SubmissionApiPort submissionApiPort, VerificationApiPort verificationApiPort) {
        this.submissionApiPort = submissionApiPort;
        this.verificationApiPort = verificationApiPort;
    }

    @PostMapping("/submissions")
    public ResponseEntity<ApiResponse<SubmissionDtos.CreateSubmissionResponse>> createSubmission(
            ApiActor actor,
            @Valid @RequestBody SubmissionDtos.CreateSubmissionRequest createSubmissionRequest,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(submissionApiPort.createSubmission(actor, createSubmissionRequest), request));
    }

    @GetMapping("/submissions/{submissionId}")
    public ApiResponse<SubmissionDtos.SubmissionStatusResponse> getSubmission(
            ApiActor actor,
            @PathVariable String submissionId,
            HttpServletRequest request) {
        return ApiResponse.of(submissionApiPort.getSubmission(actor, submissionId), request);
    }

    @GetMapping("/submissions/{submissionId}/package")
    public ApiResponse<SubmissionDtos.SubmissionPackageResponse> getSubmissionPackage(
            ApiActor actor,
            @PathVariable String submissionId,
            HttpServletRequest request) {
        return ApiResponse.of(submissionApiPort.getSubmissionPackage(actor, submissionId), request);
    }

    @PostMapping("/submissions/{submissionId}/verification")
    public ApiResponse<VerificationDtos.VerificationResponse> verifySubmission(
            ApiActor actor,
            @PathVariable String submissionId,
            @Valid @RequestBody VerificationDtos.VerificationRequest verificationRequest,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKeyHeader,
            HttpServletRequest request) {
        requireMatchingSubmissionId(submissionId, verificationRequest.submissionId());
        return ApiResponse.of(verificationApiPort.verifySubmission(actor, submissionId, verificationRequest, idempotencyKeyHeader), request);
    }

    @PostMapping("/submissions/{submissionId}/claim-status")
    public ApiResponse<SubmissionDtos.ClaimStatusResponse> updateClaimStatus(
            ApiActor actor,
            @PathVariable String submissionId,
            @Valid @RequestBody SubmissionDtos.ClaimStatusRequest claimStatusRequest,
            HttpServletRequest request) {
        return ApiResponse.of(submissionApiPort.updateClaimStatus(actor, submissionId, claimStatusRequest), request);
    }

    private static void requireMatchingSubmissionId(String pathSubmissionId, String bodySubmissionId) {
        if (!pathSubmissionId.equals(bodySubmissionId)) {
            throw ApiException.validation("Path submissionId must match request submissionId",
                    Map.of("pathSubmissionId", pathSubmissionId, "bodySubmissionId", bodySubmissionId));
        }
    }
}
