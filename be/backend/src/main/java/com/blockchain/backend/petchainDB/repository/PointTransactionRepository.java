package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByToOwnerTypeAndToOwnerIdOrderByCreatedAtDesc(String ownerType, Long ownerId);
    List<PointTransaction> findByFromOwnerTypeAndFromOwnerIdOrderByCreatedAtDesc(String ownerType, Long ownerId);
    boolean existsByReversedTransactionId(Long reversedTransactionId);
}
