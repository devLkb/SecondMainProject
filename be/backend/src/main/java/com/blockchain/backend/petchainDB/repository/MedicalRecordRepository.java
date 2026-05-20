package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    boolean existsByRecordId(String recordId);
    Optional<MedicalRecord> findByRecordId(String recordId);
    List<MedicalRecord> findByPet_IdOrderByTreatmentDateDesc(Long petId);
}
