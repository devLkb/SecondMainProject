// 보험사 제출 요청과 검증 결과를 관리합니다.CreateSubmission은 기본 제출 생성 함수이고,
// CreateSubmissionWithConsent는 MVP 권장 함수로 동의 상태, 병원/보험사 일치 여부, 기록 해시 일치 여부까지 검사합니다.
// RecordVerification은 검증 결과를 기록하고 제출 상태를 PASSED, FAILED, BLOCKED 등으로 바꿉니다.
package main

import (
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) CreateSubmission(ctx contractapi.TransactionContextInterface, submissionId, recordId, hospitalId, insurerId, createdAt string) (string, error) {
	if err := requireNonEmpty(map[string]string{"submissionId": submissionId, "recordId": recordId, "hospitalId": hospitalId, "insurerId": insurerId, "createdAt": createdAt}); err != nil {
		return "", err
	}
	if err := c.requireClaimParticipantForInsurer(ctx, insurerId); err != nil {
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

func (c *PetChainContract) CreateSubmissionWithConsent(ctx contractapi.TransactionContextInterface, submissionId, recordId, consentId, hospitalId, insurerId, recordHashAtSubmit, createdAt string) (string, error) {
	return c.createSubmissionWithConsent(ctx, submissionId, recordId, consentId, hospitalId, insurerId, recordHashAtSubmit, createdAt, "", "")
}

func (c *PetChainContract) CreateSubmissionWithConsentAndPolicy(ctx contractapi.TransactionContextInterface, submissionId, recordId, consentId, hospitalId, insurerId, recordHashAtSubmit, createdAt, policyVersion, policyHash string) (string, error) {
	if err := assertPolicySnapshot(policyVersion, policyHash); err != nil {
		return "", err
	}
	return c.createSubmissionWithConsent(ctx, submissionId, recordId, consentId, hospitalId, insurerId, recordHashAtSubmit, createdAt, policyVersion, policyHash)
}

func (c *PetChainContract) createSubmissionWithConsent(ctx contractapi.TransactionContextInterface, submissionId, recordId, consentId, hospitalId, insurerId, recordHashAtSubmit, createdAt, policyVersion, policyHash string) (string, error) {
	if err := requireNonEmpty(map[string]string{"submissionId": submissionId, "recordId": recordId, "consentId": consentId, "hospitalId": hospitalId, "insurerId": insurerId, "recordHashAtSubmit": recordHashAtSubmit, "createdAt": createdAt}); err != nil {
		return "", err
	}
	if err := c.requireClaimParticipantForInsurer(ctx, insurerId); err != nil {
		return "", err
	}
	if err := assertHash(recordHashAtSubmit, "recordHashAtSubmit"); err != nil {
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
	if record["currentHash"] != recordHashAtSubmit {
		return "", fmt.Errorf("record %s hash does not match submitted hash", recordId)
	}
	consent, err := c.getRequiredByParts(ctx, "consent", "consent", consentId)
	if err != nil {
		return "", err
	}
	if consent["status"] != "ACTIVE" {
		return "", fmt.Errorf("consent %s is not ACTIVE", consentId)
	}
	if consent["recordId"] != recordId {
		return "", fmt.Errorf("consent %s does not belong to record %s", consentId, recordId)
	}
	if consent["hospitalId"] != hospitalId {
		return "", fmt.Errorf("consent %s does not belong to hospital %s", consentId, hospitalId)
	}
	if consent["insurerId"] != insurerId {
		return "", fmt.Errorf("consent %s does not allow insurer %s", consentId, insurerId)
	}
	if consent["policyHash"] != nil && policyHash != "" && consent["policyHash"] != policyHash {
		return "", fmt.Errorf("consent %s policy hash does not match submitted policy hash", consentId)
	}
	key, _ := c.key(ctx, "submission", submissionId)
	if err := c.assertMissing(ctx, key, "submission"); err != nil {
		return "", err
	}
	submission := doc{"docType": "submission", "submissionId": submissionId, "recordId": recordId, "consentId": consentId, "hospitalId": hospitalId, "insurerId": insurerId, "recordHashAtSubmit": recordHashAtSubmit, "status": "PENDING", "createdAt": createdAt, "updatedAt": createdAt}
	if policyVersion != "" || policyHash != "" {
		submission["policyVersion"], submission["policyHash"] = policyVersion, policyHash
	}
	if err := c.put(ctx, key, submission); err != nil {
		return "", err
	}
	event := doc{"submissionId": submissionId, "recordId": recordId, "consentId": consentId, "hospitalId": hospitalId, "insurerId": insurerId, "recordHashAtSubmit": recordHashAtSubmit, "createdAt": createdAt}
	if policyVersion != "" || policyHash != "" {
		event["policyVersion"], event["policyHash"] = policyVersion, policyHash
	}
	if err := c.emit(ctx, "SubmissionCreated", event); err != nil {
		return "", err
	}
	return toJson(submission)
}

func (c *PetChainContract) RecordVerification(ctx contractapi.TransactionContextInterface, verificationId, submissionId, status, failureReasonsJson, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId string) (string, error) {
	return c.recordVerification(ctx, verificationId, submissionId, status, failureReasonsJson, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, "", "")
}

func (c *PetChainContract) RecordVerificationWithPolicy(ctx contractapi.TransactionContextInterface, verificationId, submissionId, status, failureReasonsJson, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, policyVersion, policyHash string) (string, error) {
	if err := assertPolicySnapshot(policyVersion, policyHash); err != nil {
		return "", err
	}
	return c.recordVerification(ctx, verificationId, submissionId, status, failureReasonsJson, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, policyVersion, policyHash)
}

func (c *PetChainContract) recordVerification(ctx contractapi.TransactionContextInterface, verificationId, submissionId, status, failureReasonsJson, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, policyVersion, policyHash string) (string, error) {
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
	if err := c.requireClaimOperatorForInsurer(ctx, fmt.Sprint(submission["insurerId"])); err != nil {
		return "", err
	}
	if submission["policyHash"] != nil && policyHash != "" && submission["policyHash"] != policyHash {
		return "", fmt.Errorf("submission %s policy hash does not match verification policy hash", submissionId)
	}
	key, _ := c.key(ctx, "verification", verificationId)
	if err := c.assertMissing(ctx, key, "verification"); err != nil {
		return "", err
	}
	verification := doc{"docType": "verification", "verificationId": verificationId, "submissionId": submissionId, "recordId": submission["recordId"], "hospitalId": submission["hospitalId"], "insurerId": submission["insurerId"], "status": status, "failureReasons": failureReasons, "recordHashAtVerify": recordHashAtVerify, "consentSnapshotHash": consentSnapshotHash, "verifiedAt": verifiedAt, "auditLogId": auditLogId}
	if policyVersion != "" || policyHash != "" {
		verification["policyVersion"], verification["policyHash"] = policyVersion, policyHash
	}
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
	event := doc{"verificationId": verificationId, "submissionId": submissionId, "status": status, "failureReasons": failureReasons, "verifiedAt": verifiedAt, "auditLogId": auditLogId}
	if policyVersion != "" || policyHash != "" {
		event["policyVersion"], event["policyHash"] = policyVersion, policyHash
	}
	if err := c.emit(ctx, "VerificationRecorded", event); err != nil {
		return "", err
	}
	return toJson(verification)
}

func (c *PetChainContract) MarkSubmissionStatus(ctx contractapi.TransactionContextInterface, submissionId, status string) (string, error) {
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
	if err := c.requireClaimOperatorForInsurer(ctx, fmt.Sprint(submission["insurerId"])); err != nil {
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
