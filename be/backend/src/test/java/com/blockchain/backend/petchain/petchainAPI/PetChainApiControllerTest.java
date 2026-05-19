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
import com.blockchain.backend.petchainAPI.controller.FileUploadController;
import com.blockchain.backend.petchainAPI.controller.InternalVerificationController;
import com.blockchain.backend.petchainAPI.controller.PointController;
import com.blockchain.backend.petchainAPI.controller.PostController;
import com.blockchain.backend.petchainAPI.controller.RecordController;
import com.blockchain.backend.petchainAPI.controller.SubmissionController;
import com.blockchain.backend.petchainAPI.controller.VerificationController;
import com.blockchain.backend.petchainAPI.dto.common.ClaimReviewStatus;
import com.blockchain.backend.petchainAPI.dto.common.CommonDtos;
import com.blockchain.backend.petchainAPI.dto.common.ConsentStatus;
import com.blockchain.backend.petchainAPI.dto.common.PackageAccessStatus;
import com.blockchain.backend.petchainAPI.dto.common.VerificationStatus;
import com.blockchain.backend.petchainAPI.dto.post.PostDtos;
import com.blockchain.backend.petchainAPI.dto.submission.SubmissionDtos;
import com.blockchain.backend.petchainAPI.dto.verification.VerificationDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.AdminApiPort;
import com.blockchain.backend.petchainAPI.port.ConsentApiPort;
import com.blockchain.backend.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchainAPI.port.PointApiPort;
import com.blockchain.backend.petchainAPI.port.PostApiPort;
import com.blockchain.backend.petchainAPI.port.RecordApiPort;
import com.blockchain.backend.petchainAPI.port.SubmissionApiPort;
import com.blockchain.backend.petchainAPI.port.VerificationApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainAPI.service.FileUploadService;
import com.blockchain.backend.petchainLOGIN.util.JwtUtil;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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
        AdminController.class,
        PostController.class,
        FileUploadController.class
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
    PostApiPort postApiPort;

    @MockitoBean
    FileUploadService fileUploadService;

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
    void apiExceptionResponsePreservesErrorShapeDetailsAndTraceId() throws Exception {
        when(verificationApiPort.verifySubmission(
                any(ApiActor.class),
                eq("sub-1"),
                any(VerificationDtos.VerificationRequest.class),
                eq(null)
        )).thenThrow(new ApiException(
                ApiErrorCode.INSUFFICIENT_POINTS,
                "Insurer point balance is insufficient",
                Map.of("required", 1, "balance", 0)
        ));

        mockMvc.perform(post("/submissions/sub-1/verification")
                        .header("X-Trace-Id", "trace-api-exception")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validVerificationRequest()))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.errorCode").value("INSUFFICIENT_POINTS"))
                .andExpect(jsonPath("$.message").value("Insurer point balance is insufficient"))
                .andExpect(jsonPath("$.traceId").value("trace-api-exception"))
                .andExpect(jsonPath("$.details.required").value(1))
                .andExpect(jsonPath("$.details.balance").value(0));
    }

    @Test
    void requestBodyValidationReturnsFieldDetails() throws Exception {
        mockMvc.perform(post("/submissions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Request validation failed"))
                .andExpect(jsonPath("$.details.recordId").exists())
                .andExpect(jsonPath("$.details.insurerId").exists());
    }

    @Test
    void requestParamValidationReturnsParameterDetails() throws Exception {
        mockMvc.perform(get("/records")
                        .param("page", "-1")
                        .param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Request validation failed"))
                .andExpect(jsonPath("$.details.page").exists())
                .andExpect(jsonPath("$.details.size").exists());
    }

    @Test
    void malformedJsonReturnsValidationErrorWithReason() throws Exception {
        mockMvc.perform(post("/submissions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"recordId\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Malformed or unsupported request body"))
                .andExpect(jsonPath("$.details.reason").exists());
    }

    @Test
    void illegalArgumentExceptionMapsToBadRequest() throws Exception {
        when(recordApiPort.getRecord(any(ApiActor.class), eq("record-1")))
                .thenThrow(new IllegalArgumentException("recordId is invalid"));

        mockMvc.perform(get("/records/record-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("recordId is invalid"));
    }

    @Test
    void illegalStateExceptionMapsToGenericInternalError() throws Exception {
        when(recordApiPort.getRecord(any(ApiActor.class), eq("record-2")))
                .thenThrow(new IllegalStateException("database password leaked detail"));

        mockMvc.perform(get("/records/record-2"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errorCode").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("서버 오류가 발생했습니다."));
    }

    @Test
    void postCreateRejectsBlankContentWithFieldDetails() throws Exception {
        mockMvc.perform(post("/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"   "}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details.content").value("게시물 내용을 입력해주세요."));
    }

    @Test
    void postCreateMapsServiceApiException() throws Exception {
        when(postApiPort.createPost(any(ApiActor.class), any(PostDtos.CreatePostRequest.class)))
                .thenThrow(new ApiException(ApiErrorCode.CONFLICT, "Post already exists", Map.of("content", "duplicate")));

        mockMvc.perform(post("/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"hello"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Post already exists"))
                .andExpect(jsonPath("$.details.content").value("duplicate"));
    }

    @Test
    void fileUploadRejectsMissingS3KeyWithFieldDetails() throws Exception {
        mockMvc.perform(post("/records/1/files")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.details.s3Key").exists());
    }

    @Test
    void fileUploadMapsServiceException() throws Exception {
        when(fileUploadService.saveFileMeta(eq(1L), eq("records/1/file.pdf"), eq("file.pdf"), eq(10L), eq("application/pdf"), eq("other")))
                .thenThrow(new IllegalArgumentException("진료기록을 찾을 수 없습니다."));

        mockMvc.perform(post("/records/1/files")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "s3Key":"records/1/file.pdf",
                                  "originalFilename":"file.pdf",
                                  "fileSize":10,
                                  "mimeType":"application/pdf"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("진료기록을 찾을 수 없습니다."));
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
