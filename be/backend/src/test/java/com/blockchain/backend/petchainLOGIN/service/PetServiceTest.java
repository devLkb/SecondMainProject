package com.blockchain.backend.petchainLOGIN.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Pet;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.PetRepository;
import com.blockchain.backend.petchainLOGIN.dto.request.PetRegisterRequest;
import com.blockchain.backend.petchainLOGIN.dto.response.PetResponse;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PetServiceTest {

    @Mock
    PetRepository petRepository;
    @Mock
    GuardianRepository guardianRepository;

    PetService petService;

    @BeforeEach
    void setUp() {
        petService = new PetService(petRepository, guardianRepository);
    }

    @Test
    void registerPetReturnsResponseDto() {
        Guardian guardian = new Guardian();
        when(guardianRepository.findByUser_Id(1L)).thenReturn(Optional.of(guardian));
        when(petRepository.save(any(Pet.class))).thenAnswer(invocation -> {
            Pet pet = invocation.getArgument(0);
            pet.setId(5L);
            pet.setRegisteredAt(LocalDateTime.parse("2026-05-16T10:00:00"));
            return pet;
        });

        PetResponse response = petService.registerPet(1L, petRequest());

        assertThat(response.getPetId()).isEqualTo(5L);
        assertThat(response.getPetNumber()).startsWith("A-");
        assertThat(response.getName()).isEqualTo("Bori");
        assertThat(response.getSpecies()).isEqualTo("dog");
        assertThat(response.getMessage()).isEqualTo("동물 등록이 완료되었습니다.");
    }

    @Test
    void registerPetRejectsMissingGuardianProfile() {
        when(guardianRepository.findByUser_Id(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> petService.registerPet(1L, petRequest()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("보호자 정보를 찾을 수 없습니다.");
    }

    private static PetRegisterRequest petRequest() {
        PetRegisterRequest request = new PetRegisterRequest();
        request.setName("Bori");
        request.setSpecies("dog");
        request.setBreed("Jindo");
        request.setBirthYear(2022);
        request.setGender("male");
        request.setIsNeutered(true);
        return request;
    }
}
