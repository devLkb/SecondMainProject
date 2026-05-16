package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VerificationLogRepository extends JpaRepository<VerificationLog, Long> {
    List<VerificationLog> findByClaimPackage_Id(Long claimPackageId);
}
