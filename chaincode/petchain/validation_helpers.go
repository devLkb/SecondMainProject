//입력값 검증과 원장 입출력 공통 함수입니다.조직 권한 확인, 필수값 검사, SHA-256 해시 형식 검사, ISO 날짜 형식 검사,
// JSON 파싱, Fabric composite key 생성, 상태 저장/조회, 이벤트 발행 등을 담당합니다.
package main

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

var hashPattern = regexp.MustCompile(`^sha256:[a-fA-F0-9]{64}$`)

func (c *PetChainContract) requireOrg(ctx contractapi.TransactionContextInterface, allowedMsps ...string) error {
	clientMspId, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		clientMspId = ""
	}
	for _, allowed := range allowedMsps {
		if clientMspId == allowed {
			return nil
		}
	}
	if clientMspId == "" {
		clientMspId = "unknown"
	}
	return fmt.Errorf("MSP %s is not allowed", clientMspId)
}

func (c *PetChainContract) requireGovernanceChannel(ctx contractapi.TransactionContextInterface) error {
	channelId := ctx.GetStub().GetChannelID()
	if channelId != "" && channelId != governanceChannel {
		return fmt.Errorf("operation is only allowed on %s", governanceChannel)
	}
	return nil
}

func (c *PetChainContract) requireClaimDataChannel(ctx contractapi.TransactionContextInterface) error {
	channelId := ctx.GetStub().GetChannelID()
	if channelId == governanceChannel {
		return fmt.Errorf("claim operation is not allowed on %s", governanceChannel)
	}
	if c.isDedicatedClaimChannel(channelId) {
		return c.requireDedicatedClaimChannelMember(ctx, channelId)
	}
	return nil
}

func (c *PetChainContract) requireClaimChannelForInsurer(ctx contractapi.TransactionContextInterface, insurerId string) error {
	channelId := ctx.GetStub().GetChannelID()
	if channelId == "" || channelId == "petchannel" {
		return nil
	}
	if channelId == governanceChannel {
		return fmt.Errorf("claim operation is not allowed on %s", governanceChannel)
	}
	expectedChannel := claimChannelByInsurer[strings.ToLower(insurerId)]
	if expectedChannel == "" {
		return fmt.Errorf("insurer %s is not mapped to a claim channel", insurerId)
	}
	if channelId != expectedChannel {
		return fmt.Errorf("insurer %s must use channel %s, got %s", insurerId, expectedChannel, channelId)
	}
	if err := c.requireDedicatedClaimChannelMemberForInsurer(ctx, channelId, insurerId); err != nil {
		return err
	}
	return nil
}

func (c *PetChainContract) requireInsurerMSPForInsurer(ctx contractapi.TransactionContextInterface, insurerId string) error {
	clientMspId, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		clientMspId = ""
	}
	expectedMsp := insurerMSPByInsurer[strings.ToLower(insurerId)]
	if expectedMsp == "" {
		return fmt.Errorf("insurer %s is not mapped to an MSP", insurerId)
	}
	if clientMspId != expectedMsp {
		if clientMspId == "" {
			clientMspId = "unknown"
		}
		return fmt.Errorf("MSP %s is not allowed for insurer %s", clientMspId, insurerId)
	}
	return nil
}

func (c *PetChainContract) isDedicatedClaimChannel(channelId string) bool {
	return channelId == claimInsuranceAChannel || channelId == claimInsuranceBChannel
}

func (c *PetChainContract) requireDedicatedClaimChannelMember(ctx contractapi.TransactionContextInterface, channelId string) error {
	switch channelId {
	case claimInsuranceAChannel:
		return c.requireOrg(ctx, hospitalMSP, insurerAMSP)
	case claimInsuranceBChannel:
		return c.requireOrg(ctx, hospitalMSP, insurerBMSP)
	default:
		return nil
	}
}

func (c *PetChainContract) requireDedicatedClaimChannelMemberForInsurer(ctx contractapi.TransactionContextInterface, channelId, insurerId string) error {
	expectedMsp := insurerMSPByInsurer[strings.ToLower(insurerId)]
	if expectedMsp == "" {
		return fmt.Errorf("insurer %s is not mapped to an MSP", insurerId)
	}
	if channelId == claimInsuranceAChannel && expectedMsp != insurerAMSP {
		return fmt.Errorf("insurer %s must use channel %s, got %s", insurerId, claimInsuranceBChannel, channelId)
	}
	if channelId == claimInsuranceBChannel && expectedMsp != insurerBMSP {
		return fmt.Errorf("insurer %s must use channel %s, got %s", insurerId, claimInsuranceAChannel, channelId)
	}
	return c.requireOrg(ctx, hospitalMSP, expectedMsp)
}

func (c *PetChainContract) requireClaimOperatorForInsurer(ctx contractapi.TransactionContextInterface, insurerId string) error {
	channelId := ctx.GetStub().GetChannelID()
	if c.isDedicatedClaimChannel(channelId) {
		if err := c.requireClaimChannelForInsurer(ctx, insurerId); err != nil {
			return err
		}
		return c.requireInsurerMSPForInsurer(ctx, insurerId)
	}
	if err := c.requireClaimChannelForInsurer(ctx, insurerId); err != nil {
		return err
	}
	return c.requireOrg(ctx, platformMSP)
}

func (c *PetChainContract) requireClaimParticipantForInsurer(ctx contractapi.TransactionContextInterface, insurerId string) error {
	channelId := ctx.GetStub().GetChannelID()
	if c.isDedicatedClaimChannel(channelId) {
		return c.requireClaimChannelForInsurer(ctx, insurerId)
	}
	if err := c.requireClaimChannelForInsurer(ctx, insurerId); err != nil {
		return err
	}
	return c.requireOrg(ctx, platformMSP)
}

func requireNonEmpty(values map[string]string) error {
	for name, value := range values {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("%s is required", name)
		}
	}
	return nil
}

func assertPolicySnapshot(policyVersion, policyHash string) error {
	if err := requireNonEmpty(map[string]string{"policyVersion": policyVersion, "policyHash": policyHash}); err != nil {
		return err
	}
	return assertHash(policyHash, "policyHash")
}

func assertHash(value, name string) error {
	if !hashPattern.MatchString(value) {
		return fmt.Errorf("%s must be a sha256:<64 hex> hash", name)
	}
	return nil
}

func assertIsoDate(value, name string) error {
	if _, err := time.Parse(time.RFC3339Nano, value); err != nil {
		return fmt.Errorf("%s must be an ISO-8601 date", name)
	}
	return nil
}

func assertPositiveInteger(value, name string) (int, error) {
	integer, err := toInteger(value, name)
	if err != nil {
		return 0, err
	}
	if integer <= 0 {
		return 0, fmt.Errorf("%s must be positive", name)
	}
	return integer, nil
}

func toInteger(value, name string) (int, error) {
	integer, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer", name)
	}
	return integer, nil
}

func parseJsonArray(value, name string) ([]interface{}, error) {
	if value == "" {
		value = "[]"
	}
	var parsed []interface{}
	if err := json.Unmarshal([]byte(value), &parsed); err != nil {
		return nil, err
	}
	if parsed == nil {
		return nil, fmt.Errorf("%s must be a JSON array", name)
	}
	return parsed, nil
}

func parseJsonObject(value, name string) (doc, error) {
	if value == "" {
		value = "{}"
	}
	var parsed doc
	if err := json.Unmarshal([]byte(value), &parsed); err != nil {
		return nil, err
	}
	if parsed == nil {
		return nil, fmt.Errorf("%s must be a JSON object", name)
	}
	return parsed, nil
}

func (c *PetChainContract) key(ctx contractapi.TransactionContextInterface, objectType string, attributes ...string) (string, error) {
	return ctx.GetStub().CreateCompositeKey(objectType, attributes)
}

func (c *PetChainContract) get(ctx contractapi.TransactionContextInterface, key string) (doc, error) {
	bytes, err := ctx.GetStub().GetState(key)
	if err != nil || len(bytes) == 0 {
		return nil, err
	}
	var value doc
	if err := json.Unmarshal(bytes, &value); err != nil {
		return nil, err
	}
	return value, nil
}

func (c *PetChainContract) getRequiredByParts(ctx contractapi.TransactionContextInterface, label, objectType string, attributes ...string) (doc, error) {
	key, err := c.key(ctx, objectType, attributes...)
	if err != nil {
		return nil, err
	}
	return c.getRequired(ctx, key, label)
}

func (c *PetChainContract) getRequired(ctx contractapi.TransactionContextInterface, key, label string) (doc, error) {
	value, err := c.get(ctx, key)
	if err != nil {
		return nil, err
	}
	if value == nil {
		return nil, fmt.Errorf("%s not found", label)
	}
	return value, nil
}

func (c *PetChainContract) assertMissing(ctx contractapi.TransactionContextInterface, key, label string) error {
	existing, err := c.get(ctx, key)
	if err != nil {
		return err
	}
	if existing != nil {
		return fmt.Errorf("%s already exists", label)
	}
	return nil
}

func (c *PetChainContract) put(ctx contractapi.TransactionContextInterface, key string, value interface{}) error {
	bytes, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(key, bytes)
}

func (c *PetChainContract) emit(ctx contractapi.TransactionContextInterface, name string, payload interface{}) error {
	bytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return ctx.GetStub().SetEvent(name, bytes)
}

func (c *PetChainContract) txTime(ctx contractapi.TransactionContextInterface) string {
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err == nil && ts != nil {
		return time.Unix(ts.Seconds, int64(ts.Nanos)).UTC().Format(time.RFC3339Nano)
	}
	return time.Now().UTC().Format(time.RFC3339Nano)
}

func toJson(value interface{}) (string, error) {
	bytes, err := json.Marshal(value)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func toInt(value interface{}) int {
	switch v := value.(type) {
	case int:
		return v
	case int32:
		return int(v)
	case int64:
		return int(v)
	case float64:
		return int(v)
	case json.Number:
		i, _ := v.Int64()
		return int(i)
	case string:
		i, _ := strconv.Atoi(v)
		return i
	default:
		return 0
	}
}

func mustTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		return time.Time{}
	}
	return parsed
}

func nullable(value interface{}) interface{} {
	if value == nil {
		return nil
	}
	return value
}

func emptyString(value interface{}) string {
	if value == nil {
		return ""
	}
	return fmt.Sprint(value)
}
