package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.PetInsurance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PetInsuranceRepository extends JpaRepository<PetInsurance, Long> {
    List<PetInsurance> findByPet_Id(Long petId);
    List<PetInsurance> findByGuardian_Id(Long guardianId);
    Optional<PetInsurance> findFirstByPet_IdAndInsuranceCompany_Id(Long petId, Long insuranceCompanyId);
}
