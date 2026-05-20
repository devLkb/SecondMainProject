package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.RecordFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecordFlagRepository extends JpaRepository<RecordFlag, Long> {
    List<RecordFlag> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
}
