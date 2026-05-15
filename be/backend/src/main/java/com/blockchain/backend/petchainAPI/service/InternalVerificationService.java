package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import org.springframework.stereotype.Service;

@Service
public class InternalVerificationService implements InternalVerificationApiPort {

    @Override
    public VerificationDtos.InternalVerifyResponse verifySubmission(ApiActor actor, String submissionId, VerificationDtos.InternalVerifyRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
