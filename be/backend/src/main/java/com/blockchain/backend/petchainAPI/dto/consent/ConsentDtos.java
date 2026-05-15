package com.blockchain.backend.petchainAPI.dto.consent;

import com.blockchain.backend.petchainAPI.dto.common.ConsentStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

public final class ConsentDtos {
    private ConsentDtos() {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record CreateConsentRequest(
            @NotBlank String recordId,
            @NotBlank String insurerId,
            @NotBlank String guardianId
    ) {
    }

    public record ConsentResponse(
            @NotBlank String consentId,
            @NotBlank String recordId,
            @NotBlank String insurerId,
            @NotBlank String guardianId,
            @NotNull ConsentStatus status,
            Instant validFrom,
            Instant expiresAt,
            String blockchainReference,
            String auditLogId
    ) {
    }

    public record ConsentListResponse(
            List<@Valid ConsentResponse> consents
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = false)
    public record RevokeConsentRequest(
            String reason
    ) {
    }
}
