package com.blockchain.backend.petchain.petchainAPI.controller;

import com.blockchain.backend.petchain.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchain.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchain.petchainAPI.port.VerificationApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VerificationController {
    private final VerificationApiPort verificationApiPort;

    public VerificationController(VerificationApiPort verificationApiPort) {
        this.verificationApiPort = verificationApiPort;
    }

    @GetMapping("/verifications/{verificationId}")
    public ApiResponse<VerificationDtos.VerificationDetailResponse> getVerification(
            ApiActor actor,
            @PathVariable String verificationId,
            HttpServletRequest request) {
        return ApiResponse.of(verificationApiPort.getVerification(actor, verificationId), request);
    }

    @GetMapping("/verifications/{verificationId}/deidentified-data")
    public ApiResponse<VerificationDtos.DeidentifiedDataResponse> getDeidentifiedData(
            ApiActor actor,
            @PathVariable String verificationId,
            HttpServletRequest request) {
        return ApiResponse.of(verificationApiPort.getDeidentifiedData(actor, verificationId), request);
    }

    @GetMapping("/verifications/{verificationId}/audit")
    public ApiResponse<VerificationDtos.AuditLogResponse> getVerificationAudit(
            ApiActor actor,
            @PathVariable String verificationId,
            HttpServletRequest request) {
        return ApiResponse.of(verificationApiPort.getVerificationAudit(actor, verificationId), request);
    }
}
