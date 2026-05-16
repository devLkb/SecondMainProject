package main

import (
	"fmt"
	"math"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) AccrueCredit(ctx contractapi.TransactionContextInterface, hospitalId, verificationId, amount, accruedAt, idempotencyKey string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"hospitalId": hospitalId, "verificationId": verificationId, "amount": amount, "accruedAt": accruedAt}); err != nil {
		return "", err
	}
	numericAmount, err := assertPositiveInteger(amount, "amount")
	if err != nil {
		return "", err
	}
	if err := assertIsoDate(accruedAt, "accruedAt"); err != nil {
		return "", err
	}
	existing, err := c.getFreshIdempotency(ctx, "credit", hospitalId, idempotencyKey, accruedAt)
	if err != nil {
		return "", err
	}
	if existing != nil {
		return toJson(existing["transaction"])
	}
	tx, err := c.recordCreditTx(ctx, doc{"hospitalId": hospitalId, "verificationId": verificationId, "type": "CREDIT_ACCRUED", "amount": numericAmount, "delta": numericAmount, "idempotencyKey": idempotencyKey, "occurredAt": accruedAt, "expiresAt": mustTime(accruedAt).Add(creditExpiryWindow).UTC().Format(time.RFC3339Nano)})
	if err != nil {
		return "", err
	}
	if err := c.saveIdempotency(ctx, "credit", hospitalId, idempotencyKey, accruedAt, tx); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "CreditAccrued", tx); err != nil {
		return "", err
	}
	return toJson(tx)
}

func (c *PetChainContract) SpendCreditSaaS(ctx contractapi.TransactionContextInterface, hospitalId, featureId, amount, spentAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP, hospitalMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"hospitalId": hospitalId, "featureId": featureId, "amount": amount, "spentAt": spentAt}); err != nil {
		return "", err
	}
	numericAmount, err := assertPositiveInteger(amount, "amount")
	if err != nil {
		return "", err
	}
	if numericAmount != 10 {
		return "", fmt.Errorf("SaaS feature spend amount must be 10 credits")
	}
	if err := assertIsoDate(spentAt, "spentAt"); err != nil {
		return "", err
	}
	return c.spendCredit(ctx, hospitalId, numericAmount, spentAt, doc{"type": "CREDIT_SPENT_SAAS", "featureId": featureId})
}

func (c *PetChainContract) SpendCreditBanner(ctx contractapi.TransactionContextInterface, hospitalId, bannerType, amount, spentAt, approvalId string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"hospitalId": hospitalId, "bannerType": bannerType, "amount": amount, "spentAt": spentAt, "approvalId": approvalId}); err != nil {
		return "", err
	}
	expected := bannerAmounts[bannerType]
	if expected == 0 {
		return "", fmt.Errorf("bannerType must be BASIC or MAIN")
	}
	numericAmount, err := assertPositiveInteger(amount, "amount")
	if err != nil {
		return "", err
	}
	if numericAmount != expected {
		return "", fmt.Errorf("%s banner spend amount must be %d credits", bannerType, expected)
	}
	if err := assertIsoDate(spentAt, "spentAt"); err != nil {
		return "", err
	}
	return c.spendCredit(ctx, hospitalId, numericAmount, spentAt, doc{"type": "CREDIT_SPENT_BANNER", "bannerType": bannerType, "approvalId": approvalId})
}

func (c *PetChainContract) BurnExpiredCredit(ctx contractapi.TransactionContextInterface, transactionId, expiredAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"transactionId": transactionId, "expiredAt": expiredAt}); err != nil {
		return "", err
	}
	if err := assertIsoDate(expiredAt, "expiredAt"); err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "creditTx", transactionId)
	original, err := c.getRequired(ctx, key, "credit transaction")
	if err != nil {
		return "", err
	}
	if original["type"] != "CREDIT_ACCRUED" {
		return "", fmt.Errorf("only accrued credit transactions can expire")
	}
	if original["burnedByTransactionId"] != nil {
		return "", fmt.Errorf("credit transaction %s is already burned", transactionId)
	}
	if mustTime(expiredAt).Before(mustTime(fmt.Sprint(original["expiresAt"]))) {
		return "", fmt.Errorf("credit has not reached its 12 month expiry")
	}
	remaining, err := c.remainingCreditFromAccrual(ctx, original)
	if err != nil {
		return "", err
	}
	if remaining <= 0 {
		return "", fmt.Errorf("no remaining credit to burn")
	}
	tx, err := c.recordCreditTx(ctx, doc{"hospitalId": original["hospitalId"], "type": "CREDIT_EXPIRED", "amount": remaining, "delta": -remaining, "originalTransactionId": transactionId, "occurredAt": expiredAt})
	if err != nil {
		return "", err
	}
	original["burnedByTransactionId"] = tx["transactionId"]
	if err := c.put(ctx, key, original); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "CreditBurned", tx); err != nil {
		return "", err
	}
	return toJson(tx)
}

func (c *PetChainContract) ReverseCredit(ctx contractapi.TransactionContextInterface, originalTransactionId, reason, reversedBy, reversedAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"originalTransactionId": originalTransactionId, "reason": reason, "reversedBy": reversedBy, "reversedAt": reversedAt}); err != nil {
		return "", err
	}
	if err := assertIsoDate(reversedAt, "reversedAt"); err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "creditTx", originalTransactionId)
	original, err := c.getRequired(ctx, key, "credit transaction")
	if err != nil {
		return "", err
	}
	if original["type"] == "CREDIT_REVERSAL" {
		return "", fmt.Errorf("cannot reverse a reversal transaction")
	}
	if original["reversedByTransactionId"] != nil {
		return "", fmt.Errorf("credit transaction %s is already reversed", originalTransactionId)
	}
	tx, err := c.recordCreditTx(ctx, doc{"hospitalId": original["hospitalId"], "verificationId": emptyString(original["verificationId"]), "type": "CREDIT_REVERSAL", "amount": int(math.Abs(float64(toInt(original["delta"])))), "delta": -toInt(original["delta"]), "originalTransactionId": originalTransactionId, "reason": reason, "reversedBy": reversedBy, "occurredAt": reversedAt})
	if err != nil {
		return "", err
	}
	original["reversedByTransactionId"] = tx["transactionId"]
	if err := c.put(ctx, key, original); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "CreditReversed", tx); err != nil {
		return "", err
	}
	return toJson(tx)
}

func (c *PetChainContract) GetCreditBalance(ctx contractapi.TransactionContextInterface, hospitalId string) (string, error) {
	if err := requireNonEmpty(map[string]string{"hospitalId": hospitalId}); err != nil {
		return "", err
	}
	balance, err := c.balance(ctx, "creditTx", hospitalId, "hospitalId")
	if err != nil {
		return "", err
	}
	return toJson(doc{"hospitalId": hospitalId, "balance": balance})
}

func (c *PetChainContract) GetCreditTransactions(ctx contractapi.TransactionContextInterface, hospitalId, filterJson string) (string, error) {
	if err := requireNonEmpty(map[string]string{"hospitalId": hospitalId}); err != nil {
		return "", err
	}
	filter, err := parseJsonObject(filterJson, "filter")
	if err != nil {
		return "", err
	}
	transactions, err := c.transactions(ctx, "creditTx", hospitalId, "hospitalId", filter)
	if err != nil {
		return "", err
	}
	return toJson(transactions)
}
