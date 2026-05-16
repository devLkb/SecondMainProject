package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) ProcessSuccessfulVerification(ctx contractapi.TransactionContextInterface, verificationId, submissionId, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, idempotencyKey string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	existing, err := c.getFreshIdempotency(ctx, "verification", submissionId, idempotencyKey, verifiedAt)
	if err != nil {
		return "", err
	}
	if existing != nil {
		return toJson(existing["transaction"])
	}
	submission, err := c.getRequiredByParts(ctx, "submission", "submission", submissionId)
	if err != nil {
		return "", err
	}
	verificationJson, err := c.RecordVerification(ctx, verificationId, submissionId, "PASSED", "[]", recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId)
	if err != nil {
		return "", err
	}
	pointJson, err := c.DeductPoints(ctx, fmt.Sprint(submission["insurerId"]), verificationId, "1", verifiedAt, idempotencyKey)
	if err != nil {
		return "", err
	}
	creditJson, err := c.AccrueCredit(ctx, fmt.Sprint(submission["hospitalId"]), verificationId, "1", verifiedAt, idempotencyKey)
	if err != nil {
		return "", err
	}
	var verification, pointTx, creditTx doc
	_ = json.Unmarshal([]byte(verificationJson), &verification)
	_ = json.Unmarshal([]byte(pointJson), &pointTx)
	_ = json.Unmarshal([]byte(creditJson), &creditTx)
	result := doc{"verification": verification, "pointTx": pointTx, "creditTx": creditTx}
	if err := c.saveIdempotency(ctx, "verification", submissionId, idempotencyKey, verifiedAt, result); err != nil {
		return "", err
	}
	return toJson(result)
}
