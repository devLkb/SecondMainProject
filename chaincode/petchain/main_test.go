//실제 실행 코드 X 블록체인 로직 검증용 테스트 코드
package main

import (
	"crypto/x509"
	"encoding/json"
	"strings"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const (
	hashA = "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
	hashB = "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
	hashC = "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
	hashD = "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
	now   = "2026-05-15T00:00:00.000Z"
)

type mockIdentity struct {
	mspID string
}

func (m mockIdentity) GetID() (string, error) {
	return "mock-user", nil
}

func (m mockIdentity) GetMSPID() (string, error) {
	return m.mspID, nil
}

func (m mockIdentity) GetAttributeValue(attrName string) (string, bool, error) {
	return "", false, nil
}

func (m mockIdentity) AssertAttributeValue(attrName, attrValue string) error {
	return nil
}

func (m mockIdentity) GetX509Certificate() (*x509.Certificate, error) {
	return nil, nil
}

func newCtx(mspID string) (*contractapi.TransactionContext, *shimtest.MockStub) {
	stub := shimtest.NewMockStub("petchain", nil)
	ctx := new(contractapi.TransactionContext)
	ctx.SetStub(stub)
	ctx.SetClientIdentity(mockIdentity{mspID: mspID})
	return ctx, stub
}

func nextTx(stub *shimtest.MockStub, txID string) {
	if stub.GetTxID() != "" {
		stub.MockTransactionEnd(stub.GetTxID())
	}
	stub.MockTransactionStart(txID)
}

func parseResult(t *testing.T, value string) map[string]interface{} {
	t.Helper()
	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(value), &parsed); err != nil {
		t.Fatalf("failed to parse JSON result: %v", err)
	}
	return parsed
}

func seedRecordAndSubmission(t *testing.T, contract *PetChainContract, ctx *contractapi.TransactionContext, stub *shimtest.MockStub) {
	t.Helper()
	nextTx(stub, "tx-record")
	if _, err := contract.RegisterRecord(ctx, "rec_001", "hos_001", hashA, `["`+hashB+`"]`, now); err != nil {
		t.Fatalf("RegisterRecord failed: %v", err)
	}
	nextTx(stub, "tx-consent")
	if _, err := contract.RegisterConsent(ctx, "con_001", "rec_001", "ins_001", hashC, "2027-05-15T00:00:00.000Z", now); err != nil {
		t.Fatalf("RegisterConsent failed: %v", err)
	}
	nextTx(stub, "tx-submission")
	if _, err := contract.CreateSubmission(ctx, "sub_001", "rec_001", "hos_001", "ins_001", now); err != nil {
		t.Fatalf("CreateSubmission failed: %v", err)
	}
}

func TestRecordsStoreHashes(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(hospitalMSP)

	nextTx(stub, "tx-record")
	createdJson, err := contract.RegisterRecord(ctx, "rec_001", "hos_001", hashA, `["`+hashB+`"]`, now)
	if err != nil {
		t.Fatalf("RegisterRecord failed: %v", err)
	}
	hashJson, err := contract.GetRecordHash(ctx, "rec_001")
	if err != nil {
		t.Fatalf("GetRecordHash failed: %v", err)
	}

	created := parseResult(t, createdJson)
	hashResult := parseResult(t, hashJson)
	if created["recordId"] != "rec_001" {
		t.Fatalf("unexpected recordId: %v", created["recordId"])
	}
	if hashResult["recordHash"] != hashA {
		t.Fatalf("unexpected record hash: %v", hashResult["recordHash"])
	}
}

func TestMSPAccessControlRejectsUnauthorizedWrites(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(insurerMSP)

	nextTx(stub, "tx-insurer-register-record")
	if _, err := contract.RegisterRecord(ctx, "rec_001", "hos_001", hashA, "[]", now); err == nil || !strings.Contains(err.Error(), "MSP InsurerOrgMSP is not allowed") {
		t.Fatalf("expected insurer MSP to be rejected for RegisterRecord, got: %v", err)
	}

	nextTx(stub, "tx-insurer-issue-points")
	if _, err := contract.IssuePoints(ctx, "ins_001", "1", "operator_001", now); err == nil || !strings.Contains(err.Error(), "MSP InsurerOrgMSP is not allowed") {
		t.Fatalf("expected insurer MSP to be rejected for IssuePoints, got: %v", err)
	}
}

func TestDuplicateIdsAndInvalidPayloadsAreRejected(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(hospitalMSP)

	nextTx(stub, "tx-record")
	if _, err := contract.RegisterRecord(ctx, "rec_001", "hos_001", hashA, `["`+hashB+`"]`, now); err != nil {
		t.Fatalf("RegisterRecord failed: %v", err)
	}

	nextTx(stub, "tx-record-duplicate")
	if _, err := contract.RegisterRecord(ctx, "rec_001", "hos_001", hashA, `["`+hashB+`"]`, now); err == nil || !strings.Contains(err.Error(), "record already exists") {
		t.Fatalf("expected duplicate record to be rejected, got: %v", err)
	}

	nextTx(stub, "tx-record-bad-hash")
	if _, err := contract.RegisterRecord(ctx, "rec_bad", "hos_001", "not-a-hash", "[]", now); err == nil || !strings.Contains(err.Error(), "recordHash must be a sha256") {
		t.Fatalf("expected invalid record hash to be rejected, got: %v", err)
	}
}

func TestCreateSubmissionWithConsentChecksConsentAndRecordHash(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(platformMSP)

	nextTx(stub, "tx-record")
	if _, err := contract.RegisterRecord(ctx, "rec_001", "hos_001", hashA, `["`+hashB+`"]`, now); err != nil {
		t.Fatalf("RegisterRecord failed: %v", err)
	}
	nextTx(stub, "tx-consent")
	if _, err := contract.RegisterConsent(ctx, "con_001", "rec_001", "ins_001", hashC, "2027-05-15T00:00:00.000Z", now); err != nil {
		t.Fatalf("RegisterConsent failed: %v", err)
	}

	nextTx(stub, "tx-submission")
	submissionJson, err := contract.CreateSubmissionWithConsent(ctx, "sub_001", "rec_001", "con_001", "hos_001", "ins_001", hashA, now)
	if err != nil {
		t.Fatalf("CreateSubmissionWithConsent failed: %v", err)
	}
	submission := parseResult(t, submissionJson)
	if submission["consentId"] != "con_001" || submission["recordHashAtSubmit"] != hashA {
		t.Fatalf("unexpected submission payload: %v", submission)
	}

	nextTx(stub, "tx-submission-hash-mismatch")
	if _, err := contract.CreateSubmissionWithConsent(ctx, "sub_bad_hash", "rec_001", "con_001", "hos_001", "ins_001", hashB, now); err == nil || !strings.Contains(err.Error(), "hash does not match") {
		t.Fatalf("expected record hash mismatch to be rejected, got: %v", err)
	}

	nextTx(stub, "tx-submission-wrong-insurer")
	if _, err := contract.CreateSubmissionWithConsent(ctx, "sub_bad_insurer", "rec_001", "con_001", "hos_001", "ins_999", hashA, now); err == nil || !strings.Contains(err.Error(), "does not allow insurer") {
		t.Fatalf("expected insurer mismatch to be rejected, got: %v", err)
	}
}

func TestCreateSubmissionWithConsentRejectsRevokedConsent(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(platformMSP)

	nextTx(stub, "tx-record")
	if _, err := contract.RegisterRecord(ctx, "rec_001", "hos_001", hashA, `["`+hashB+`"]`, now); err != nil {
		t.Fatalf("RegisterRecord failed: %v", err)
	}
	nextTx(stub, "tx-consent")
	if _, err := contract.RegisterConsent(ctx, "con_001", "rec_001", "ins_001", hashC, "2027-05-15T00:00:00.000Z", now); err != nil {
		t.Fatalf("RegisterConsent failed: %v", err)
	}
	nextTx(stub, "tx-revoke-consent")
	if _, err := contract.RevokeConsent(ctx, "con_001", "2026-05-15T00:01:00.000Z", "guardian withdrew consent"); err != nil {
		t.Fatalf("RevokeConsent failed: %v", err)
	}

	nextTx(stub, "tx-submission-revoked")
	if _, err := contract.CreateSubmissionWithConsent(ctx, "sub_001", "rec_001", "con_001", "hos_001", "ins_001", hashA, now); err == nil || !strings.Contains(err.Error(), "is not ACTIVE") {
		t.Fatalf("expected revoked consent to be rejected, got: %v", err)
	}
}

func TestSuccessfulVerificationIsIdempotent(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(platformMSP)
	seedRecordAndSubmission(t, contract, ctx, stub)

	nextTx(stub, "tx-issue")
	if _, err := contract.IssuePoints(ctx, "ins_001", "3", "operator_001", now); err != nil {
		t.Fatalf("IssuePoints failed: %v", err)
	}

	nextTx(stub, "tx-verify")
	resultJson, err := contract.ProcessSuccessfulVerification(ctx, "ver_001", "sub_001", hashA, hashD, "2026-05-15T00:01:00.000Z", "audit_001", "idem_001")
	if err != nil {
		t.Fatalf("ProcessSuccessfulVerification failed: %v", err)
	}
	nextTx(stub, "tx-verify-retry")
	retryJson, err := contract.ProcessSuccessfulVerification(ctx, "ver_retry", "sub_001", hashA, hashD, "2026-05-15T00:04:00.000Z", "audit_retry", "idem_001")
	if err != nil {
		t.Fatalf("retry ProcessSuccessfulVerification failed: %v", err)
	}

	result := parseResult(t, resultJson)
	retry := parseResult(t, retryJson)
	if result["pointTx"].(map[string]interface{})["transactionId"] != retry["pointTx"].(map[string]interface{})["transactionId"] {
		t.Fatalf("expected idempotent point transaction")
	}

	pointBalance := parseResult(t, must(contract.GetPointBalance(ctx, "ins_001")))
	creditBalance := parseResult(t, must(contract.GetCreditBalance(ctx, "hos_001")))
	if pointBalance["balance"].(float64) != 2 {
		t.Fatalf("unexpected point balance: %v", pointBalance["balance"])
	}
	if creditBalance["balance"].(float64) != 1 {
		t.Fatalf("unexpected credit balance: %v", creditBalance["balance"])
	}
}

func TestRepeatedSuccessfulVerificationWithNewIdempotencyKeyChargesAgain(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(platformMSP)
	seedRecordAndSubmission(t, contract, ctx, stub)

	nextTx(stub, "tx-issue")
	if _, err := contract.IssuePoints(ctx, "ins_001", "3", "operator_001", now); err != nil {
		t.Fatalf("IssuePoints failed: %v", err)
	}

	nextTx(stub, "tx-verify-1")
	if _, err := contract.ProcessSuccessfulVerification(ctx, "ver_001", "sub_001", hashA, hashD, "2026-05-15T00:01:00.000Z", "audit_001", "idem_001"); err != nil {
		t.Fatalf("first ProcessSuccessfulVerification failed: %v", err)
	}
	nextTx(stub, "tx-verify-2")
	if _, err := contract.ProcessSuccessfulVerification(ctx, "ver_002", "sub_001", hashA, hashD, "2026-05-15T00:02:00.000Z", "audit_002", "idem_002"); err != nil {
		t.Fatalf("second ProcessSuccessfulVerification failed: %v", err)
	}

	pointBalance := parseResult(t, must(contract.GetPointBalance(ctx, "ins_001")))
	creditBalance := parseResult(t, must(contract.GetCreditBalance(ctx, "hos_001")))
	if pointBalance["balance"].(float64) != 1 {
		t.Fatalf("expected two point deductions from balance 3, got: %v", pointBalance["balance"])
	}
	if creditBalance["balance"].(float64) != 2 {
		t.Fatalf("expected two hospital credits, got: %v", creditBalance["balance"])
	}
}

func TestInsufficientPointsDoesNotChargeOrAccrueCredit(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(platformMSP)
	seedRecordAndSubmission(t, contract, ctx, stub)

	nextTx(stub, "tx-verify-no-points")
	if _, err := contract.ProcessSuccessfulVerification(ctx, "ver_001", "sub_001", hashA, hashD, "2026-05-15T00:01:00.000Z", "audit_001", "idem_001"); err == nil || !strings.Contains(err.Error(), "insufficient points") {
		t.Fatalf("expected insufficient points error, got: %v", err)
	}

	pointBalance := parseResult(t, must(contract.GetPointBalance(ctx, "ins_001")))
	creditBalance := parseResult(t, must(contract.GetCreditBalance(ctx, "hos_001")))
	if pointBalance["balance"].(float64) != 0 {
		t.Fatalf("expected point balance to remain zero, got: %v", pointBalance["balance"])
	}
	if creditBalance["balance"].(float64) != 0 {
		t.Fatalf("expected credit balance to remain zero, got: %v", creditBalance["balance"])
	}
}

func TestRevokedConsentCanBeRecordedAsBlockedVerification(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(platformMSP)
	seedRecordAndSubmission(t, contract, ctx, stub)

	nextTx(stub, "tx-revoke-consent")
	if _, err := contract.RevokeConsent(ctx, "con_001", "2026-05-15T00:01:00.000Z", "guardian withdrew consent"); err != nil {
		t.Fatalf("RevokeConsent failed: %v", err)
	}

	nextTx(stub, "tx-blocked-verification")
	verificationJson, err := contract.RecordVerification(ctx, "ver_blocked", "sub_001", "BLOCKED", `["CONSENT_REVOKED"]`, hashA, hashD, "2026-05-15T00:02:00.000Z", "audit_blocked")
	if err != nil {
		t.Fatalf("RecordVerification BLOCKED failed: %v", err)
	}

	verification := parseResult(t, verificationJson)
	if verification["status"] != "BLOCKED" {
		t.Fatalf("expected blocked verification, got: %v", verification["status"])
	}

	submissionKey, _ := contract.key(ctx, "submission", "sub_001")
	submission, err := contract.getRequired(ctx, submissionKey, "submission")
	if err != nil {
		t.Fatalf("failed to read submission: %v", err)
	}
	if submission["status"] != "BLOCKED" {
		t.Fatalf("expected submission to be BLOCKED, got: %v", submission["status"])
	}
}

func TestAuditEventStoresDeltasAndHash(t *testing.T) {
	contract := new(PetChainContract)
	ctx, stub := newCtx(platformMSP)

	nextTx(stub, "tx-audit")
	auditJson, err := contract.RecordAuditEvent(ctx, "audit_001", "VERIFY_SUBMISSION", "ins_user_001", "ins_001", "SUBMISSION", "sub_001", "sub_001", "ver_001", "PASSED", "", "-1", "1", now, hashD)
	if err != nil {
		t.Fatalf("RecordAuditEvent failed: %v", err)
	}
	audit := parseResult(t, auditJson)
	if audit["auditLogId"] != "audit_001" || audit["auditHash"] != hashD {
		t.Fatalf("unexpected audit payload: %v", audit)
	}
	if audit["pointsDelta"].(float64) != -1 || audit["creditDelta"].(float64) != 1 {
		t.Fatalf("unexpected audit deltas: %v/%v", audit["pointsDelta"], audit["creditDelta"])
	}
}

func must(value string, err error) string {
	if err != nil {
		panic(err)
	}
	return value
}
