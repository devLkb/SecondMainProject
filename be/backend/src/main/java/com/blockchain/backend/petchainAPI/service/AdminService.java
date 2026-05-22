package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.chain.PetChainLedger;
import com.blockchain.backend.common.DomainValues;
import com.blockchain.backend.petchainAPI.dto.admin.AdminDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.AdminApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.PointBalance;
import com.blockchain.backend.petchainDB.entity.PointTransaction;
import com.blockchain.backend.petchainDB.repository.PointBalanceRepository;
import com.blockchain.backend.petchainDB.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AdminService implements AdminApiPort {
    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final ApiDomainSupport support;
    private final PointBalanceRepository pointBalanceRepository;
    private final PointTransactionRepository pointTransactionRepository;
    private final PetChainLedger chainLedger;

    @Override
    @Transactional
    public AdminDtos.IssuePointsResponse issueInsurerPoints(ApiActor actor, String insurerId, AdminDtos.IssuePointsRequest request) {
        support.requireAdmin(actor);
        InsuranceCompany insurer = support.insurerByExternalId(insurerId);
        PointBalance balance = balance(DomainValues.PointOwnerType.INSURANCE, insurer.getId());
        balance.setBalance(balance.getBalance() + request.amount());
        PointTransaction tx = new PointTransaction();
        tx.setTxType("issue");
        tx.setToOwnerType(DomainValues.PointOwnerType.INSURANCE);
        tx.setToOwnerId(insurer.getId());
        tx.setAmount(request.amount());
        tx.setDescription(request.reason());
        PointTransaction saved = pointTransactionRepository.save(tx);

        if (chainLedger.isEnabled()) {
            try {
                String txId = chainLedger.issuePoints(
                        insurer.getMemberNumber(),
                        String.valueOf(request.amount()),
                        "admin",
                        Instant.now().toString());
                saved.setFabricTxId(txId.isEmpty() ? null : txId);
            } catch (Exception e) {
                log.warn("IssuePoints 온체인 반영 실패 (insurerId={}, amount={}): {}",
                        insurer.getMemberNumber(), request.amount(), e.getMessage());
            }
        }

        return new AdminDtos.IssuePointsResponse(String.valueOf(insurer.getId()), String.valueOf(saved.getId()), request.amount(), balance.getBalance(), String.valueOf(saved.getId()), Instant.now());
    }

    @Override
    @Transactional
    public AdminDtos.ReversePointTransactionResponse reversePointTransaction(ApiActor actor, String transactionId, AdminDtos.ReversePointTransactionRequest request) {
        support.requireAdmin(actor);
        Long id = support.parseNumericId(transactionId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "거래를 찾을 수 없습니다."));
        PointTransaction original = pointTransactionRepository.findById(id)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND, "거래를 찾을 수 없습니다."));
        // 중복 reversal 방지: reversal 거래 자체는 되돌릴 수 없고, 이미 되돌린 거래도 다시 되돌릴 수 없다.
        if ("reversal".equalsIgnoreCase(original.getTxType())) {
            throw new ApiException(ApiErrorCode.CONFLICT, "취소(reversal) 거래는 다시 되돌릴 수 없습니다.");
        }
        if (pointTransactionRepository.existsByReversedTransactionId(original.getId())) {
            throw new ApiException(ApiErrorCode.CONFLICT, "이미 취소된 거래입니다.");
        }
        if (original.getToOwnerType() != null && original.getToOwnerId() != null) {
            PointBalance to = balance(original.getToOwnerType(), original.getToOwnerId());
            to.setBalance(Math.max(0, to.getBalance() - original.getAmount()));
        }
        if (original.getFromOwnerType() != null && original.getFromOwnerId() != null) {
            PointBalance from = balance(original.getFromOwnerType(), original.getFromOwnerId());
            from.setBalance(from.getBalance() + original.getAmount());
        }
        PointTransaction reversal = new PointTransaction();
        reversal.setTxType("reversal");
        reversal.setFromOwnerType(original.getToOwnerType());
        reversal.setFromOwnerId(original.getToOwnerId());
        reversal.setToOwnerType(original.getFromOwnerType());
        reversal.setToOwnerId(original.getFromOwnerId());
        reversal.setAmount(original.getAmount());
        reversal.setDescription(request.reason());
        reversal.setRelatedClaim(original.getRelatedClaim());
        reversal.setReversedTransactionId(original.getId());
        PointTransaction saved = pointTransactionRepository.save(reversal);
        return new AdminDtos.ReversePointTransactionResponse(String.valueOf(original.getId()), String.valueOf(saved.getId()), original.getAmount(), String.valueOf(saved.getId()), Instant.now());
    }

    private PointBalance balance(String ownerType, Long ownerId) {
        return pointBalanceRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId)
                .orElseGet(() -> {
                    PointBalance balance = new PointBalance();
                    balance.setOwnerType(ownerType);
                    balance.setOwnerId(ownerId);
                    balance.setBalance(0);
                    return pointBalanceRepository.save(balance);
                });
    }
}
