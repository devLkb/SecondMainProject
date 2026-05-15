package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.DiseaseCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiseaseCodeRepository extends JpaRepository<DiseaseCode, String> {
}
