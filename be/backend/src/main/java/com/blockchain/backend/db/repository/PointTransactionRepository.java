package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByToOwnerTypeAndToOwnerIdOrderByCreatedAtDesc(String ownerType, Long ownerId);
    List<PointTransaction> findByFromOwnerTypeAndFromOwnerIdOrderByCreatedAtDesc(String ownerType, Long ownerId);
}
