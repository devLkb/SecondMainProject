// 포인트/크레딧 거래 처리에 공통으로 쓰이는 내부 도우미 함수들입니다.
// 거래 기록 생성, 잔액 계산, 거래 목록 필터링, 크레딧 사용, 중복 요청 방지용 idempotency 저장/조회 등을 담당합니다.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"sort"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) spendCredit(ctx contractapi.TransactionContextInterface, hospitalId string, amount int, spentAt string, details doc) (string, error) {
	balance, err := c.balance(ctx, "creditTx", hospitalId, "hospitalId")
	if err != nil {
		return "", err
	}
	if balance < amount {
		return "", fmt.Errorf("insufficient credits for hospital %s", hospitalId)
	}
	data := doc{"hospitalId": hospitalId, "amount": amount, "delta": -amount, "occurredAt": spentAt}
	for k, v := range details {
		data[k] = v
	}
	tx, err := c.recordCreditTx(ctx, data)
	if err != nil {
		return "", err
	}
	if err := c.emit(ctx, "CreditSpent", tx); err != nil {
		return "", err
	}
	return toJson(tx)
}

func (c *PetChainContract) recordPointTx(ctx contractapi.TransactionContextInterface, data doc) (doc, error) {
	transactionId := emptyString(data["transactionId"])
	if transactionId == "" {
		transactionId = ctx.GetStub().GetTxID()
	}
	tx := doc{"docType": "pointTx", "transactionId": transactionId, "createdTxId": ctx.GetStub().GetTxID()}
	for k, v := range data {
		tx[k] = v
	}
	key, _ := c.key(ctx, "pointTx", transactionId)
	return tx, c.put(ctx, key, tx)
}

func (c *PetChainContract) recordCreditTx(ctx contractapi.TransactionContextInterface, data doc) (doc, error) {
	transactionId := emptyString(data["transactionId"])
	if transactionId == "" {
		transactionId = ctx.GetStub().GetTxID()
	}
	tx := doc{"docType": "creditTx", "transactionId": transactionId, "createdTxId": ctx.GetStub().GetTxID()}
	for k, v := range data {
		tx[k] = v
	}
	key, _ := c.key(ctx, "creditTx", transactionId)
	return tx, c.put(ctx, key, tx)
}

func (c *PetChainContract) balance(ctx contractapi.TransactionContextInterface, docType, ownerId, ownerField string) (int, error) {
	transactions, err := c.transactions(ctx, docType, ownerId, ownerField, doc{})
	if err != nil {
		return 0, err
	}
	sum := 0
	for _, tx := range transactions {
		sum += toInt(tx["delta"])
	}
	return sum, nil
}

func (c *PetChainContract) transactions(ctx contractapi.TransactionContextInterface, docType, ownerId, ownerField string, filter doc) ([]doc, error) {
	iterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer iterator.Close()
	result := []doc{}
	for iterator.HasNext() {
		kv, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		var item doc
		if err := json.Unmarshal(kv.Value, &item); err != nil {
			return nil, err
		}
		if item["docType"] == docType && item[ownerField] == ownerId && matchesFilter(item, filter) {
			result = append(result, item)
		}
	}
	sort.Slice(result, func(i, j int) bool { return fmt.Sprint(result[i]["occurredAt"]) < fmt.Sprint(result[j]["occurredAt"]) })
	return result, nil
}

func matchesFilter(item, filter doc) bool {
	if filter["type"] != nil && item["type"] != filter["type"] {
		return false
	}
	if filter["from"] != nil && mustTime(fmt.Sprint(item["occurredAt"])).Before(mustTime(fmt.Sprint(filter["from"]))) {
		return false
	}
	if filter["to"] != nil && mustTime(fmt.Sprint(item["occurredAt"])).After(mustTime(fmt.Sprint(filter["to"]))) {
		return false
	}
	return true
}

func (c *PetChainContract) remainingCreditFromAccrual(ctx contractapi.TransactionContextInterface, accrual doc) (int, error) {
	if accrual["reversedByTransactionId"] != nil {
		return 0, nil
	}
	transactions, err := c.transactions(ctx, "creditTx", fmt.Sprint(accrual["hospitalId"]), "hospitalId", doc{})
	if err != nil {
		return 0, err
	}
	linkedNegative := 0
	for _, tx := range transactions {
		if tx["originalTransactionId"] == accrual["transactionId"] && toInt(tx["delta"]) < 0 {
			linkedNegative += int(math.Abs(float64(toInt(tx["delta"]))))
		}
	}
	remaining := toInt(accrual["delta"]) - linkedNegative
	if remaining < 0 {
		return 0, nil
	}
	return remaining, nil
}

func (c *PetChainContract) getFreshIdempotency(ctx contractapi.TransactionContextInterface, scope, ownerId, idempotencyKey, occurredAt string) (doc, error) {
	if idempotencyKey == "" {
		return nil, nil
	}
	key, _ := c.key(ctx, "idempotency", scope, ownerId, idempotencyKey)
	existing, err := c.get(ctx, key)
	if err != nil || existing == nil {
		return existing, err
	}
	if mustTime(occurredAt).Sub(mustTime(fmt.Sprint(existing["occurredAt"]))) <= idempotencyWindow {
		return existing, nil
	}
	return nil, nil
}

func (c *PetChainContract) saveIdempotency(ctx contractapi.TransactionContextInterface, scope, ownerId, idempotencyKey, occurredAt string, transaction interface{}) error {
	if idempotencyKey == "" {
		return nil
	}
	key, _ := c.key(ctx, "idempotency", scope, ownerId, idempotencyKey)
	return c.put(ctx, key, doc{"docType": "idempotency", "scope": scope, "ownerId": ownerId, "idempotencyKey": idempotencyKey, "occurredAt": occurredAt, "transaction": transaction})
}
