package com.blockchain.backend.petchain.petchainAPI.service;

import com.blockchain.backend.petchain.petchainAPI.dto.point.PointDtos;
import com.blockchain.backend.petchain.petchainAPI.port.PointApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import org.springframework.stereotype.Service;

@Service
public class PointService implements PointApiPort {

    @Override
    public PointDtos.PointBalanceResponse getInsurerPointBalance(ApiActor actor, String insurerId) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public PointDtos.TransactionListResponse getInsurerPointTransactions(ApiActor actor, String insurerId, PointDtos.TransactionSearchRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public PointDtos.TransactionListResponse getPointTransactions(ApiActor actor, PointDtos.TransactionSearchRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public PointDtos.TransactionListResponse getCreditTransactions(ApiActor actor, PointDtos.TransactionSearchRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public PointDtos.SpendSaasCreditsResponse spendSaasCredits(ApiActor actor, String hospitalId, PointDtos.SpendSaasCreditsRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
