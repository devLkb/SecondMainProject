package com.blockchain.backend.petchainAPI.port;

import com.blockchain.backend.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchainAPI.security.ApiActor;

public interface InternalVerificationApiPort {
    VerificationDtos.InternalVerifyResponse verifySubmission(ApiActor actor,
                                                             String submissionId,
                                                             VerificationDtos.InternalVerifyRequest request);
}
