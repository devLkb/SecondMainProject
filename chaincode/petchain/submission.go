package main

import (
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) CreateSubmission(ctx contractapi.TransactionContextInterface, submissionId, recordId, hospitalId, insurerId, createdAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP, hospitalMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"submissionId": submissionId, "recordId": recordId, "hospitalId": hospitalId, "insurerId": insurerId, "createdAt": createdAt}); err != nil {
		return "", err
	}
	if err := assertIsoDate(createdAt, "createdAt"); err != nil {
		return "", err
	}
	record, err := c.getRequiredByParts(ctx, "record", "record", recordId)
	if err != nil {
		return "", err
	}
	if record["hospitalId"] != hospitalId {
		return "", fmt.Errorf("record %s does not belong to hospital %s", recordId, hospitalId)
	}
	key, _ := c.key(ctx, "submission", submissionId)
	if err := c.assertMissing(ctx, key, "submission"); err != nil {
		return "", err
	}
	submission := doc{"docType": "submission", "submissionId": submissionId, "recordId": recordId, "hospitalId": hospitalId, "insurerId": insurerId, "status": "PENDING", "createdAt": createdAt, "updatedAt": createdAt}
	if err := c.put(ctx, key, submission); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "SubmissionCreated", doc{"submissionId": submissionId, "recordId": recordId, "hospitalId": hospitalId, "insurerId": insurerId, "createdAt": createdAt}); err != nil {
		return "", err
	}
	return toJson(submission)
}

func (c *PetChainContract) RecordVerification(ctx contractapi.TransactionContextInterface, verificationId, submissionId, status, failureReasonsJson, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"verificationId": verificationId, "submissionId": submissionId, "status": status, "recordHashAtVerify": recordHashAtVerify, "consentSnapshotHash": consentSnapshotHash, "verifiedAt": verifiedAt, "auditLogId": auditLogId}); err != nil {
		return "", err
	}
	if !verificationStatuses[status] {
		return "", fmt.Errorf("invalid verification status %s", status)
	}
	if err := assertHash(recordHashAtVerify, "recordHashAtVerify"); err != nil {
		return "", err
	}
	if err := assertHash(consentSnapshotHash, "consentSnapshotHash"); err != nil {
		return "", err
	}
	if err := assertIsoDate(verifiedAt, "verifiedAt"); err != nil {
		return "", err
	}
	failureReasons, err := parseJsonArray(failureReasonsJson, "failureReasons")
	if err != nil {
		return "", err
	}
	submission, err := c.getRequiredByParts(ctx, "submission", "submission", submissionId)
	if err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "verification", verificationId)
	if err := c.assertMissing(ctx, key, "verification"); err != nil {
		return "", err
	}
	verification := doc{"docType": "verification", "verificationId": verificationId, "submissionId": submissionId, "recordId": submission["recordId"], "hospitalId": submission["hospitalId"], "insurerId": submission["insurerId"], "status": status, "failureReasons": failureReasons, "recordHashAtVerify": recordHashAtVerify, "consentSnapshotHash": consentSnapshotHash, "verifiedAt": verifiedAt, "auditLogId": auditLogId}
	if err := c.put(ctx, key, verification); err != nil {
		return "", err
	}
	submissionStatus := "FAILED"
	if status == "PASSED" {
		submissionStatus = "PASSED"
	} else if status == "BLOCKED" {
		submissionStatus = "BLOCKED"
	}
	if _, err := c.MarkSubmissionStatus(ctx, submissionId, submissionStatus); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "VerificationRecorded", doc{"verificationId": verificationId, "submissionId": submissionId, "status": status, "failureReasons": failureReasons, "verifiedAt": verifiedAt, "auditLogId": auditLogId}); err != nil {
		return "", err
	}
	return toJson(verification)
}

func (c *PetChainContract) MarkSubmissionStatus(ctx contractapi.TransactionContextInterface, submissionId, status string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"submissionId": submissionId, "status": status}); err != nil {
		return "", err
	}
	if !submissionStatuses[status] {
		return "", fmt.Errorf("invalid submission status %s", status)
	}
	key, _ := c.key(ctx, "submission", submissionId)
	submission, err := c.getRequired(ctx, key, "submission")
	if err != nil {
		return "", err
	}
	previousStatus := submission["status"]
	submission["status"], submission["updatedAt"] = status, c.txTime(ctx)
	if err := c.put(ctx, key, submission); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "SubmissionStatusChanged", doc{"submissionId": submissionId, "previousStatus": previousStatus, "status": status, "updatedAt": submission["updatedAt"]}); err != nil {
		return "", err
	}
	return toJson(submission)
}

func (c *PetChainContract) GetVerificationResult(ctx contractapi.TransactionContextInterface, verificationId string) (string, error) {
	if err := requireNonEmpty(map[string]string{"verificationId": verificationId}); err != nil {
		return "", err
	}
	verification, err := c.getRequiredByParts(ctx, "verification", "verification", verificationId)
	if err != nil {
		return "", err
	}
	return toJson(verification)
}
