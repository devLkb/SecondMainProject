package com.blockchain.backend.petchainAPI.port;

import com.blockchain.backend.petchainAPI.dto.consent.ConsentDtos;
import com.blockchain.backend.petchainAPI.security.ApiActor;

public interface ConsentApiPort {
    ConsentDtos.ConsentResponse createConsent(ApiActor actor, ConsentDtos.CreateConsentRequest request);

    ConsentDtos.ConsentListResponse listConsents(ApiActor actor, String recordId, String guardianId, String insurerId, String hospitalId);

    ConsentDtos.ConsentResponse getConsent(ApiActor actor, String consentId);

    ConsentDtos.ConsentResponse revokeConsent(ApiActor actor, String consentId, ConsentDtos.RevokeConsentRequest request);
}
