package com.blockchain.backend.petchain.petchainAPI.service;

import com.blockchain.backend.petchain.petchainAPI.dto.consent.ConsentDtos;
import com.blockchain.backend.petchain.petchainAPI.port.ConsentApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import org.springframework.stereotype.Service;

@Service
public class ConsentService implements ConsentApiPort {

    @Override
    public ConsentDtos.ConsentResponse createConsent(ApiActor actor, ConsentDtos.CreateConsentRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public ConsentDtos.ConsentListResponse listConsents(ApiActor actor, String recordId, String guardianId, String insurerId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public ConsentDtos.ConsentResponse getConsent(ApiActor actor, String consentId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public ConsentDtos.ConsentResponse revokeConsent(ApiActor actor, String consentId, ConsentDtos.RevokeConsentRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
