package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PetRepository extends JpaRepository<Pet, Long> {
    boolean existsByPetNumber(String petNumber);
    Optional<Pet> findByPetNumber(String petNumber);
    List<Pet> findByGuardian_Id(Long guardianId);
}
