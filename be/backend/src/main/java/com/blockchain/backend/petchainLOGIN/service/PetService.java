package com.blockchain.backend.petchainLOGIN.service;

import com.blockchain.backend.common.IdentifierGenerator;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Pet;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.MedicalRecordRepository;
import com.blockchain.backend.petchainDB.repository.PetInsuranceRepository;
import com.blockchain.backend.petchainDB.repository.PetRepository;
import com.blockchain.backend.petchainLOGIN.dto.request.PetRegisterRequest;
import com.blockchain.backend.petchainLOGIN.dto.response.PetDetailResponse;
import com.blockchain.backend.petchainLOGIN.dto.response.PetResponse;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PetService {

    private final PetRepository petRepository;
    private final GuardianRepository guardianRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PetInsuranceRepository petInsuranceRepository;

    // 로그인한 보호자 본인이 등록한 동물 목록 조회
    @Transactional(readOnly = true)
    public List<PetResponse> getMyPets(Long userId) {
        Guardian guardian = guardianRepository.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalArgumentException("보호자 정보를 찾을 수 없습니다."));
        return petRepository.findByGuardian_Id(guardian.getId()).stream()
                .map(PetResponse::from)
                .toList();
    }

    @Transactional
    public PetResponse registerPet(Long userId, PetRegisterRequest req) {
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

        Pet savedPet = petRepository.save(pet);
        return PetResponse.from(savedPet, "동물 등록이 완료되었습니다.");
    }

    // 병원의 환자 조회 — 펫 ID(DB id 또는 펫번호 A-xxxxxxxx)로 펫 + 진료기록을 조회한다.
    @Transactional(readOnly = true)
    public PetDetailResponse getPetDetail(String petId) {
        Pet pet = resolvePet(petId);
        String insurer = petInsuranceRepository.findByPet_Id(pet.getId()).stream()
                .findFirst()
                .map(pi -> pi.getInsuranceCompany() == null ? null : pi.getInsuranceCompany().getName())
                .orElse(null);
        List<PetDetailResponse.RecordItem> records = medicalRecordRepository
                .findByPet_IdOrderByTreatmentDateDesc(pet.getId()).stream()
                .map(r -> new PetDetailResponse.RecordItem(
                        r.getRecordId(),
                        r.getTreatmentDate() == null ? null : r.getTreatmentDate().toString(),
                        pet.getName(),
                        splitCodes(r.getFindingsEncrypted()),
                        splitCodes(r.getPrescriptionEncrypted()),
                        r.getTotalCost(),
                        r.getTestResultsEncrypted(),
                        r.getDetailDataHash() != null))
                .toList();
        // 프론트는 펫번호(A-xxxxxxxx)를 검색·표시에 쓰므로 id/petId 모두 펫번호 문자열로 통일한다.
        return new PetDetailResponse(pet.getPetNumber(), pet.getPetNumber(), pet.getPetNumber(), pet.getName(),
                pet.getSpecies(), pet.getBreed(), pet.getBirthYear(), insurer, records);
    }

    private Pet resolvePet(String petId) {
        String value = petId == null ? "" : petId.trim();
        try {
            return petRepository.findById(Long.parseLong(value))
                    .orElseThrow(() -> new IllegalArgumentException("등록된 반려동물을 찾을 수 없습니다."));
        } catch (NumberFormatException notNumeric) {
            return petRepository.findByPetNumber(value)
                    .orElseThrow(() -> new IllegalArgumentException("등록된 반려동물을 찾을 수 없습니다."));
        }
    }

    private static List<String> splitCodes(String stored) {
        if (stored == null || stored.isBlank()) return List.of();
        return Arrays.stream(stored.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    private String uniquePetNumber() {
        for (int i = 0; i < 10; i++) {
            String num = IdentifierGenerator.generatePetNumber();
            if (!petRepository.existsByPetNumber(num)) return num;
        }
        throw new IllegalStateException("동물번호 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
}
