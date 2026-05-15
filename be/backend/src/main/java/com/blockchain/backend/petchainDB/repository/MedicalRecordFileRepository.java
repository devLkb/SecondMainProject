package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.MedicalRecordFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalRecordFileRepository extends JpaRepository<MedicalRecordFile, Long> {
    List<MedicalRecordFile> findByMedicalRecord_IdAndIsDeletedFalse(Long medicalRecordId);
}
