package com.blockchain.backend.petchainLOGIN.service;

import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Pet;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.PetRepository;
import com.blockchain.backend.petchainLOGIN.dto.request.PetRegisterRequest;
import com.blockchain.backend.petchainLOGIN.util.MemberNumberGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PetService {

    private final PetRepository petRepository;
    private final GuardianRepository guardianRepository;

    @Transactional
    public Pet registerPet(Long userId, PetRegisterRequest req) {
        Guardian guardian = guardianRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("보호자 정보를 찾을 수 없습니다."));

        String petNumber = uniquePetNumber();

        Pet pet = new Pet();
        pet.setGuardian(guardian);
        pet.setPetNumber(petNumber);
        pet.setName(req.getName());
        pet.setSpecies(req.getSpecies());
        pet.setBreed(req.getBreed());
        pet.setBirthYear(req.getBirthYear());
        pet.setGender(req.getGender());
        pet.setIsNeutered(req.getIsNeutered());

        return petRepository.save(pet);
    }

    private String uniquePetNumber() {
        for (int i = 0; i < 10; i++) {
            String num = MemberNumberGenerator.generatePetNumber();
            if (!petRepository.existsByPetNumber(num)) return num;
        }
        throw new IllegalStateException("동물번호 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
}
