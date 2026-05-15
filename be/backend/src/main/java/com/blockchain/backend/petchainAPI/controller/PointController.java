package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchainAPI.dto.point.PointDtos;
import com.blockchain.backend.petchainAPI.port.PointApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
public class PointController {
    private final PointApiPort pointApiPort;

    public PointController(PointApiPort pointApiPort) {
        this.pointApiPort = pointApiPort;
    }

    @GetMapping("/insurers/{insurerId}/points/balance")
    public ApiResponse<PointDtos.PointBalanceResponse> getInsurerPointBalance(
            ApiActor actor,
            @PathVariable String insurerId,
            HttpServletRequest request) {
        return ApiResponse.of(pointApiPort.getInsurerPointBalance(actor, insurerId), request);
    }

    @GetMapping("/insurers/{insurerId}/points/transactions")
    public ApiResponse<PointDtos.TransactionListResponse> getInsurerPointTransactions(
            ApiActor actor,
            @PathVariable String insurerId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size,
            HttpServletRequest request) {
        PointDtos.TransactionSearchRequest search = new PointDtos.TransactionSearchRequest(insurerId, null, type, from, to, page, size);
        return ApiResponse.of(pointApiPort.getInsurerPointTransactions(actor, insurerId, search), request);
    }

    @GetMapping("/points/transactions")
    public ApiResponse<PointDtos.TransactionListResponse> getPointTransactions(
            ApiActor actor,
            @RequestParam(required = false) String insurerId,
            @RequestParam(required = false) String hospitalId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size,
            HttpServletRequest request) {
        PointDtos.TransactionSearchRequest search = new PointDtos.TransactionSearchRequest(insurerId, hospitalId, type, from, to, page, size);
        return ApiResponse.of(pointApiPort.getPointTransactions(actor, search), request);
    }

    @GetMapping("/credits/transactions")
    public ApiResponse<PointDtos.TransactionListResponse> getCreditTransactions(
            ApiActor actor,
            @RequestParam(required = false) String insurerId,
            @RequestParam(required = false) String hospitalId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size,
            HttpServletRequest request) {
        PointDtos.TransactionSearchRequest search = new PointDtos.TransactionSearchRequest(insurerId, hospitalId, type, from, to, page, size);
        return ApiResponse.of(pointApiPort.getCreditTransactions(actor, search), request);
    }

    @PostMapping("/hospitals/{hospitalId}/credits/spend/saas")
    public ApiResponse<PointDtos.SpendSaasCreditsResponse> spendSaasCredits(
            ApiActor actor,
            @PathVariable String hospitalId,
            @Valid @RequestBody PointDtos.SpendSaasCreditsRequest spendSaasCreditsRequest,
            HttpServletRequest request) {
        return ApiResponse.of(pointApiPort.spendSaasCredits(actor, hospitalId, spendSaasCreditsRequest), request);
    }
}
