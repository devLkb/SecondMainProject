package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchainAPI.dto.consent.ConsentDtos;
import com.blockchain.backend.petchainAPI.port.ConsentApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ConsentController {
    private final ConsentApiPort consentApiPort;

    public ConsentController(ConsentApiPort consentApiPort) {
        this.consentApiPort = consentApiPort;
    }

    @PostMapping("/consents")
    public ResponseEntity<ApiResponse<ConsentDtos.ConsentResponse>> createConsent(
            ApiActor actor,
            @Valid @RequestBody ConsentDtos.CreateConsentRequest createConsentRequest,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.of(consentApiPort.createConsent(actor, createConsentRequest), request));
    }

    @GetMapping("/consents")
    public ApiResponse<ConsentDtos.ConsentListResponse> listConsents(
            ApiActor actor,
            @RequestParam(required = false) String recordId,
            @RequestParam(required = false) String guardianId,
            @RequestParam(required = false) String insurerId,
            HttpServletRequest request) {
        return ApiResponse.of(consentApiPort.listConsents(actor, recordId, guardianId, insurerId), request);
    }

    @GetMapping("/consents/{consentId}")
    public ApiResponse<ConsentDtos.ConsentResponse> getConsent(
            ApiActor actor,
            @PathVariable String consentId,
            HttpServletRequest request) {
        return ApiResponse.of(consentApiPort.getConsent(actor, consentId), request);
    }

    @PostMapping("/consents/{consentId}/revoke")
    public ApiResponse<ConsentDtos.ConsentResponse> revokeConsent(
            ApiActor actor,
            @PathVariable String consentId,
            @RequestBody(required = false) ConsentDtos.RevokeConsentRequest revokeConsentRequest,
            HttpServletRequest request) {
        ConsentDtos.RevokeConsentRequest safeRequest = revokeConsentRequest == null ? new ConsentDtos.RevokeConsentRequest(null) : revokeConsentRequest;
        return ApiResponse.of(consentApiPort.revokeConsent(actor, consentId, safeRequest), request);
    }
}
