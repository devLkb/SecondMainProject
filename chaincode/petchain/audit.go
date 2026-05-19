// 감사 로그를 기록합니다.RecordAuditEvent는 누가, 어떤 리소스에, 어떤 결과를 만들었는지 메타데이터를 저장합니다.
// GetAuditEvent로 단건 감사 로그를 조회합니다. 감사 원문 전체보다는 추적 가능한 메타데이터와 해시를 남기는 구조입니다.
package main

import "github.com/hyperledger/fabric-contract-api-go/contractapi"

func (c *PetChainContract) RecordAuditEvent(ctx contractapi.TransactionContextInterface, auditLogId, eventType, actorId, actorOrgId, resourceType, resourceId, submissionId, verificationId, result, failureCode, pointsDelta, creditDelta, createdAt, auditHash string) (string, error) {
	if err := requireNonEmpty(map[string]string{"auditLogId": auditLogId, "eventType": eventType, "actorId": actorId, "actorOrgId": actorOrgId, "resourceType": resourceType, "resourceId": resourceId, "result": result, "createdAt": createdAt}); err != nil {
		return "", err
	}
	if c.isDedicatedClaimChannel(ctx.GetStub().GetChannelID()) {
		if err := c.requireClaimDataChannel(ctx); err != nil {
			return "", err
		}
	} else {
		if err := c.requireOrg(ctx, platformMSP); err != nil {
			return "", err
		}
		if err := c.requireClaimDataChannel(ctx); err != nil {
			return "", err
		}
	}
	if err := assertIsoDate(createdAt, "createdAt"); err != nil {
		return "", err
	}
	if auditHash != "" {
		if err := assertHash(auditHash, "auditHash"); err != nil {
			return "", err
		}
	}
	points, err := toInteger(pointsDelta, "pointsDelta")
	if err != nil {
		return "", err
	}
	credits, err := toInteger(creditDelta, "creditDelta")
	if err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "audit", auditLogId)
	if err := c.assertMissing(ctx, key, "audit event"); err != nil {
		return "", err
	}
	audit := doc{"docType": "audit", "auditLogId": auditLogId, "eventType": eventType, "actorId": actorId, "actorOrgId": actorOrgId, "resourceType": resourceType, "resourceId": resourceId, "submissionId": submissionId, "verificationId": verificationId, "result": result, "failureCode": failureCode, "pointsDelta": points, "creditDelta": credits, "auditHash": auditHash, "createdAt": createdAt}
	if err := c.put(ctx, key, audit); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "AuditRecorded", audit); err != nil {
		return "", err
	}
	return toJson(audit)
}

func (c *PetChainContract) GetAuditEvent(ctx contractapi.TransactionContextInterface, auditLogId string) (string, error) {
	if err := requireNonEmpty(map[string]string{"auditLogId": auditLogId}); err != nil {
		return "", err
	}
	audit, err := c.getRequiredByParts(ctx, "audit event", "audit", auditLogId)
	if err != nil {
		return "", err
	}
	return toJson(audit)
}
