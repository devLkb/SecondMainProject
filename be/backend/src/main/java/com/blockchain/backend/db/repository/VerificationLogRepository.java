package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.VerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VerificationLogRepository extends JpaRepository<VerificationLog, Long> {
    List<VerificationLog> findByClaimPackage_Id(Long claimPackageId);
}
