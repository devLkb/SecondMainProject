package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.RecordFlag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecordFlagRepository extends JpaRepository<RecordFlag, Long> {
    List<RecordFlag> findAllByOrderByCreatedAtDesc();
    long countByStatus(String status);
    // 같은 보험사가 같은 record 에 대해 처리되지 않은(PENDING) 신고를 또 만들지 못하게 막는다.
    boolean existsByRecordIdAndReportedByInsurerIdAndStatus(String recordId, Long reportedByInsurerId, String status);
}
