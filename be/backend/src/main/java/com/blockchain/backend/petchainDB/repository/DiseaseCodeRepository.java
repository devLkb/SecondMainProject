package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.DiseaseCode;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiseaseCodeRepository extends JpaRepository<DiseaseCode, String> {
}
