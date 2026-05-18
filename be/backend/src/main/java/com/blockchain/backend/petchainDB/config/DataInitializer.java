package com.blockchain.backend.petchainDB.config;

import com.blockchain.backend.common.DomainValues.MemberType;
import com.blockchain.backend.common.DomainValues.AccountStatus;
import com.blockchain.backend.common.DomainValues.PointOwnerType;
import com.blockchain.backend.common.IdentifierGenerator;
import com.blockchain.backend.petchainDB.entity.DiseaseCode;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.PointBalance;
import com.blockchain.backend.petchainDB.entity.TreatmentCode;
import com.blockchain.backend.petchainDB.entity.User;
import com.blockchain.backend.petchainDB.repository.DiseaseCodeRepository;
import com.blockchain.backend.petchainDB.repository.InsuranceCompanyRepository;
import com.blockchain.backend.petchainDB.repository.PointBalanceRepository;
import com.blockchain.backend.petchainDB.repository.TreatmentCodeRepository;
import com.blockchain.backend.petchainDB.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    // 운영 환경에서 사용이 금지된 기본 자격증명
    private static final String DEFAULT_ADMIN_PASSWORD = "admin1234";

    // 시드 보험사 계정 공통 비밀번호 (개발/데모용)
    private static final String INSURANCE_SEED_PASSWORD = "insurance1234";

    private final DiseaseCodeRepository diseaseCodeRepository;
    private final TreatmentCodeRepository treatmentCodeRepository;
    private final UserRepository userRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${admin.login-id:admin}")
    private String adminLoginId;

    @Value("${admin.password:admin1234}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // 운영 프로파일에서는 기본 비밀번호로 admin 계정을 만들지 않는다 — 부팅 실패시킴
        if (environment.matchesProfiles("prod")
                && (adminPassword == null || adminPassword.isBlank()
                    || DEFAULT_ADMIN_PASSWORD.equals(adminPassword))) {
            throw new IllegalStateException(
                    "운영 환경에서는 ADMIN_PASSWORD 환경변수를 기본값이 아닌 값으로 반드시 설정해야 합니다.");
        }

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

        seedInsuranceCompanies();
    }

    /** 서버 기동 시 데모/개발용 보험사 계정 3개를 보장한다. (운영 프로파일에서는 생성하지 않음) */
    private void seedInsuranceCompanies() {
        if (environment.matchesProfiles("prod")) {
            return;
        }
        List<InsuranceSeed> seeds = List.of(
                new InsuranceSeed("삼성화재해상보험",   "insurance-samsung", "110-81-10001", "admin@samsungfire.example.com"),
                new InsuranceSeed("DB손해보험",        "insurance-db",      "110-81-10002", "admin@dbins.example.com"),
                new InsuranceSeed("메리츠화재해상보험", "insurance-meritz",  "110-81-10003", "admin@meritzfire.example.com")
        );
        for (InsuranceSeed seed : seeds) {
            // loginId(fabricOrgId)로 멱등성 보장 — 이미 있으면 건너뛴다
            if (userRepository.existsByLoginId(seed.fabricOrgId())) {
                continue;
            }
            User user = new User();
            user.setLoginId(seed.fabricOrgId());
            user.setPasswordHash(passwordEncoder.encode(INSURANCE_SEED_PASSWORD));
            user.setMemberType(MemberType.INSURANCE);
            user.setStatus(AccountStatus.ACTIVE); // 시드 계정은 승인 절차 없이 바로 사용
            userRepository.save(user);

            InsuranceCompany company = new InsuranceCompany();
            company.setUser(user);
            company.setMemberNumber(uniqueInsuranceNumber());
            company.setName(seed.name());
            company.setBusinessNumber(seed.businessNumber());
            company.setFabricOrgId(seed.fabricOrgId());
            company.setAdminEmail(seed.adminEmail());
            company.setIsActive(true);
            insuranceCompanyRepository.save(company);

            PointBalance balance = new PointBalance();
            balance.setOwnerType(PointOwnerType.INSURANCE);
            balance.setOwnerId(company.getId());
            balance.setBalance(0);
            pointBalanceRepository.save(balance);
        }
    }

    private String uniqueInsuranceNumber() {
        for (int i = 0; i < 10; i++) {
            String num = IdentifierGenerator.generateInsuranceNumber();
            if (!insuranceCompanyRepository.existsByMemberNumber(num)) {
                return num;
            }
        }
        throw new IllegalStateException("보험사 회원번호 생성에 실패했습니다.");
    }

    private record InsuranceSeed(String name, String fabricOrgId, String businessNumber, String adminEmail) {}
}
