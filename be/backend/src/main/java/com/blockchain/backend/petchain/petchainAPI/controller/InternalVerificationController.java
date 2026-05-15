package com.blockchain.backend.petchain.petchainAPI.controller;

import com.blockchain.backend.petchain.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchain.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchain.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
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
        VerificationDtos.InternalVerifyRequest safeRequest = internalVerifyRequest == null
                ? new VerificationDtos.InternalVerifyRequest(null, null, false)
                : internalVerifyRequest;
        return ApiResponse.of(internalVerificationApiPort.verifySubmission(actor, submissionId, safeRequest), request);
    }
}
