// 체인코드의 시작점. PetChainContract라는 계약을 Fabric 체인코드로 등록하고 실행하고
// PlatformOrgMSP, HospitalOrgMSP, InsuranceAOrgMSP 같은 조직 권한 상수와 상태값 목록을 정의합니다.
package main

import (
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const (
	platformMSP = "Org1MSP" // 로컬 test-network 검증용 매핑(운영 기본값: PlatformOrgMSP). Org1 신원으로 petchannel 쓰기 게이트 통과.
	hospitalMSP = "HospitalOrgMSP"
	insurerMSP  = "InsurerOrgMSP" // legacy demo MSP
	insurerAMSP = "InsuranceAOrgMSP"
	insurerBMSP = "InsuranceBOrgMSP"

	governanceChannel      = "governance-channel"
	claimInsuranceAChannel = "claim-insurance-a-channel"
	claimInsuranceBChannel = "claim-insurance-b-channel"

	idempotencyWindow   = 5 * time.Minute
	pointReversalWindow = 7 * 24 * time.Hour
	creditExpiryWindow  = 365 * 24 * time.Hour
)

var (
	submissionStatuses    = map[string]bool{"PENDING": true, "PASSED": true, "FAILED": true, "PENDING_PAYMENT": true, "BLOCKED": true, "SUPERSEDED": true, "DELETED_BY_CONSENT_WITHDRAWAL": true, "EXPIRED": true}
	verificationStatuses  = map[string]bool{"PENDING": true, "PASSED": true, "FAILED": true, "BLOCKED": true}
	bannerAmounts         = map[string]int{"BASIC": 20, "MAIN": 50}
	claimChannelByInsurer = map[string]string{
		"ins_001":     claimInsuranceAChannel,
		"insurance_a": claimInsuranceAChannel,
		"insurance-a": claimInsuranceAChannel,
		"insurer_a":   claimInsuranceAChannel,
		"insurer-a":   claimInsuranceAChannel,
		"ins_002":     claimInsuranceBChannel,
		"insurance_b": claimInsuranceBChannel,
		"insurance-b": claimInsuranceBChannel,
		"insurer_b":   claimInsuranceBChannel,
		"insurer-b":   claimInsuranceBChannel,
	}
	insurerMSPByInsurer = map[string]string{
		"ins_001":     insurerAMSP,
		"insurance_a": insurerAMSP,
		"insurance-a": insurerAMSP,
		"insurer_a":   insurerAMSP,
		"insurer-a":   insurerAMSP,
		"ins_002":     insurerBMSP,
		"insurance_b": insurerBMSP,
		"insurance-b": insurerBMSP,
		"insurer_b":   insurerBMSP,
		"insurer-b":   insurerBMSP,
	}
)

type PetChainContract struct {
	contractapi.Contract
}

type doc map[string]interface{}

func main() {
	chaincode, err := contractapi.NewChaincode(new(PetChainContract))
	if err != nil {
		panic(fmt.Sprintf("failed to create PetChain chaincode: %v", err))
	}
	if err := chaincode.Start(); err != nil {
		panic(fmt.Sprintf("failed to start PetChain chaincode: %v", err))
	}
}

func (c *PetChainContract) InitLedger(ctx contractapi.TransactionContextInterface) (string, error) {
	return "PetChain MVP chaincode initialized", nil
}
