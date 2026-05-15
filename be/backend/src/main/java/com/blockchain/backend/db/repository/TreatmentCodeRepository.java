package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.TreatmentCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TreatmentCodeRepository extends JpaRepository<TreatmentCode, String> {
}
