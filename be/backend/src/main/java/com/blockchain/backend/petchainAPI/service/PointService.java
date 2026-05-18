package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.common.DomainValues;
import com.blockchain.backend.petchainAPI.dto.point.PointDtos;
import com.blockchain.backend.petchainAPI.error.ApiErrorCode;
import com.blockchain.backend.petchainAPI.error.ApiException;
import com.blockchain.backend.petchainAPI.port.PointApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.Hospital;
import com.blockchain.backend.petchainDB.entity.InsuranceCompany;
import com.blockchain.backend.petchainDB.entity.PointBalance;
import com.blockchain.backend.petchainDB.entity.PointTransaction;
import com.blockchain.backend.petchainDB.repository.PointBalanceRepository;
import com.blockchain.backend.petchainDB.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PointService implements PointApiPort {
    private static final int SAAS_CREDIT_COST = 1;

    private final ApiDomainSupport support;
    private final PointBalanceRepository pointBalanceRepository;
    private final PointTransactionRepository pointTransactionRepository;

    @Override
    @Transactional
    public PointDtos.PointBalanceResponse getInsurerPointBalance(ApiActor actor, String insurerId) {
        InsuranceCompany insurer = support.insurerByExternalId(insurerId);
        support.requireInsurerScope(actor, insurer);
        PointBalance balance = balance(DomainValues.PointOwnerType.INSURANCE, insurer.getId());
        return new PointDtos.PointBalanceResponse(String.valueOf(insurer.getId()), balance.getBalance(), support.toInstant(balance.getUpdatedAt()));
    }

    @Override
    @Transactional(readOnly = true)
    public PointDtos.TransactionListResponse getInsurerPointTransactions(ApiActor actor, String insurerId, PointDtos.TransactionSearchRequest request) {
        InsuranceCompany insurer = support.insurerByExternalId(insurerId);
        support.requireInsurerScope(actor, insurer);
        return transactionList(pointTransactionRepository.findAll().stream()
                .filter(tx -> matchesOwner(tx, DomainValues.PointOwnerType.INSURANCE, insurer.getId()))
                .toList(), request.page(), request.size());
    }

    @Override
    @Transactional(readOnly = true)
    public PointDtos.TransactionListResponse getPointTransactions(ApiActor actor, PointDtos.TransactionSearchRequest request) {
        return transactionList(filteredTransactions(request), request.page(), request.size());
    }

    @Override
    @Transactional(readOnly = true)
    public PointDtos.TransactionListResponse getCreditTransactions(ApiActor actor, PointDtos.TransactionSearchRequest request) {
        return transactionList(filteredTransactions(request).stream()
                .filter(tx -> DomainValues.PointOwnerType.HOSPITAL.equals(tx.getFromOwnerType()) || DomainValues.PointOwnerType.HOSPITAL.equals(tx.getToOwnerType()))
                .toList(), request.page(), request.size());
    }

    @Override
    @Transactional
    public PointDtos.SpendSaasCreditsResponse spendSaasCredits(ApiActor actor, String hospitalId, PointDtos.SpendSaasCreditsRequest request) {
        Hospital hospital = support.hospitalByExternalId(hospitalId);
        support.requireHospitalScope(actor, hospital);
        PointBalance balance = balance(DomainValues.PointOwnerType.HOSPITAL, hospital.getId());
        if (balance.getBalance() < SAAS_CREDIT_COST) {
            throw new ApiException(ApiErrorCode.INSUFFICIENT_POINTS, "Hospital credit balance is insufficient");
        }
        balance.setBalance(balance.getBalance() - SAAS_CREDIT_COST);
        PointTransaction tx = new PointTransaction();
        tx.setTxType("spend");
        tx.setFromOwnerType(DomainValues.PointOwnerType.HOSPITAL);
        tx.setFromOwnerId(hospital.getId());
        tx.setAmount(SAAS_CREDIT_COST);
        tx.setDescription("SaaS feature: " + request.featureCode());
        PointTransaction saved = pointTransactionRepository.save(tx);
        Instant now = Instant.now();
        return new PointDtos.SpendSaasCreditsResponse(
                "ENT-" + saved.getId(),
                String.valueOf(hospital.getId()),
                request.featureCode(),
                SAAS_CREDIT_COST,
                now,
                now.plusSeconds(30L * 24 * 60 * 60),
                String.valueOf(saved.getId())
        );
    }

    private List<PointTransaction> filteredTransactions(PointDtos.TransactionSearchRequest request) {
        return pointTransactionRepository.findAll().stream()
                .filter(tx -> request.type() == null || request.type().isBlank() || request.type().equalsIgnoreCase(tx.getTxType()))
                .filter(tx -> request.insurerId() == null || support.parseNumericId(request.insurerId()).map(id -> matchesOwner(tx, DomainValues.PointOwnerType.INSURANCE, id)).orElse(false))
                .filter(tx -> request.hospitalId() == null || support.parseNumericId(request.hospitalId()).map(id -> matchesOwner(tx, DomainValues.PointOwnerType.HOSPITAL, id)).orElse(false))
                .toList();
    }

    private PointDtos.TransactionListResponse transactionList(List<PointTransaction> source, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        List<PointTransaction> sorted = source.stream()
                .sorted(Comparator.comparing(PointTransaction::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
        int from = Math.min(safePage * safeSize, sorted.size());
        int to = Math.min(from + safeSize, sorted.size());
        return new PointDtos.TransactionListResponse(
                sorted.subList(from, to).stream().map(support::transactionSummary).toList(),
                safePage,
                safeSize,
                sorted.size()
        );
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

    private static boolean matchesOwner(PointTransaction tx, String ownerType, Long ownerId) {
        return (Objects.equals(tx.getFromOwnerType(), ownerType) && Objects.equals(tx.getFromOwnerId(), ownerId))
                || (Objects.equals(tx.getToOwnerType(), ownerType) && Objects.equals(tx.getToOwnerId(), ownerId));
    }
}
