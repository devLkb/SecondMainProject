package com.blockchain.backend.petchainLOGIN.controller;

import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainLOGIN.dto.request.PetRegisterRequest;
import com.blockchain.backend.petchainLOGIN.dto.response.PetResponse;
import com.blockchain.backend.petchainLOGIN.service.PetService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    // 로그인한 보호자 본인의 동물 목록 조회
    @GetMapping
    public ResponseEntity<List<PetResponse>> getMyPets(ApiActor actor) {
        return ResponseEntity.ok(petService.getMyPets(requireUserId(actor)));
    }

    @PostMapping
    public ResponseEntity<PetResponse> registerPet(
            ApiActor actor,
            @Valid @RequestBody PetRegisterRequest req) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(petService.registerPet(requireUserId(actor), req));
    }

    private static Long requireUserId(ApiActor actor) {
        try {
            return Long.parseLong(actor.actorId());
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("유효한 보호자 인증 정보가 필요합니다.", exception);
        }
    }
}
