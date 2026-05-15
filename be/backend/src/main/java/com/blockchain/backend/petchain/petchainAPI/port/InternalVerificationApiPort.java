package com.blockchain.backend.petchain.petchainAPI.port;

import com.blockchain.backend.petchain.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;

public interface InternalVerificationApiPort {
    VerificationDtos.InternalVerifyResponse verifySubmission(ApiActor actor,
                                                             String submissionId,
                                                             VerificationDtos.InternalVerifyRequest request);
}
