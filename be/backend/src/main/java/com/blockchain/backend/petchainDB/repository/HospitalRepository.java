package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {
    boolean existsByFabricOrgId(String fabricOrgId);
    boolean existsByBusinessNumber(String businessNumber);
    boolean existsByMemberNumber(String memberNumber);
}
