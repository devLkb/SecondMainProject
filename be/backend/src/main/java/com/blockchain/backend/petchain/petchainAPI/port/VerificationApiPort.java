package com.blockchain.backend.petchain.petchainAPI.port;

import com.blockchain.backend.petchain.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;

public interface VerificationApiPort {
    VerificationDtos.VerificationResponse verifySubmission(ApiActor actor,
                                                           String submissionId,
                                                           VerificationDtos.VerificationRequest request,
                                                           String idempotencyKeyHeader);

    VerificationDtos.VerificationDetailResponse getVerification(ApiActor actor, String verificationId);

    VerificationDtos.DeidentifiedDataResponse getDeidentifiedData(ApiActor actor, String verificationId);

    VerificationDtos.AuditLogResponse getVerificationAudit(ApiActor actor, String verificationId);
}
