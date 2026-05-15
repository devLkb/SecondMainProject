package com.blockchain.backend;

import com.blockchain.backend.petchainAPI.port.AdminApiPort;
import com.blockchain.backend.petchainAPI.port.ConsentApiPort;
import com.blockchain.backend.petchainAPI.port.InternalVerificationApiPort;
import com.blockchain.backend.petchainAPI.port.PointApiPort;
import com.blockchain.backend.petchainAPI.port.RecordApiPort;
import com.blockchain.backend.petchainAPI.port.SubmissionApiPort;
import com.blockchain.backend.petchainAPI.port.VerificationApiPort;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
        "spring.autoconfigure.exclude="
                + "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
                + "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration"
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

    @Test
    void contextLoads() {
    }
}
