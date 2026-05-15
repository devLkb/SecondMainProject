package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.MedicalRecordDisease;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordDiseaseRepository extends JpaRepository<MedicalRecordDisease, Long> {
    List<MedicalRecordDisease> findByMedicalRecord_Id(Long medicalRecordId);
}
