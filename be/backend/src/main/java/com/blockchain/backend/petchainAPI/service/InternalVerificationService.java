package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchainAPI.security.ActorType;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.ClaimPackage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InternalVerificationService implements InternalVerificationApiPort {
    private final ApiDomainSupport support;

    @Override
    public VerificationDtos.InternalVerifyResponse verifySubmission(ApiActor actor, String submissionId, VerificationDtos.InternalVerifyRequest request) {
        ClaimPackage claim = support.claimBySubmissionId(submissionId);
        String verificationId = "INTERNAL-" + claim.getClaimId();
        boolean activeConsent = "active".equalsIgnoreCase(claim.getConsentStatus());
        return new VerificationDtos.InternalVerifyResponse(
                claim.getClaimId(),
                verificationId,
                activeConsent ? com.blockchain.backend.petchainAPI.dto.common.VerificationStatus.PENDING : com.blockchain.backend.petchainAPI.dto.common.VerificationStatus.BLOCKED,
                activeConsent ? List.of() : List.of("CONSENT_NOT_ACTIVE"),
                claim.getClaimId(),
                Instant.now()
        );
    }
}
