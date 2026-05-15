package com.blockchain.backend.petchain.petchainAPI.service;

import com.blockchain.backend.petchain.petchainAPI.dto.admin.AdminDtos;
import com.blockchain.backend.petchain.petchainAPI.port.AdminApiPort;
import com.blockchain.backend.petchain.petchainAPI.security.ApiActor;
import org.springframework.stereotype.Service;

@Service
public class AdminService implements AdminApiPort {

    @Override
    public AdminDtos.IssuePointsResponse issueInsurerPoints(ApiActor actor, String insurerId, AdminDtos.IssuePointsRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @Override
    public AdminDtos.ReversePointTransactionResponse reversePointTransaction(ApiActor actor, String transactionId, AdminDtos.ReversePointTransactionRequest request) {
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
