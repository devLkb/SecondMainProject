package main

import (
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) RegisterConsent(ctx contractapi.TransactionContextInterface, consentId, recordId, insurerId, guardianHashedId, validUntil, createdAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"consentId": consentId, "recordId": recordId, "insurerId": insurerId, "guardianHashedId": guardianHashedId, "validUntil": validUntil, "createdAt": createdAt}); err != nil {
		return "", err
	}
	if err := assertHash(guardianHashedId, "guardianHashedId"); err != nil {
		return "", err
	}
	if err := assertIsoDate(validUntil, "validUntil"); err != nil {
		return "", err
	}
	if err := assertIsoDate(createdAt, "createdAt"); err != nil {
		return "", err
	}
	record, err := c.getRequiredByParts(ctx, "record", "record", recordId)
	if err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "consent", consentId)
	if err := c.assertMissing(ctx, key, "consent"); err != nil {
		return "", err
	}
	consent := doc{"docType": "consent", "consentId": consentId, "recordId": recordId, "hospitalId": record["hospitalId"], "insurerId": insurerId, "guardianHashedId": guardianHashedId, "status": "ACTIVE", "validUntil": validUntil, "createdAt": createdAt, "events": []interface{}{doc{"type": "REGISTERED", "createdAt": createdAt}}}
	if err := c.put(ctx, key, consent); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "ConsentRegistered", doc{"consentId": consentId, "recordId": recordId, "insurerId": insurerId, "validUntil": validUntil, "createdAt": createdAt}); err != nil {
		return "", err
	}
	return toJson(consent)
}

func (c *PetChainContract) RevokeConsent(ctx contractapi.TransactionContextInterface, consentId, revokedAt, reason string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"consentId": consentId, "revokedAt": revokedAt, "reason": reason}); err != nil {
		return "", err
	}
	if err := assertIsoDate(revokedAt, "revokedAt"); err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "consent", consentId)
	consent, err := c.getRequired(ctx, key, "consent")
	if err != nil {
		return "", err
	}
	if consent["status"] == "REVOKED" {
		return toJson(consent)
	}
	if consent["status"] == "EXPIRED" {
		return "", fmt.Errorf("consent %s is already EXPIRED", consentId)
	}
	consent["status"], consent["revokedAt"], consent["revokeReason"] = "REVOKED", revokedAt, reason
	events, _ := consent["events"].([]interface{})
	consent["events"] = append(events, doc{"type": "REVOKED", "revokedAt": revokedAt, "reason": reason})
	if err := c.put(ctx, key, consent); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "ConsentRevoked", doc{"consentId": consentId, "recordId": consent["recordId"], "insurerId": consent["insurerId"], "revokedAt": revokedAt}); err != nil {
		return "", err
	}
	return toJson(consent)
}

func (c *PetChainContract) ExpireConsent(ctx contractapi.TransactionContextInterface, consentId, expiredAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"consentId": consentId, "expiredAt": expiredAt}); err != nil {
		return "", err
	}
	if err := assertIsoDate(expiredAt, "expiredAt"); err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "consent", consentId)
	consent, err := c.getRequired(ctx, key, "consent")
	if err != nil {
		return "", err
	}
	if consent["status"] == "EXPIRED" {
		return toJson(consent)
	}
	if consent["status"] == "REVOKED" {
		return "", fmt.Errorf("consent %s is already REVOKED", consentId)
	}
	consent["status"], consent["expiredAt"] = "EXPIRED", expiredAt
	events, _ := consent["events"].([]interface{})
	consent["events"] = append(events, doc{"type": "EXPIRED", "expiredAt": expiredAt})
	if err := c.put(ctx, key, consent); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "ConsentExpired", doc{"consentId": consentId, "recordId": consent["recordId"], "insurerId": consent["insurerId"], "expiredAt": expiredAt}); err != nil {
		return "", err
	}
	return toJson(consent)
}

func (c *PetChainContract) GetConsentStatus(ctx contractapi.TransactionContextInterface, consentId string) (string, error) {
	if err := requireNonEmpty(map[string]string{"consentId": consentId}); err != nil {
		return "", err
	}
	consent, err := c.getRequiredByParts(ctx, "consent", "consent", consentId)
	if err != nil {
		return "", err
	}
	return toJson(doc{"consentId": consentId, "recordId": consent["recordId"], "insurerId": consent["insurerId"], "status": consent["status"], "validUntil": consent["validUntil"], "revokedAt": nullable(consent["revokedAt"]), "expiredAt": nullable(consent["expiredAt"])})
}
