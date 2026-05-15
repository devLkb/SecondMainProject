package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchainAPI.port.VerificationApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import org.springframework.stereotype.Service;

@Service
public class VerificationService implements VerificationApiPort {

    @Override
    public VerificationDtos.VerificationResponse verifySubmission(ApiActor actor, String submissionId, VerificationDtos.VerificationRequest request, String idempotencyKeyHeader) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public VerificationDtos.VerificationDetailResponse getVerification(ApiActor actor, String verificationId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public VerificationDtos.DeidentifiedDataResponse getDeidentifiedData(ApiActor actor, String verificationId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public VerificationDtos.AuditLogResponse getVerificationAudit(ApiActor actor, String verificationId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
