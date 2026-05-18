package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InternalVerificationController {
    private final InternalVerificationApiPort internalVerificationApiPort;

    public InternalVerificationController(InternalVerificationApiPort internalVerificationApiPort) {
        this.internalVerificationApiPort = internalVerificationApiPort;
    }

    @PostMapping("/internal/submissions/{submissionId}/verify")
    public ApiResponse<VerificationDtos.InternalVerifyResponse> verifySubmission(
            ApiActor actor,
            @PathVariable String submissionId,
            @RequestBody(required = false) VerificationDtos.InternalVerifyRequest internalVerifyRequest,
            HttpServletRequest request) {
        return ApiResponse.of(internalVerificationApiPort.verifySubmission(actor, submissionId, safeVerifyRequest(internalVerifyRequest)), request);
    }

    private static VerificationDtos.InternalVerifyRequest safeVerifyRequest(VerificationDtos.InternalVerifyRequest request) {
        return request == null ? new VerificationDtos.InternalVerifyRequest(null, null, false) : request;
    }
}
