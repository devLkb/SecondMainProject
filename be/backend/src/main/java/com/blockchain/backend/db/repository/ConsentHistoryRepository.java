package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.ConsentHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsentHistoryRepository extends JpaRepository<ConsentHistory, Long> {
    List<ConsentHistory> findByClaimPackage_IdOrderByActedAtDesc(Long claimPackageId);
}
