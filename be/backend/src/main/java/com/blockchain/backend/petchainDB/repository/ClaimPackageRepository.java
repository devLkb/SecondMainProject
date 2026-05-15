package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.ClaimPackage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClaimPackageRepository extends JpaRepository<ClaimPackage, Long> {
    boolean existsByClaimId(String claimId);
    Optional<ClaimPackage> findByClaimId(String claimId);
}
