package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.flag.FlagDtos;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainAPI.service.FlagService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 이상 신고: 보험사가 생성하고 플랫폼 관리자가 조회·처리한다.
@RestController
@RequestMapping({"/flags", "/api/flags"})
public class FlagController {

    private final FlagService flagService;

    public FlagController(FlagService flagService) {
        this.flagService = flagService;
    }

    @PostMapping
    public ResponseEntity<FlagDtos.FlagResponse> createFlag(
            ApiActor actor,
            @Valid @RequestBody FlagDtos.CreateFlagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flagService.createFlag(actor, request));
    }

    @GetMapping
    public ResponseEntity<List<FlagDtos.FlagResponse>> listFlags() {
        return ResponseEntity.ok(flagService.listFlags());
    }

    @PostMapping("/{flagId}/resolve")
    public ResponseEntity<FlagDtos.FlagResponse> resolveFlag(
            ApiActor actor,
            @PathVariable String flagId,
            @Valid @RequestBody FlagDtos.ResolveFlagRequest request) {
        return ResponseEntity.ok(flagService.resolveFlag(actor, flagId, request));
    }
}
