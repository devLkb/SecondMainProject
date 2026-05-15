package com.blockchain.backend.db.repository;

import com.blockchain.backend.db.entity.Pet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PetRepository extends JpaRepository<Pet, Long> {
    boolean existsByPetNumber(String petNumber);
    List<Pet> findByGuardian_Id(Long guardianId);
}
