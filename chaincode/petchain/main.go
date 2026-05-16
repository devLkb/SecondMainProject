package main

import (
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const (
	platformMSP = "PlatformOrgMSP"
	hospitalMSP = "HospitalOrgMSP"
	insurerMSP  = "InsurerOrgMSP"

	idempotencyWindow   = 5 * time.Minute
	pointReversalWindow = 7 * 24 * time.Hour
	creditExpiryWindow  = 365 * 24 * time.Hour
)

var (
	submissionStatuses   = map[string]bool{"PENDING": true, "PASSED": true, "FAILED": true, "PENDING_PAYMENT": true, "BLOCKED": true, "SUPERSEDED": true, "DELETED_BY_CONSENT_WITHDRAWAL": true, "EXPIRED": true}
	verificationStatuses = map[string]bool{"PENDING": true, "PASSED": true, "FAILED": true, "BLOCKED": true}
	bannerAmounts        = map[string]int{"BASIC": 20, "MAIN": 50}
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
