package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.TreatmentCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TreatmentCodeRepository extends JpaRepository<TreatmentCode, String> {
}
