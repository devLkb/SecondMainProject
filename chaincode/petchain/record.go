package main

import (
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) RegisterRecord(ctx contractapi.TransactionContextInterface, recordId, hospitalId, recordHash, attachmentHashesJson, createdAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP, hospitalMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"recordId": recordId, "hospitalId": hospitalId, "recordHash": recordHash, "createdAt": createdAt}); err != nil {
		return "", err
	}
	if err := assertHash(recordHash, "recordHash"); err != nil {
		return "", err
	}
	if err := assertIsoDate(createdAt, "createdAt"); err != nil {
		return "", err
	}
	attachments, err := parseJsonArray(attachmentHashesJson, "attachmentHashes")
	if err != nil {
		return "", err
	}
	for i, hash := range attachments {
		if err := assertHash(fmt.Sprint(hash), fmt.Sprintf("attachmentHashes[%d]", i)); err != nil {
			return "", err
		}
	}
	key, err := c.key(ctx, "record", recordId)
	if err != nil {
		return "", err
	}
	if err := c.assertMissing(ctx, key, "record"); err != nil {
		return "", err
	}
	record := doc{
		"docType": "record", "recordId": recordId, "hospitalId": hospitalId, "currentHash": recordHash,
		"attachmentHashes": attachments, "version": 1, "status": "ACTIVE",
		"versions":  []interface{}{doc{"version": 1, "recordHash": recordHash, "attachmentHashes": attachments, "createdAt": createdAt}},
		"createdAt": createdAt, "updatedAt": createdAt,
	}
	if err := c.put(ctx, key, record); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "RecordRegistered", doc{"recordId": recordId, "hospitalId": hospitalId, "recordHash": recordHash, "createdAt": createdAt}); err != nil {
		return "", err
	}
	return toJson(record)
}

func (c *PetChainContract) GetRecordHash(ctx contractapi.TransactionContextInterface, recordId string) (string, error) {
	if err := requireNonEmpty(map[string]string{"recordId": recordId}); err != nil {
		return "", err
	}
	record, err := c.getRequiredByParts(ctx, "record", "record", recordId)
	if err != nil {
		return "", err
	}
	return toJson(doc{"recordId": recordId, "hospitalId": record["hospitalId"], "recordHash": record["currentHash"], "attachmentHashes": record["attachmentHashes"], "version": record["version"], "status": record["status"]})
}

func (c *PetChainContract) MarkRecordSuperseded(ctx contractapi.TransactionContextInterface, recordId, newRecordHash, attachmentHashesJson, supersededAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP, hospitalMSP); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"recordId": recordId, "newRecordHash": newRecordHash}); err != nil {
		return "", err
	}
	if err := assertHash(newRecordHash, "newRecordHash"); err != nil {
		return "", err
	}
	effectiveAt := supersededAt
	if effectiveAt == "" {
		effectiveAt = c.txTime(ctx)
	}
	if err := assertIsoDate(effectiveAt, "supersededAt"); err != nil {
		return "", err
	}
	attachments, err := parseJsonArray(attachmentHashesJson, "attachmentHashes")
	if err != nil {
		return "", err
	}
	for i, hash := range attachments {
		if err := assertHash(fmt.Sprint(hash), fmt.Sprintf("attachmentHashes[%d]", i)); err != nil {
			return "", err
		}
	}
	key, _ := c.key(ctx, "record", recordId)
	record, err := c.getRequired(ctx, key, "record")
	if err != nil {
		return "", err
	}
	version := toInt(record["version"]) + 1
	record["version"], record["status"], record["currentHash"], record["attachmentHashes"], record["updatedAt"] = version, "SUPERSEDED", newRecordHash, attachments, effectiveAt
	versions, _ := record["versions"].([]interface{})
	record["versions"] = append(versions, doc{"version": version, "recordHash": newRecordHash, "attachmentHashes": attachments, "createdAt": effectiveAt, "supersedesVersion": version - 1})
	if err := c.put(ctx, key, record); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "RecordSuperseded", doc{"recordId": recordId, "newRecordHash": newRecordHash, "version": version, "supersededAt": effectiveAt}); err != nil {
		return "", err
	}
	return toJson(record)
}
