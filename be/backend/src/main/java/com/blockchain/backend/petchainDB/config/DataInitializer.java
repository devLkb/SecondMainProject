package com.blockchain.backend.petchainDB.config;

import com.blockchain.backend.common.DomainValues.MemberType;
import com.blockchain.backend.common.DomainValues.AccountStatus;
import com.blockchain.backend.petchainDB.entity.DiseaseCode;
import com.blockchain.backend.petchainDB.entity.TreatmentCode;
import com.blockchain.backend.petchainDB.entity.User;
import com.blockchain.backend.petchainDB.repository.DiseaseCodeRepository;
import com.blockchain.backend.petchainDB.repository.TreatmentCodeRepository;
import com.blockchain.backend.petchainDB.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final DiseaseCodeRepository diseaseCodeRepository;
    private final TreatmentCodeRepository treatmentCodeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.login-id:admin}")
    private String adminLoginId;

    @Value("${admin.password:admin1234}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByLoginId(adminLoginId)) {
            User admin = new User();
            admin.setLoginId(adminLoginId);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setMemberType(MemberType.PLATFORM);
            admin.setStatus(AccountStatus.ACTIVE);
            userRepository.save(admin);
        }

        if (diseaseCodeRepository.count() == 0) {
            diseaseCodeRepository.saveAll(List.of(
                    new DiseaseCode("KC-001", "피부염",      "Dermatitis",        "피부",   true),
                    new DiseaseCode("KC-042", "골절",        "Fracture",          "근골격", true),
                    new DiseaseCode("KC-055", "관절염",      "Arthritis",         "근골격", true),
                    new DiseaseCode("KC-108", "슬개골 탈구", "Patellar Luxation", "근골격", true)
            ));
        }

        if (treatmentCodeRepository.count() == 0) {
            treatmentCodeRepository.saveAll(List.of(
                    new TreatmentCode("VA-011", "X-ray 촬영", "X-ray",      "영상검사", true),
                    new TreatmentCode("VA-025", "수술",       "Surgery",    "처치",     true),
                    new TreatmentCode("VA-032", "약물 처방",  "Medication", "처방",     true)
            ));
        }
    }
}
