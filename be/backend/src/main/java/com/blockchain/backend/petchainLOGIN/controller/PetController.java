package com.blockchain.backend.petchainLOGIN.controller;

import com.blockchain.backend.petchainDB.entity.Pet;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainLOGIN.dto.request.PetRegisterRequest;
import com.blockchain.backend.petchainLOGIN.dto.response.PetResponse;
import com.blockchain.backend.petchainLOGIN.service.PetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    @PostMapping
    public ResponseEntity<PetResponse> registerPet(
            ApiActor actor,
            @Valid @RequestBody PetRegisterRequest req) {

        Long userId = Long.parseLong(actor.actorId());
        Pet pet = petService.registerPet(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new PetResponse(pet, "동물 등록이 완료되었습니다."));
    }
}
