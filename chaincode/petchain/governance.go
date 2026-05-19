// governance-channel에 공통 정책과 claim 채널 메타데이터를 기록하는 함수들입니다.
package main

import (
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func (c *PetChainContract) UpsertGovernancePolicy(ctx contractapi.TransactionContextInterface, policyVersion, policyHash, effectiveFrom, createdAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := c.requireGovernanceChannel(ctx); err != nil {
		return "", err
	}
	if err := assertPolicySnapshot(policyVersion, policyHash); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"effectiveFrom": effectiveFrom, "createdAt": createdAt}); err != nil {
		return "", err
	}
	if err := assertIsoDate(effectiveFrom, "effectiveFrom"); err != nil {
		return "", err
	}
	if err := assertIsoDate(createdAt, "createdAt"); err != nil {
		return "", err
	}
	key, _ := c.key(ctx, "governancePolicy", policyVersion)
	policy := doc{"docType": "governancePolicy", "policyVersion": policyVersion, "policyHash": policyHash, "effectiveFrom": effectiveFrom, "createdAt": createdAt, "updatedAt": c.txTime(ctx)}
	if err := c.put(ctx, key, policy); err != nil {
		return "", err
	}
	activeKey, _ := c.key(ctx, "governancePolicy", "active")
	if err := c.put(ctx, activeKey, doc{"docType": "activeGovernancePolicy", "policyVersion": policyVersion, "policyHash": policyHash, "updatedAt": policy["updatedAt"]}); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "GovernancePolicyUpdated", policy); err != nil {
		return "", err
	}
	return toJson(policy)
}

func (c *PetChainContract) RegisterClaimChannel(ctx contractapi.TransactionContextInterface, channelName, insurerId, insurerMspId, policyVersion, policyHash, createdAt string) (string, error) {
	if err := c.requireOrg(ctx, platformMSP); err != nil {
		return "", err
	}
	if err := c.requireGovernanceChannel(ctx); err != nil {
		return "", err
	}
	if err := requireNonEmpty(map[string]string{"channelName": channelName, "insurerId": insurerId, "insurerMspId": insurerMspId, "createdAt": createdAt}); err != nil {
		return "", err
	}
	if err := assertPolicySnapshot(policyVersion, policyHash); err != nil {
		return "", err
	}
	if err := assertIsoDate(createdAt, "createdAt"); err != nil {
		return "", err
	}
	claimChannel := doc{"docType": "claimChannel", "channelName": channelName, "insurerId": insurerId, "insurerMspId": insurerMspId, "policyVersion": policyVersion, "policyHash": policyHash, "createdAt": createdAt}
	key, _ := c.key(ctx, "claimChannel", channelName)
	if err := c.put(ctx, key, claimChannel); err != nil {
		return "", err
	}
	if err := c.emit(ctx, "ClaimChannelRegistered", claimChannel); err != nil {
		return "", err
	}
	return toJson(claimChannel)
}

func (c *PetChainContract) GetGovernancePolicy(ctx contractapi.TransactionContextInterface, policyVersion string) (string, error) {
	if err := requireNonEmpty(map[string]string{"policyVersion": policyVersion}); err != nil {
		return "", err
	}
	policy, err := c.getRequiredByParts(ctx, "governance policy", "governancePolicy", policyVersion)
	if err != nil {
		return "", err
	}
	return toJson(policy)
}

func (c *PetChainContract) GetActiveGovernancePolicy(ctx contractapi.TransactionContextInterface) (string, error) {
	policy, err := c.getRequiredByParts(ctx, "active governance policy", "governancePolicy", "active")
	if err != nil {
		return "", err
	}
	return toJson(policy)
}
