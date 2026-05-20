//검증 성공 시 필요한 여러 작업을 하나의 트랜잭션으로 묶습니다.
// ProcessSuccessfulVerification은 검증 성공 기록, 보험사 포인트 1점 차감, 병원 크레딧 1점 적립을 한 번에 처리합니다.
// idempotencyKey를 사용해서 같은 요청이 5분 안에 재시도되어도 중복 과금되지 않게 합니다.
package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) ProcessSuccessfulVerification(ctx contractapi.TransactionContextInterface, verificationId, submissionId, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, idempotencyKey string) (string, error) {
	return c.processSuccessfulVerification(ctx, verificationId, submissionId, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, idempotencyKey, "", "")
}

func (c *PetChainContract) ProcessSuccessfulVerificationWithPolicy(ctx contractapi.TransactionContextInterface, verificationId, submissionId, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, idempotencyKey, policyVersion, policyHash string) (string, error) {
	if err := assertPolicySnapshot(policyVersion, policyHash); err != nil {
		return "", err
	}
	return c.processSuccessfulVerification(ctx, verificationId, submissionId, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, idempotencyKey, policyVersion, policyHash)
}

func (c *PetChainContract) processSuccessfulVerification(ctx contractapi.TransactionContextInterface, verificationId, submissionId, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, idempotencyKey, policyVersion, policyHash string) (string, error) {
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
	if err := c.requireClaimOperatorForInsurer(ctx, fmt.Sprint(submission["insurerId"])); err != nil {
		return "", err
	}
	verificationJson, err := c.recordVerification(ctx, verificationId, submissionId, "PASSED", "[]", recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, policyVersion, policyHash)
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
