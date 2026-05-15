package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.MedicalRecordDisease;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordDiseaseRepository extends JpaRepository<MedicalRecordDisease, Long> {
    List<MedicalRecordDisease> findByMedicalRecord_Id(Long medicalRecordId);
}
