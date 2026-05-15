package com.blockchain.backend.petchain.petchainAPI.port;

import com.blockchain.backend.petchain.petchainAPI.dto.admin.AdminDtos;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;

public interface AdminApiPort {
    AdminDtos.IssuePointsResponse issueInsurerPoints(ApiActor actor,
                                                     String insurerId,
                                                     AdminDtos.IssuePointsRequest request);

    AdminDtos.ReversePointTransactionResponse reversePointTransaction(ApiActor actor,
                                                                      String transactionId,
                                                                      AdminDtos.ReversePointTransactionRequest request);
}
