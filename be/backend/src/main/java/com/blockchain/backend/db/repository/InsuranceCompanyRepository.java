package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.InsuranceCompany;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsuranceCompanyRepository extends JpaRepository<InsuranceCompany, Long> {
    boolean existsByFabricOrgId(String fabricOrgId);
    boolean existsByBusinessNumber(String businessNumber);
    boolean existsByMemberNumber(String memberNumber);
}
