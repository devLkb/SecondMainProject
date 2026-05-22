package com.blockchain.backend.petchainLOGIN.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Pet;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordRepository;
import com.blockchain.backend.petchainDB.repository.PetInsuranceRepository;
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
    @Mock
    MedicalRecordRepository medicalRecordRepository;
    @Mock
    PetInsuranceRepository petInsuranceRepository;

    PetService petService;

    @BeforeEach
    void setUp() {
        petService = new PetService(petRepository, guardianRepository, medicalRecordRepository, petInsuranceRepository);
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

    @Test
    void registerPetStoresRequestedPetNumber() {
        Guardian guardian = new Guardian();
        PetRegisterRequest request = petRequest();
        request.setPetNumber("Z-12345678");
        when(guardianRepository.findByUser_Id(1L)).thenReturn(Optional.of(guardian));
        when(petRepository.existsByPetNumber("Z-12345678")).thenReturn(false);
        when(petRepository.save(any(Pet.class))).thenAnswer(invocation -> {
            Pet pet = invocation.getArgument(0);
            pet.setId(5L);
            pet.setRegisteredAt(LocalDateTime.parse("2026-05-16T10:00:00"));
            return pet;
        });

        PetResponse response = petService.registerPet(1L, request);

        assertThat(response.getPetNumber()).isEqualTo("Z-12345678");
    }

    @Test
    void registerPetRejectsDuplicateRequestedPetNumber() {
        Guardian guardian = new Guardian();
        PetRegisterRequest request = petRequest();
        request.setPetNumber("Z-12345678");
        when(guardianRepository.findByUser_Id(1L)).thenReturn(Optional.of(guardian));
        when(petRepository.existsByPetNumber("Z-12345678")).thenReturn(true);

        assertThatThrownBy(() -> petService.registerPet(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("이미 등록된 동물번호입니다.");
        verify(petRepository, never()).save(any(Pet.class));
    }

    @Test
    void registerPetRejectsInvalidRequestedPetNumberFormat() {
        Guardian guardian = new Guardian();
        PetRegisterRequest request = petRequest();
        request.setPetNumber("Z-123456789");
        when(guardianRepository.findByUser_Id(1L)).thenReturn(Optional.of(guardian));

        assertThatThrownBy(() -> petService.registerPet(1L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("동물번호 형식이 올바르지 않습니다.");
        verify(petRepository, never()).save(any(Pet.class));
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
