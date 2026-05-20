package com.blockchain.backend.petchainLOGIN.controller;

import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainLOGIN.dto.request.UpdateMeRequest;
import com.blockchain.backend.petchainLOGIN.dto.response.MeResponse;
import com.blockchain.backend.petchainLOGIN.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/users", "/api/users"})
@RequiredArgsConstructor
public class UserController {

    private final UserProfileService userProfileService;

    // 로그인한 회원 본인 프로필 조회
    @GetMapping("/me")
    public ResponseEntity<MeResponse> getMe(ApiActor actor) {
        return ResponseEntity.ok(userProfileService.getMe(requireUserId(actor)));
    }

    // 로그인한 회원 본인 프로필 수정 (거주지역 등)
    @PatchMapping("/me")
    public ResponseEntity<MeResponse> updateMe(ApiActor actor, @RequestBody UpdateMeRequest req) {
        return ResponseEntity.ok(userProfileService.updateMe(requireUserId(actor), req));
    }

    private static Long requireUserId(ApiActor actor) {
        try {
            return Long.parseLong(actor.actorId());
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("유효한 회원 인증 정보가 필요합니다.", exception);
        }
    }
}
