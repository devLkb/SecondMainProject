package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.MedicalRecordTreatment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordTreatmentRepository extends JpaRepository<MedicalRecordTreatment, Long> {
    List<MedicalRecordTreatment> findByMedicalRecord_Id(Long medicalRecordId);
}
