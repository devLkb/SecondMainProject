package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.admin.AdminDtos;
import com.blockchain.backend.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchainAPI.port.AdminApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AdminController {
    private final AdminApiPort adminApiPort;

    public AdminController(AdminApiPort adminApiPort) {
        this.adminApiPort = adminApiPort;
    }

    @PostMapping("/admin/insurers/{insurerId}/points/issue")
    public ApiResponse<AdminDtos.IssuePointsResponse> issueInsurerPoints(
            ApiActor actor,
            @PathVariable String insurerId,
            @Valid @RequestBody AdminDtos.IssuePointsRequest issuePointsRequest,
            HttpServletRequest request) {
        return ApiResponse.of(adminApiPort.issueInsurerPoints(actor, insurerId, issuePointsRequest), request);
    }

    @PostMapping("/admin/points/{transactionId}/reversal")
    public ApiResponse<AdminDtos.ReversePointTransactionResponse> reversePointTransaction(
            ApiActor actor,
            @PathVariable String transactionId,
            @Valid @RequestBody AdminDtos.ReversePointTransactionRequest reversePointTransactionRequest,
            HttpServletRequest request) {
        return ApiResponse.of(adminApiPort.reversePointTransaction(actor, transactionId, reversePointTransactionRequest), request);
    }
}
