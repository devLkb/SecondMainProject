package com.blockchain.backend.petchain.petchainAPI;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.blockchain.backend.petchainAPI.controller.AdminController;
import com.blockchain.backend.petchainAPI.controller.ConsentController;
import com.blockchain.backend.petchainAPI.controller.InternalVerificationController;
import com.blockchain.backend.petchainAPI.controller.PointController;
import com.blockchain.backend.petchainAPI.controller.RecordController;
import com.blockchain.backend.petchainAPI.controller.SubmissionController;
import com.blockchain.backend.petchainAPI.controller.VerificationController;
import com.blockchain.backend.petchainAPI.dto.common.ClaimReviewStatus;
import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.blockchain.backend.petchainAPI.dto.common.ConsentStatus;
import com.blockchain.backend.petchainAPI.dto.common.PackageAccessStatus;
import com.blockchain.backend.petchainAPI.dto.common.VerificationStatus;
import com.blockchain.backend.petchainAPI.dto.submission.SubmissionDtos;
import com.blockchain.backend.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.AdminApiPort;
import com.blockchain.backend.petchainAPI.port.ConsentApiPort;
import com.blockchain.backend.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchainAPI.port.PointApiPort;
import com.blockchain.backend.petchainAPI.port.RecordApiPort;
import com.blockchain.backend.petchainAPI.port.SubmissionApiPort;
import com.blockchain.backend.petchainAPI.port.VerificationApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainLOGIN.util.JwtUtil;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = {
        RecordController.class,
        ConsentController.class,
        SubmissionController.class,
        VerificationController.class,
        InternalVerificationController.class,
        PointController.class,
        AdminController.class
})
@AutoConfigureMockMvc(addFilters = false)
class PetChainApiControllerTest {
    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    RecordApiPort recordApiPort;

    @MockitoBean
    ConsentApiPort consentApiPort;

    @MockitoBean
    SubmissionApiPort submissionApiPort;

    @MockitoBean
    VerificationApiPort verificationApiPort;

    @MockitoBean
    InternalVerificationApiPort internalVerificationApiPort;

    @MockitoBean
    PointApiPort pointApiPort;

    @MockitoBean
    AdminApiPort adminApiPort;

    @MockitoBean
    JwtUtil jwtUtil;

    @Test
    void verificationEndpointReturnsWrappedResultAndChargingFields() throws Exception {
        when(verificationApiPort.verifySubmission(
                any(ApiActor.class),
                eq("sub-1"),
                any(VerificationDtos.VerificationRequest.class),
                eq("retry-1")
        )).thenReturn(new VerificationDtos.VerificationResponse(
                "ver-1",
                "sub-1",
                VerificationStatus.PASSED,
                true,
                List.of(),
                List.of("CONSENT_ACTIVE", "RECORD_HASH_MATCHED"),
                "record-hash",
                consentSnapshot(),
                new CommonDtos.DeidentifiedVerificationData(
                        new BigDecimal("12000"),
                        List.of("T001"),
                        List.of("D001"),
                        LocalDate.parse("2026-05-01"),
                        "hospital-1",
                        "insurer-1"
                ),
                1,
                1,
                Instant.parse("2026-05-15T00:00:00Z"),
                "audit-1"
        ));

        mockMvc.perform(post("/submissions/sub-1/verification")
                        .header("X-Actor-Type", "INSURER")
                        .header("X-Actor-Id", "insurer-user-1")
                        .header("X-Actor-Org-Id", "insurer-1")
                        .header("X-Actor-Role", "CLAIM_REVIEWER")
                        .header("Idempotency-Key", "retry-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "submissionId": "sub-1",
                                  "recordId": "record-1",
                                  "hospitalId": "hospital-1",
                                  "insurerId": "insurer-1",
                                  "consentId": "consent-1",
                                  "recordHash": "record-hash",
                                  "requestedBy": "insurer-user-1",
                                  "requestedAt": "2026-05-15T00:00:00Z",
                                  "attachmentHashes": [
                                    {"attachmentId": "att-1", "fileName": "lab.pdf", "sha256": "att-hash"}
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationId").value("ver-1"))
                .andExpect(jsonPath("$.data.status").value("PASSED"))
                .andExpect(jsonPath("$.data.pointsCharged").value(1))
                .andExpect(jsonPath("$.data.hospitalCreditAccrued").value(1))
                .andExpect(jsonPath("$.data.deidentifiedVerificationData.treatmentCodes[0]").value("T001"));
    }

    @Test
    void submissionPackageReturnsSignedUrlsWithoutRecordOrAttachmentBodies() throws Exception {
        when(submissionApiPort.getSubmissionPackage(any(ApiActor.class), eq("sub-1")))
                .thenReturn(new SubmissionDtos.SubmissionPackageResponse(
                        "sub-1",
                        "ver-1",
                        "record-1",
                        PackageAccessStatus.AVAILABLE,
                        new CommonDtos.SignedFileUrl("record-file", "record.pdf", "https://signed.example/record", Instant.parse("2026-05-15T00:10:00Z"), true),
                        List.of(new CommonDtos.SignedFileUrl("att-1", "lab.pdf", "https://signed.example/att-1", Instant.parse("2026-05-15T00:10:00Z"), true)),
                        "record-hash",
                        List.of(new CommonDtos.AttachmentHash("att-1", "lab.pdf", "att-hash")),
                        new CommonDtos.VerificationSummary("ver-1", VerificationStatus.PASSED, List.of(), Instant.parse("2026-05-15T00:00:00Z")),
                        consentSnapshot(),
                        new CommonDtos.HospitalMinimumInfo("hospital-1", "Care Hospital", "123-45"),
                        new CommonDtos.GuardianMinimumInfo("guardian-1", "K**", "010-****"),
                        new CommonDtos.PetMinimumInfo("pet-1", "Bori", "DOG", "Jindo"),
                        Instant.parse("2026-05-15T00:00:00Z"),
                        Instant.parse("2026-05-15T00:00:00Z"),
                        "audit-1"
                ));

        mockMvc.perform(get("/submissions/sub-1/package")
                        .header("X-Actor-Type", "INSURER")
                        .header("X-Actor-Org-Id", "insurer-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recordFileUrl.url").value("https://signed.example/record"))
                .andExpect(jsonPath("$.data.attachmentFileUrls[0].url").value("https://signed.example/att-1"))
                .andExpect(jsonPath("$.data.recordBody").doesNotExist())
                .andExpect(jsonPath("$.data.attachmentFileUrls[0].body").doesNotExist());
    }

    @Test
    void claimStatusRejectsDisclosableFlagForNonDecisionStatus() throws Exception {
        mockMvc.perform(post("/submissions/sub-1/claim-status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "UNDER_REVIEW",
                                  "disclosable": true,
                                  "claimReferenceId": "claim-1"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    @Test
    void verificationApiExceptionMapsInsufficientPointsToPaymentRequired() throws Exception {
        when(verificationApiPort.verifySubmission(
                any(ApiActor.class),
                eq("sub-1"),
                any(VerificationDtos.VerificationRequest.class),
                eq(null)
        )).thenThrow(new ApiException(ApiErrorCode.INSUFFICIENT_POINTS, "Insurer point balance is insufficient"));

        mockMvc.perform(post("/submissions/sub-1/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validVerificationRequest()))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.errorCode").value("INSUFFICIENT_POINTS"));
    }

    @Test
    void bannerCreditSpendEndpointIsExcludedFromMvpApi() throws Exception {
        mockMvc.perform(post("/hospitals/hospital-1/credits/spend/banner")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"bannerType":"MAIN"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void saasCreditSpendEndpointRemainsRegistered() throws Exception {
        mockMvc.perform(post("/hospitals/hospital-1/credits/spend/saas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"));
    }

    private static CommonDtos.ConsentSnapshot consentSnapshot() {
        return new CommonDtos.ConsentSnapshot(
                "consent-1",
                ConsentStatus.ACTIVE,
                "guardian-1",
                "insurer-1",
                Instant.parse("2026-05-01T00:00:00Z"),
                Instant.parse("2027-05-01T00:00:00Z"),
                null
        );
    }

    private static String validVerificationRequest() {
        return """
                {
                  "submissionId": "sub-1",
                  "recordId": "record-1",
                  "hospitalId": "hospital-1",
                  "insurerId": "insurer-1",
                  "consentId": "consent-1",
                  "recordHash": "record-hash",
                  "requestedBy": "insurer-user-1",
                  "requestedAt": "2026-05-15T00:00:00Z"
                }
                """;
    }
}
