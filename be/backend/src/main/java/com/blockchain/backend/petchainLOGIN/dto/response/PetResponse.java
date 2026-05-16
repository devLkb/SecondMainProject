package com.blockchain.backend.petchainLOGIN.dto.response;

import com.blockchain.backend.petchainDB.entity.Pet;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PetResponse {

    private final Long petId;
    private final String petNumber;
    private final String name;
    private final String species;
    private final String breed;
    private final Integer birthYear;
    private final String gender;
    private final Boolean isNeutered;
    private final LocalDateTime registeredAt;
    private final String message;

    public PetResponse(Pet pet, String message) {
        this.petId       = pet.getId();
        this.petNumber   = pet.getPetNumber();
        this.name        = pet.getName();
        this.species     = pet.getSpecies();
        this.breed       = pet.getBreed();
        this.birthYear   = pet.getBirthYear();
        this.gender      = pet.getGender();
        this.isNeutered  = pet.getIsNeutered();
        this.registeredAt = pet.getRegisteredAt();
        this.message     = message;
    }
}
