package com.blockchain.backend.petchainAPI.port;

import com.blockchain.backend.petchainAPI.dto.point.PointDtos;
import com.blockchain.backend.petchainAPI.security.ApiActor;

public interface PointApiPort {
    PointDtos.PointBalanceResponse getInsurerPointBalance(ApiActor actor, String insurerId);

    PointDtos.TransactionListResponse getInsurerPointTransactions(ApiActor actor,
                                                                  String insurerId,
                                                                  PointDtos.TransactionSearchRequest request);

    PointDtos.TransactionListResponse getPointTransactions(ApiActor actor, PointDtos.TransactionSearchRequest request);

    PointDtos.TransactionListResponse getCreditTransactions(ApiActor actor, PointDtos.TransactionSearchRequest request);

    PointDtos.SpendSaasCreditsResponse spendSaasCredits(ApiActor actor,
                                                        String hospitalId,
                                                        PointDtos.SpendSaasCreditsRequest request);
}
