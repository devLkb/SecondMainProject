package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.admin.PlatformDtos;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainAPI.service.PlatformAdminService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 플랫폼 관리자: Org(병원·보험사) 목록/승인, 모니터링 집계.
@RestController
@RequestMapping({"/admin", "/api/admin"})
public class PlatformAdminController {

    private final PlatformAdminService platformAdminService;

    public PlatformAdminController(PlatformAdminService platformAdminService) {
        this.platformAdminService = platformAdminService;
    }

    @GetMapping("/orgs")
    public ResponseEntity<List<PlatformDtos.OrgResponse>> listOrgs(ApiActor actor) {
        return ResponseEntity.ok(platformAdminService.listOrgs(actor));
    }

    @PostMapping("/orgs/{orgId}/approve")
    public ResponseEntity<PlatformDtos.OrgResponse> approveOrg(ApiActor actor, @PathVariable String orgId) {
        return ResponseEntity.ok(platformAdminService.approveOrg(actor, orgId));
    }

    @PostMapping("/orgs/{orgId}/deactivate")
    public ResponseEntity<PlatformDtos.OrgResponse> deactivateOrg(ApiActor actor, @PathVariable String orgId) {
        return ResponseEntity.ok(platformAdminService.deactivateOrg(actor, orgId));
    }

    @GetMapping("/monitor")
    public ResponseEntity<PlatformDtos.MonitorResponse> monitor(ApiActor actor) {
        return ResponseEntity.ok(platformAdminService.monitor(actor));
    }
}
