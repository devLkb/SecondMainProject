package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.common.DomainValues;
import com.blockchain.backend.petchainAPI.dto.admin.PlatformDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.Hospital;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.User;
import com.blockchain.backend.petchainDB.entity.PointTransaction;
import com.blockchain.backend.petchainDB.repository.HospitalRepository;
import com.blockchain.backend.petchainDB.repository.InsuranceCompanyRepository;
import com.blockchain.backend.petchainDB.repository.PointBalanceRepository;
import com.blockchain.backend.petchainDB.repository.PointTransactionRepository;
import com.blockchain.backend.petchainDB.repository.RecordFlagRepository;
import com.blockchain.backend.petchainDB.repository.UserRepository;
import com.blockchain.backend.petchainDB.repository.VerificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

// 플랫폼 관리자 대시보드: Org(병원·보험사) 목록/승인, 모니터링 집계.
@Service
@RequiredArgsConstructor
public class PlatformAdminService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private final ApiDomainSupport support;
    private final HospitalRepository hospitalRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final UserRepository userRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final RecordFlagRepository recordFlagRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final PointTransactionRepository pointTransactionRepository;

    @Transactional(readOnly = true)
    public List<PlatformDtos.OrgResponse> listOrgs(ApiActor actor) {
        support.requireAdmin(actor);
        List<PlatformDtos.OrgResponse> orgs = new ArrayList<>();
        for (Hospital h : hospitalRepository.findAll()) {
            orgs.add(new PlatformDtos.OrgResponse(
                    h.getMemberNumber(), h.getName(), "병원",
                    h.getFabricOrgId(), formatDate(h.getCreatedAt()),
                    Boolean.TRUE.equals(h.getIsActive()) ? "active" : "pending",
                    null, null));
        }
        for (InsuranceCompany c : insuranceCompanyRepository.findAll()) {
            int balance = pointBalanceRepository
                    .findByOwnerTypeAndOwnerId(DomainValues.PointOwnerType.INSURANCE, c.getId())
                    .map(b -> b.getBalance() == null ? 0 : b.getBalance())
                    .orElse(0);
            int used = pointTransactionRepository.findAll().stream()
                    .filter(tx -> "spend".equalsIgnoreCase(tx.getTxType()))
                    .filter(tx -> DomainValues.PointOwnerType.INSURANCE.equals(tx.getFromOwnerType()))
                    .filter(tx -> Objects.equals(tx.getFromOwnerId(), c.getId()))
                    .mapToInt(PointTransaction::getAmount)
                    .sum();
            orgs.add(new PlatformDtos.OrgResponse(
                    c.getMemberNumber(), c.getName(), "보험사",
                    c.getFabricOrgId(), formatDate(c.getCreatedAt()),
                    Boolean.TRUE.equals(c.getIsActive()) ? "active" : "pending",
                    balance, used));
        }
        return orgs;
    }

    @Transactional
    public PlatformDtos.OrgResponse approveOrg(ApiActor actor, String orgId) {
        support.requireAdmin(actor);
        if (orgId != null && orgId.startsWith("H-")) {
            Hospital hospital = hospitalRepository.findAll().stream()
                    .filter(h -> Objects.equals(h.getMemberNumber(), orgId))
                    .findFirst()
                    .orElseThrow(() -> new ApiException(ApiErrorCode.HOSPITAL_INVALID, "병원을 찾을 수 없습니다."));
            hospital.setIsActive(true);
            activateUser(hospital.getUser());
            return new PlatformDtos.OrgResponse(hospital.getMemberNumber(), hospital.getName(), "병원",
                    hospital.getFabricOrgId(), formatDate(hospital.getCreatedAt()), "active",
                    null, null);
        }
        if (orgId != null && orgId.startsWith("P-")) {
            InsuranceCompany company = insuranceCompanyRepository.findAll().stream()
                    .filter(c -> Objects.equals(c.getMemberNumber(), orgId))
                    .findFirst()
                    .orElseThrow(() -> new ApiException(ApiErrorCode.INSURER_INVALID, "보험사를 찾을 수 없습니다."));
            company.setIsActive(true);
            activateUser(company.getUser());
            int balance = pointBalanceRepository
                    .findByOwnerTypeAndOwnerId(DomainValues.PointOwnerType.INSURANCE, company.getId())
                    .map(b -> b.getBalance() == null ? 0 : b.getBalance())
                    .orElse(0);
            return new PlatformDtos.OrgResponse(company.getMemberNumber(), company.getName(), "보험사",
                    company.getFabricOrgId(), formatDate(company.getCreatedAt()), "active",
                    balance, 0);
        }
        throw new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "Org를 찾을 수 없습니다.");
    }

    @Transactional(readOnly = true)
    public PlatformDtos.MonitorResponse monitor(ApiActor actor) {
        support.requireAdmin(actor);
        List<PlatformDtos.OrgResponse> orgs = listOrgs(actor);
        int total = orgs.size();
        int active = (int) orgs.stream().filter(o -> "active".equals(o.status())).count();
        int insurerBalance = pointBalanceRepository.findAll().stream()
                .filter(b -> DomainValues.PointOwnerType.INSURANCE.equals(b.getOwnerType()))
                .mapToInt(b -> b.getBalance() == null ? 0 : b.getBalance())
                .sum();
        return new PlatformDtos.MonitorResponse(
                total,
                active,
                total - active,
                verificationLogRepository.count(),
                recordFlagRepository.count(),
                recordFlagRepository.countByStatus("PENDING"),
                insurerBalance);
    }

    private void activateUser(User user) {
        if (user != null) {
            user.setStatus(DomainValues.AccountStatus.ACTIVE);
            userRepository.save(user);
        }
    }

    private static String formatDate(LocalDateTime value) {
        return value == null ? null : value.format(DATE);
    }
}
