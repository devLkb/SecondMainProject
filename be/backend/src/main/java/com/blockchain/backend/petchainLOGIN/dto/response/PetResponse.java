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
        this(pet.getId(),
                pet.getPetNumber(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getBirthYear(),
                pet.getGender(),
                pet.getIsNeutered(),
                pet.getRegisteredAt(),
                message);
    }

    public PetResponse(Long petId,
                       String petNumber,
                       String name,
                       String species,
                       String breed,
                       Integer birthYear,
                       String gender,
                       Boolean isNeutered,
                       LocalDateTime registeredAt,
                       String message) {
        this.petId       = petId;
        this.petNumber   = petNumber;
        this.name        = name;
        this.species     = species;
        this.breed       = breed;
        this.birthYear   = birthYear;
        this.gender      = gender;
        this.isNeutered  = isNeutered;
        this.registeredAt = registeredAt;
        this.message     = message;
    }

    // 프론트엔드는 펫 식별자를 p.id 로 읽으므로 petId 와 동일한 값을 id 로도 노출한다.
    public Long getId() {
        return petId;
    }

    public static PetResponse from(Pet pet, String message) {
        return new PetResponse(pet, message);
    }

    // 목록 조회용 — 안내 메시지 없이 변환한다.
    public static PetResponse from(Pet pet) {
        return new PetResponse(pet, null);
    }
}
