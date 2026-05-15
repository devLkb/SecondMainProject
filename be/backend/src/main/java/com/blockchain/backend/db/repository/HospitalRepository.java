package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    boolean existsByFabricOrgId(String fabricOrgId);
    boolean existsByBusinessNumber(String businessNumber);
    boolean existsByMemberNumber(String memberNumber);
}
