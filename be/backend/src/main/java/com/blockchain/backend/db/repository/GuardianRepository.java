package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.Guardian;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GuardianRepository extends JpaRepository<Guardian, Long> {
    Optional<Guardian> findByUser_Id(Long userId);
    boolean existsByMemberNumber(String memberNumber);
}
