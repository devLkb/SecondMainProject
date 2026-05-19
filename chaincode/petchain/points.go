//보험사 포인트를 관리합니다.IssuePoints는 보험사에 포인트를 발행하고, DeductPoints는 검증 API 성공 시 포인트를 차감합니다.
//ReversePoints는 잘못된 거래를 7일 이내에 역거래로 되돌립니다. GetPointBalance, GetPointTransactions는 잔액과 거래내역 조회입니다.
package main

import (
	"fmt"
	"math"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) IssuePoints(ctx contractapi.TransactionContextInterface, insurerId, amount, issuedBy, issuedAt string) (string, error) {
	if err := requireNonEmpty(map[string]string{"insurerId": insurerId, "amount": amount, "issuedBy": issuedBy, "issuedAt": issuedAt}); err != nil {
		return "", err
	}
	if err := c.requireClaimOperatorForInsurer(ctx, insurerId); err != nil {
		return "", err
	}
	numericAmount, err := assertPositiveInteger(amount, "amount")
	if err != nil {
		return "", err
	}
	if err := assertIsoDate(issuedAt, "issuedAt"); err != nil {
		return "", err
	}
	tx, err := c.recordPointTx(ctx, doc{"insurerId": insurerId, "type": "POINT_ISSUE", "amount": numericAmount, "delta": numericAmount, "issuedBy": issuedBy, "occurredAt": issuedAt})
	if err != nil {
		return "", err
	}
	if err := c.emit(ctx, "PointsIssued", tx); err != nil {
		return "", err
	}
	return toJson(tx)
}

func (c *PetChainContract) DeductPoints(ctx contractapi.TransactionContextInterface, insurerId, verificationId, amount, deductedAt, idempotencyKey string) (string, error) {
	if err := requireNonEmpty(map[string]string{"insurerId": insurerId, "verificationId": verificationId, "amount": amount, "deductedAt": deductedAt}); err != nil {
		return "", err
	}
	if err := c.requireClaimOperatorForInsurer(ctx, insurerId); err != nil {
		return "", err
	}
	numericAmount, err := assertPositiveInteger(amount, "amount")
	if err != nil {
		return "", err
	}
	if err := assertIsoDate(deductedAt, "deductedAt"); err != nil {
		return "", err
	}
	existing, err := c.getFreshIdempotency(ctx, "point", insurerId, idempotencyKey, deductedAt)
	if err != nil {
		return "", err
	}
	if existing != nil {
		return toJson(existing["transaction"])
	}
	balance, err := c.balance(ctx, "pointTx", insurerId, "insurerId")
	if err != nil {
		return "", err
	}
	if balance < numericAmount {
		return "", fmt.Errorf("insufficient points for insurer %s", insurerId)
	}
	tx, err := c.recordPointTx(ctx, doc{"insurerId": insurerId, "verificationId": verificationId, "type": "POINT_DEDUCT", "amount": numericAmount, "delta": -numericAmount, "idempotencyKey": idempotencyKey, "occurredAt": deductedAt})
	if err != nil {
		return "", err
	}
	if err := c.saveIdempotency(ctx, "point", insurerId, idempotencyKey, deductedAt, tx); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "PointsDeducted", tx); err != nil {
		return "", err
	}
	return toJson(tx)
}

func (c *PetChainContract) ReversePoints(ctx contractapi.TransactionContextInterface, originalTransactionId, reason, reversedBy, reversedAt string) (string, error) {
	if err := requireNonEmpty(map[string]string{"originalTransactionId": originalTransactionId, "reason": reason, "reversedBy": reversedBy, "reversedAt": reversedAt}); err != nil {
		return "", err
	}
	if err := assertIsoDate(reversedAt, "reversedAt"); err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "pointTx", originalTransactionId)
	original, err := c.getRequired(ctx, key, "point transaction")
	if err != nil {
		return "", err
	}
	if err := c.requireClaimOperatorForInsurer(ctx, fmt.Sprint(original["insurerId"])); err != nil {
		return "", err
	}
	if original["type"] == "POINT_REVERSAL" {
		return "", fmt.Errorf("cannot reverse a reversal transaction")
	}
	if original["reversedByTransactionId"] != nil {
		return "", fmt.Errorf("point transaction %s is already reversed", originalTransactionId)
	}
	if mustTime(reversedAt).Sub(mustTime(fmt.Sprint(original["occurredAt"]))) > pointReversalWindow {
		return "", fmt.Errorf("point reversal is only allowed within 7 days")
	}
	tx, err := c.recordPointTx(ctx, doc{"insurerId": original["insurerId"], "verificationId": emptyString(original["verificationId"]), "type": "POINT_REVERSAL", "amount": int(math.Abs(float64(toInt(original["delta"])))), "delta": -toInt(original["delta"]), "originalTransactionId": originalTransactionId, "reason": reason, "reversedBy": reversedBy, "occurredAt": reversedAt})
	if err != nil {
		return "", err
	}
	original["reversedByTransactionId"] = tx["transactionId"]
	if err := c.put(ctx, key, original); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "PointsReversed", tx); err != nil {
		return "", err
	}
	return toJson(tx)
}

func (c *PetChainContract) GetPointBalance(ctx contractapi.TransactionContextInterface, insurerId string) (string, error) {
	if err := requireNonEmpty(map[string]string{"insurerId": insurerId}); err != nil {
		return "", err
	}
	balance, err := c.balance(ctx, "pointTx", insurerId, "insurerId")
	if err != nil {
		return "", err
	}
	return toJson(doc{"insurerId": insurerId, "balance": balance})
}

func (c *PetChainContract) GetPointTransactions(ctx contractapi.TransactionContextInterface, insurerId, filterJson string) (string, error) {
	if err := requireNonEmpty(map[string]string{"insurerId": insurerId}); err != nil {
		return "", err
	}
	filter, err := parseJsonObject(filterJson, "filter")
	if err != nil {
		return "", err
	}
	transactions, err := c.transactions(ctx, "pointTx", insurerId, "insurerId", filter)
	if err != nil {
		return "", err
	}
	return toJson(transactions)
}
