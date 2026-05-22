package com.blockchain.backend;

import com.blockchain.backend.petchainAPI.port.AdminApiPort;
import com.blockchain.backend.petchainAPI.port.ConsentApiPort;
import com.blockchain.backend.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchainAPI.port.PointApiPort;
import com.blockchain.backend.petchainAPI.port.PostApiPort;
import com.blockchain.backend.petchainAPI.port.RecordApiPort;
import com.blockchain.backend.petchainAPI.port.SubmissionApiPort;
import com.blockchain.backend.petchainAPI.port.VerificationApiPort;
import com.blockchain.backend.petchainAPI.service.FileUploadService;
import com.blockchain.backend.petchainAPI.service.FlagService;
import com.blockchain.backend.petchainAPI.service.PlatformAdminService;
import com.blockchain.backend.petchainDB.config.DataInitializer;
import com.blockchain.backend.petchainDB.repository.ClaimPackageRepository;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.HospitalRepository;
import com.blockchain.backend.petchainDB.repository.InsuranceCompanyRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordDiseaseRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordFileRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordTreatmentRepository;
import com.blockchain.backend.petchainDB.repository.PointTransactionRepository;
import com.blockchain.backend.petchainDB.repository.VerificationLogRepository;
import com.blockchain.backend.petchainLOGIN.oauth.OAuthService;
import com.blockchain.backend.petchainLOGIN.service.AuthService;
import com.blockchain.backend.petchainLOGIN.service.PetService;
import com.blockchain.backend.petchainLOGIN.service.RefreshTokenCleaner;
import com.blockchain.backend.petchainLOGIN.service.UserProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,"
                + "org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration"
})
class BackendApplicationTests {

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
    PlatformAdminService platformAdminService;

    @MockitoBean
    FlagService flagService;

    @MockitoBean
    FileUploadService fileUploadService;

    @MockitoBean
    MedicalRecordRepository medicalRecordRepository;

    @MockitoBean
    MedicalRecordFileRepository medicalRecordFileRepository;

    @MockitoBean
    MedicalRecordTreatmentRepository medicalRecordTreatmentRepository;

    @MockitoBean
    MedicalRecordDiseaseRepository medicalRecordDiseaseRepository;

    @MockitoBean
    ClaimPackageRepository claimPackageRepository;

    @MockitoBean
    VerificationLogRepository verificationLogRepository;

    @MockitoBean
    PointTransactionRepository pointTransactionRepository;

    @MockitoBean
    HospitalRepository hospitalRepository;

    @MockitoBean
    GuardianRepository guardianRepository;

    @MockitoBean
    InsuranceCompanyRepository insuranceCompanyRepository;

    @MockitoBean
    AuthService authService;

    @MockitoBean
    UserProfileService userProfileService;

    @MockitoBean
    PetService petService;

    @MockitoBean
    OAuthService oAuthService;

    @MockitoBean
    DataInitializer dataInitializer;

    @MockitoBean
    RefreshTokenCleaner refreshTokenCleaner;

    @Test
    void contextLoads() {
    }
}
