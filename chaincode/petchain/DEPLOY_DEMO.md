# PetChain Chaincode Deploy and Demo Guide

이 문서는 `chaincode/petchain` Go 체인코드를 Hyperledger Fabric 테스트 네트워크에 배포하고, MVP 핵심 흐름을 CLI로 시연하기 위한 가이드다.

현재 저장소에는 Fabric 네트워크 설정 파일이 포함되어 있지 않으므로, 배포 시연은 Hyperledger Fabric 공식 `fabric-samples/test-network`를 기준으로 한다.

## 1. 사전 준비

필요 도구:

- Docker, Docker Compose
- Go
- Fabric binaries: `peer`, `configtxgen` 등
- Fabric samples: `fabric-samples`

체인코드 로컬 테스트:

```bash
cd /home/ubuntu/pointpro/chaincode/petchain
go test ./...
```

Fabric samples가 없다면 공식 Fabric 설치 스크립트로 준비한다.

```bash
curl -sSL https://bit.ly/2ysbOFE | bash -s
```

설치 후 예시 경로:

```text
~/fabric-samples/test-network
```

## 2. 테스트 네트워크 시작

```bash
cd ~/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -ca -c petchannel
```

채널명은 이 문서에서 `petchannel`로 가정한다.

## 3. 체인코드 배포

`test-network`의 `deployCC`를 사용해 현재 프로젝트의 체인코드를 배포한다.

```bash
cd ~/fabric-samples/test-network

./network.sh deployCC \
  -c petchannel \
  -ccn petchain \
  -ccp /home/ubuntu/pointpro/chaincode/petchain \
  -ccl go
```

배포 확인:

```bash
peer lifecycle chaincode querycommitted \
  --channelID petchannel \
  --name petchain
```

## 4. CLI 환경 변수

`test-network`의 Org1을 `PlatformOrg` 역할로 보고 시연한다. 실제 운영 네트워크에서는 MSP 이름이 체인코드 상수와 일치해야 한다.

현재 체인코드는 다음 MSP ID를 사용한다.

```text
PlatformOrgMSP
HospitalOrgMSP
InsurerOrgMSP
```

Fabric `test-network` 기본 MSP는 `Org1MSP`, `Org2MSP`이므로, 실제로 invoke까지 성공시키려면 네트워크 MSP ID를 위 이름으로 맞춘 테스트 네트워크를 구성하거나 체인코드의 MSP 상수를 테스트 네트워크에 맞춰 별도 배포해야 한다.

프로젝트 시연에서는 둘 중 하나를 선택한다.

| 방식 | 설명 | 추천 상황 |
| --- | --- | --- |
| MSP 이름을 프로젝트 기준으로 맞춘 Fabric 네트워크 사용 | `PlatformOrgMSP`, `HospitalOrgMSP`, `InsurerOrgMSP`로 조직 구성 | 실제 블록체인 역할 시연 |
| Fabric `test-network`에 맞춰 임시 브랜치에서 MSP 상수 변경 | `Org1MSP`, `Org2MSP` 등으로 빠르게 테스트 | 로컬 배포 동작만 확인 |

## 5. 시연 데이터

시연에 사용할 고정 값:

```bash
export CHANNEL_NAME=petchannel
export CC_NAME=petchain

export RECORD_HASH=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export ATTACH_HASH=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
export GUARDIAN_HASH=sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
export SNAPSHOT_HASH=sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
export NOW=2026-05-15T00:00:00.000Z
```

공통 peer 명령 옵션 예시:

```bash
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export PEER0_ORG2_CA=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

export PEER_CONN_PARMS="--peerAddresses localhost:7051 --tlsRootCertFiles ${PEER0_ORG1_CA} --peerAddresses localhost:9051 --tlsRootCertFiles ${PEER0_ORG2_CA}"
```

## 6. MVP 정상 흐름 시연

### 6.1 진료기록 해시 등록

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c "{\"function\":\"RegisterRecord\",\"Args\":[\"rec_001\",\"hos_001\",\"$RECORD_HASH\",\"[\\\"$ATTACH_HASH\\\"]\",\"$NOW\"]}"
```

조회:

```bash
peer chaincode query \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  -c '{"function":"GetRecordHash","Args":["rec_001"]}'
```

시연 포인트:

- 원문 진료기록이 아니라 해시만 온체인에 저장된다.
- 이후 제출/검증 시 이 해시가 무결성 기준이 된다.

### 6.2 보호자 동의 등록

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c "{\"function\":\"RegisterConsent\",\"Args\":[\"con_001\",\"rec_001\",\"ins_001\",\"$GUARDIAN_HASH\",\"2027-05-15T00:00:00.000Z\",\"$NOW\"]}"
```

조회:

```bash
peer chaincode query \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  -c '{"function":"GetConsentStatus","Args":["con_001"]}'
```

시연 포인트:

- 보호자 원문 식별자는 저장하지 않고 해시만 저장한다.
- 동의 상태는 `ACTIVE`로 시작한다.

### 6.3 제출 요청 생성

MVP 권장 함수는 `CreateSubmissionWithConsent`다.

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c "{\"function\":\"CreateSubmissionWithConsent\",\"Args\":[\"sub_001\",\"rec_001\",\"con_001\",\"hos_001\",\"ins_001\",\"$RECORD_HASH\",\"$NOW\"]}"
```

시연 포인트:

- 체인코드가 `ACTIVE` 동의인지 확인한다.
- 동의의 병원/보험사/진료기록이 제출 요청과 일치하는지 확인한다.
- 제출 시점 해시가 등록된 진료기록 해시와 일치해야 한다.

### 6.4 보험사 포인트 발행

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c '{"function":"IssuePoints","Args":["ins_001","3","operator_001","2026-05-15T00:00:30.000Z"]}'
```

잔액 조회:

```bash
peer chaincode query \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  -c '{"function":"GetPointBalance","Args":["ins_001"]}'
```

### 6.5 검증 성공 처리

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c "{\"function\":\"ProcessSuccessfulVerification\",\"Args\":[\"ver_001\",\"sub_001\",\"$RECORD_HASH\",\"$SNAPSHOT_HASH\",\"2026-05-15T00:01:00.000Z\",\"audit_001\",\"idem_001\"]}"
```

조회:

```bash
peer chaincode query \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  -c '{"function":"GetVerificationResult","Args":["ver_001"]}'

peer chaincode query \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  -c '{"function":"GetPointBalance","Args":["ins_001"]}'

peer chaincode query \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  -c '{"function":"GetCreditBalance","Args":["hos_001"]}'
```

기대 결과:

- 검증 결과 `PASSED`
- 보험사 포인트 `3 -> 2`
- 병원 크레딧 `0 -> 1`

## 7. 실패/차단 시연

### 7.1 해시 불일치 제출 차단

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c "{\"function\":\"CreateSubmissionWithConsent\",\"Args\":[\"sub_bad_hash\",\"rec_001\",\"con_001\",\"hos_001\",\"ins_001\",\"$ATTACH_HASH\",\"$NOW\"]}"
```

기대 결과:

```text
record rec_001 hash does not match submitted hash
```

### 7.2 동의 철회 후 제출 차단

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c '{"function":"RevokeConsent","Args":["con_001","2026-05-15T00:02:00.000Z","guardian withdrew consent"]}'
```

철회된 동의로 새 제출 시도:

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c "{\"function\":\"CreateSubmissionWithConsent\",\"Args\":[\"sub_revoked\",\"rec_001\",\"con_001\",\"hos_001\",\"ins_001\",\"$RECORD_HASH\",\"$NOW\"]}"
```

기대 결과:

```text
consent con_001 is not ACTIVE
```

### 7.3 포인트 부족 시 과금 없음

포인트가 없는 보험사로 성공 검증을 처리하면 실패해야 한다.

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c "{\"function\":\"ProcessSuccessfulVerification\",\"Args\":[\"ver_no_points\",\"sub_001\",\"$RECORD_HASH\",\"$SNAPSHOT_HASH\",\"2026-05-15T00:03:00.000Z\",\"audit_no_points\",\"idem_no_points\"]}"
```

기대 결과:

```text
insufficient points for insurer ins_001
```

단, 앞의 정상 흐름에서 이미 포인트를 발행했다면 별도 새 보험사/제출 건으로 시연해야 한다.

## 8. Idempotency 시연

같은 `idempotencyKey`를 5분 이내 재사용하면 중복 과금을 막는다.

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "$ORDERER_CA" \
  -C "$CHANNEL_NAME" \
  -n "$CC_NAME" \
  $PEER_CONN_PARMS \
  -c "{\"function\":\"ProcessSuccessfulVerification\",\"Args\":[\"ver_retry\",\"sub_001\",\"$RECORD_HASH\",\"$SNAPSHOT_HASH\",\"2026-05-15T00:04:00.000Z\",\"audit_retry\",\"idem_001\"]}"
```

시연 포인트:

- 같은 `idempotencyKey`는 재시도로 간주한다.
- 새로운 검증 API 성공 호출은 새로운 `idempotencyKey`를 사용해야 매번 포인트 차감/크레딧 적립이 발생한다.

## 9. 발표용 설명 포인트

- 체인코드는 원문 진료기록, 첨부파일 본문, 보호자 개인정보를 저장하지 않는다.
- 온체인에는 해시, 상태, 검증 결과, 포인트/크레딧 거래, 감사 로그 식별자만 저장한다.
- `CreateSubmissionWithConsent`가 제출 시점의 핵심 MVP 정책을 체인코드 레벨에서 재검증한다.
- `ProcessSuccessfulVerification`은 검증 성공, 보험사 포인트 차감, 병원 크레딧 적립을 하나의 Fabric 트랜잭션으로 묶는다.
- `idempotencyKey`로 네트워크 재시도와 새로운 성공 호출을 구분한다.
- 실제 제출 패키지의 원문/첨부 파일은 백엔드 DB/스토리지와 단기 서명 URL로 제공한다.

## 10. 문제 해결

### `MSP Org1MSP is not allowed`

체인코드의 권한 상수는 `PlatformOrgMSP`, `HospitalOrgMSP`, `InsurerOrgMSP`다. Fabric `test-network` 기본 조직은 `Org1MSP`, `Org2MSP`이므로 MSP 이름이 맞지 않으면 권한 에러가 발생한다.

해결 방법:

- 프로젝트 MSP 이름으로 Fabric 네트워크를 구성한다.
- 또는 로컬 배포 확인용 임시 브랜치에서 MSP 상수를 `Org1MSP`, `Org2MSP`에 맞춘다.

### `chaincode registration failed`

Go 모듈 의존성 다운로드 또는 Docker 빌드 문제일 수 있다.

확인:

```bash
cd /home/ubuntu/pointpro/chaincode/petchain
go mod tidy
go test ./...
```

### 이전 원장 데이터와 충돌

같은 `recordId`, `consentId`, `submissionId`, `verificationId`는 중복 등록이 거절된다.

테스트 네트워크를 초기화한다.

```bash
cd ~/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -ca -c petchannel
```
