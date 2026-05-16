package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.ConsentHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsentHistoryRepository extends JpaRepository<ConsentHistory, Long> {
    List<ConsentHistory> findByClaimPackage_IdOrderByActedAtDesc(Long claimPackageId);
}
