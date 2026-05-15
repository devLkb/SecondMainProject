package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.PetInsurance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PetInsuranceRepository extends JpaRepository<PetInsurance, Long> {
    List<PetInsurance> findByPet_Id(Long petId);
    List<PetInsurance> findByGuardian_Id(Long guardianId);
}
