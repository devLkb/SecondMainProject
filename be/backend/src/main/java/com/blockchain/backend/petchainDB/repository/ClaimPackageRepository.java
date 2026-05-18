package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.ClaimPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClaimPackageRepository extends JpaRepository<ClaimPackage, Long> {
    boolean existsByClaimId(String claimId);
    Optional<ClaimPackage> findByClaimId(String claimId);
    Optional<ClaimPackage> findByMedicalRecord_RecordIdAndInsuranceCompany_Id(String recordId, Long insuranceCompanyId);
    List<ClaimPackage> findByMedicalRecord_RecordId(String recordId);
    List<ClaimPackage> findByGuardian_Id(Long guardianId);
    List<ClaimPackage> findByInsuranceCompany_Id(Long insuranceCompanyId);
}
