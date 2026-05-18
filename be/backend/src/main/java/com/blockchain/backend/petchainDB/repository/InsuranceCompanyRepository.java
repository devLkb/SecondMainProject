package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InsuranceCompanyRepository extends JpaRepository<InsuranceCompany, Long> {
    Optional<InsuranceCompany> findByUser_Id(Long userId);
    boolean existsByFabricOrgId(String fabricOrgId);
    boolean existsByBusinessNumber(String businessNumber);
    boolean existsByMemberNumber(String memberNumber);
}
