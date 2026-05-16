package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.PointBalance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PointBalanceRepository extends JpaRepository<PointBalance, Long> {
    Optional<PointBalance> findByOwnerTypeAndOwnerId(String ownerType, Long ownerId);
}
