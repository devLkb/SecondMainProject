---
name: project-chaincode-integration
description: PetChain 체인코드-백엔드 연동 구현 완료 상태, ID 매핑 규칙, 활성화 방법, 수정된 버그
metadata:
  type: project
---

체인코드-백엔드 연동 코드 구현 완료 (2026-05-21). 2026-05-22 버그 2건 수정.

**Why:** BACKEND_INTEGRATION_GUIDE.md + 체인코드_백엔드_연동_가이드.md 기반으로 체인코드와 서비스 연결.

**How to apply:** 아래 내용을 참고해 후속 작업 진행.

## 수정된 버그 (2026-05-22)

### BUG 1: FabricGatewayLedger.submit() — fabricTxId 컬럼 오버플로
- **원인**: `contract.submitTransaction()`은 체인코드 응답 JSON(수백~수천 자)을 반환. 이를 VARCHAR(64) 컬럼(fabric_tx_id)에 저장 → chain.enabled=true 시 MySQL strict mode에서 DataTruncation 예외 → 전체 @Transactional 롤백
- **수정**: `newProposal → build → endorse → submit` 흐름으로 변경, `transaction.getTransactionId()`로 실제 Fabric TxID(64자 hex)를 반환
- **파일**: `be/backend/src/main/java/com/blockchain/backend/chain/FabricGatewayLedger.java`

### BUG 2: FabricGatewayLedger.getPointBalance() — JSON 파싱 오류
- **원인**: `replaceAll("[^0-9\\-]", "")` 정규식이 insurerId 내 숫자도 추출 → 잘못된 잔액 반환 (예: "P-12345678" 보험사 잔액 50 → 파싱 실패 → 0 반환)
- **수정**: `"balance"\\s*:\\s*(-?\\d+)` 정규식으로 balance 필드만 정확히 추출
- **파일**: 동일

## 생성/수정된 파일

### 신규 (chain 패키지)
- `be/backend/src/main/java/com/blockchain/backend/chain/ChainProperties.java` — `chain.*` 설정 바인딩
- `be/backend/src/main/java/com/blockchain/backend/chain/PetChainLedger.java` — 인터페이스 (revokeConsent 포함)
- `be/backend/src/main/java/com/blockchain/backend/chain/NoOpPetChainLedger.java` — chain.enabled=false 시 no-op
- `be/backend/src/main/java/com/blockchain/backend/chain/FabricGatewayLedger.java` — 실제 Fabric Gateway 구현 (BUG 1, 2 수정됨)

### 수정
- `build.gradle`: `org.hyperledger.fabric:fabric-gateway:1.7.1` 추가
- `application.properties`: `chain.*` 환경변수 설정 추가
- `BackendApplication.java`: `@ConfigurationPropertiesScan` 추가
- `RecordService`: RegisterRecord 체인 호출 (autoCreateClaimPackages 이후)
- `ConsentService`: RegisterConsent(동의 ON) + RevokeConsent(동의 철회) 체인 호출
- `SubmissionService`: CreateSubmissionWithConsent 체인 호출
- `VerificationService`: ProcessSuccessfulVerification(성공) + RecordVerification(실패/차단) 체인 호출

## 체인코드 ID 매핑 규칙 (중요)
- chaincode consentId = `"CON-" + claim.getClaimId()`
- chaincode submissionId = `"SUB-" + claim.getClaimId()`
- chaincode verificationId = `"VER-" + verificationLog.getId()`
- chaincode auditLogId = `"AUD-" + verificationLog.getId()`
- chaincode idempotencyKey = `"idem-ver-" + verificationLog.getId()`
- chaincode hospitalId = `String.valueOf(hospital.getId())` (DB PK)
- chaincode insurerId = `insurer.getMemberNumber()` (예: "P-12345678")
- chaincode guardianHashedId = `HashContract.hashBytes(guardian.getMemberNumber().getBytes(UTF_8))`

## 활성화 방법
기본값 `chain.enabled=false` → 오프체인만 동작 (앱 안 깨짐).
Fabric 네트워크 기동 후 환경변수로 활성화:
```bash
export CHAIN_ENABLED=true
export CHAIN_MSP_ID=Org1MSP
export CHAIN_CHANNEL=petchannel
export CHAIN_TLS_CERT_PATH=~/fabric-samples/.../ca.crt
export CHAIN_CERT_PATH=~/fabric-samples/.../cert.pem
export CHAIN_KEY_DIR=~/fabric-samples/.../keystore
```

## MSP 주의사항
체인코드 권한 상수(PlatformOrgMSP, HospitalOrgMSP 등)와 test-network 기본 조직(Org1MSP, Org2MSP) 불일치 시 오류 발생.
→ 가이드 방식 A: 체인코드 MSP 상수를 Org1MSP/Org2MSP로 맞춰 재배포 (데모용)
→ 가이드 방식 B: 조직 이름을 커스텀 네트워크에서 맞춤 (운영용)

## 에러 처리 정책
온체인 실패해도 오프체인 데이터 유지. 모든 체인 호출은 try/catch로 감싸 warn 로그만 남김.
fabricTxId / onChainStatus / verifyTxId 필드에 체인 tx ID 저장 (64자 hex, VARCHAR(64) 컬럼에 정확히 맞음).

## 체인코드 테스트 현황
`chaincode/petchain/go test ./...` — 14개 테스트 전체 통과 (2026-05-22 확인)

## 전수 검증 결과 (2026-05-22)
오프체인 전 기능 + 체인 연동 정합성을 점검. **버그 미발견**(시스템 정상).
- **정적 정합성**: FabricGatewayLedger 9개 메서드 ↔ 체인코드 함수 인자 개수/순서 모두 일치. Java `Instant.toString()`(나노초) ↔ 체인코드 `assertIsoDate`(RFC3339Nano) 호환. `IssuePoints` amount=양의정수, GetPointBalance 정규식(`"balance":N`) 정확. NoOp(`matchIfMissing=true`)/Fabric(`true`) 빈 상호배타 → DI 충돌 없음.
- **빌드**: gradle compileJava+compileTestJava BUILD SUCCESSFUL. 체인코드 go test 통과.
- **실 API/DB 흐름**: 회원가입→펫→진료기록→동의→제출→검증→포인트 전 단계 DB 적재 정상. 검증 시 보험사 −1/병원 +1, 관리자 발행 정상 가산. 한글 utf8mb4 정상 저장.
- **엣지**: 멱등 재검증(중복차감 없음), 해시불일치 FAILED, 동의철회 BLOCKED, 비관리자 403, amount=0 → 400, 잔액부족 → 402. 전부 기대대로.
- **프론트↔백**: `src/api/client.js`의 모든 호출 경로가 백엔드 엔드포인트와 매핑. region은 `encodeURIComponent` 사용.
- **재배포**: 미커밋 변경 포함 백엔드 이미지 재빌드 후 컨테이너 재생성, 클린 부팅 확인(Started in ~137s, 오류 없음), 신 코드로 IssuePoints 동작 재확인.
- **적용한 수정**: 컴파일된 체인코드 바이너리 `chaincode/petchain/petchain-chaincode`(14MB)가 .gitignore 미포함 → 추가(실수 커밋 방지).

## 미연동(설계상 의도, 버그 아님)
- `confirmPointPurchase`/`getPointBalance` 레저 메서드: 대응 구매 기능 없어 미사용.
- `AdminService.reversePointTransaction`: 오프체인만 처리(체인 `ReversePoints` 미연동). 연동하려면 체인 논리 tx id 저장 필요(현재 fabricTxId만 저장).
- `AdminService.reversePointTransaction`: 오프체인만 처리(체인 `ReversePoints` 미연동).

## 실 Fabric 라이브 검증 완료 (2026-05-22)
이전까지 chain.enabled=false 로 정적 검증만 했으나, 이번에 실제 Fabric test-network(2.5) 기동 후 온체인 연동을 라이브로 전수 검증함. **FE(:8088)→BE(:8080)→chaincode→ledger 전 구간 정상.**
- petchannel 에 petchain 체인코드 커밋(Org1MSP+Org2MSP 승인), Org1MSP 신원으로 백엔드가 submit.
- 전체 흐름(보호자가입→펫→진료기록→동의→포인트발행→제출→검증PASSED) 각 단계 DB 적재 + 온체인 tx id 적재 확인:
  medical_records.fabric_tx_id/on_chain_status=confirmed, claim_packages.fabric_tx_id+verify_tx_id, verification_logs.fabric_tx_id, point_transactions.fabric_tx_id(IssuePoints).
- 체인코드 레저 직접 조회로 교차 확인: GetRecordHash/GetConsentStatus(ACTIVE)/GetVerificationResult(PASSED)/GetCreditBalance/GetPointBalance 모두 일관.
- 실제 검증 트리거는 `POST /api/submissions/{id}/verification`(보험사 스코프, VerificationService) — 이게 ProcessSuccessfulVerification 호출. `POST /internal/submissions/{id}/verify`(InternalVerificationService)는 PENDING/BLOCKED만 반환하는 **스텁**(체인 미호출).
- 관찰(버그 아님): 검증 시 생성되는 point_transactions spend 행은 fabric_tx_id=NULL — 검증 온체인 tx는 claim.verify_tx_id/verification_logs 에만 적재됨(설계상 검증 단위로 추적).

### 라이브에서 발견·수정한 실제 버그 2건
1. **protobuf 런타임 충돌** — fabric-gateway 1.7.1 의 fabric-protos 0.3.4(gencode 4.28.2) vs 런타임 protobuf-java 4.26.1 → `FabricGatewayLedger` 생성자에서 `ProtobufRuntimeVersionException` 으로 부팅 실패. build.gradle 에 `resolutionStrategy.force 'com.google.protobuf:protobuf-java:4.28.2'` 추가로 해결(Spring BOM 미관리 의존성이라 ext 프로퍼티는 무효, force 필요). **이 수정은 커밋 대상.**
2. **클라이언트 인증서 경로 불일치** — `-ca` 플로우는 `signcerts/cert.pem` 을 생성하나 override 가 `User1@...-cert.pem` 을 가리킴 → docker-compose.override.yml(gitignore) 의 CHAIN_CERT_PATH 를 cert.pem 으로 수정.
