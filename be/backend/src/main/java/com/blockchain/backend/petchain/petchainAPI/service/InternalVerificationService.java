package com.blockchain.backend.petchain.petchainAPI.service;

import com.blockchain.backend.petchain.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchain.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import org.springframework.stereotype.Service;

@Service
public class InternalVerificationService implements InternalVerificationApiPort {

    @Override
    public VerificationDtos.InternalVerifyResponse verifySubmission(ApiActor actor, String submissionId, VerificationDtos.InternalVerifyRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
