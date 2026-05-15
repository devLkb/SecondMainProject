package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsuranceCompanyRepository extends JpaRepository<InsuranceCompany, Long> {
    boolean existsByFabricOrgId(String fabricOrgId);
    boolean existsByBusinessNumber(String businessNumber);
    boolean existsByMemberNumber(String memberNumber);
}
