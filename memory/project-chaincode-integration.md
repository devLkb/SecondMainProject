---
name: project-chaincode-integration
description: PetChain 체인코드-백엔드 연동 구현 완료 상태, ID 매핑 규칙, 활성화 방법
metadata:
  type: project
---

체인코드-백엔드 연동 코드 구현 완료 (2026-05-21).

**Why:** BACKEND_INTEGRATION_GUIDE.md + 체인코드_백엔드_연동_가이드.md 기반으로 체인코드와 서비스 연결.

**How to apply:** 아래 내용을 참고해 후속 작업 진행.

## 생성/수정된 파일

### 신규 (chain 패키지)
- `be/backend/src/main/java/com/blockchain/backend/chain/ChainProperties.java` — `chain.*` 설정 바인딩
- `be/backend/src/main/java/com/blockchain/backend/chain/PetChainLedger.java` — 인터페이스 (revokeConsent 포함)
- `be/backend/src/main/java/com/blockchain/backend/chain/NoOpPetChainLedger.java` — chain.enabled=false 시 no-op
- `be/backend/src/main/java/com/blockchain/backend/chain/FabricGatewayLedger.java` — 실제 Fabric Gateway 구현

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
fabricTxId / onChainStatus / verifyTxId 필드에 체인 tx ID 저장.
