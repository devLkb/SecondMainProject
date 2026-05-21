# PetChain Backend Integration Guide

이 문서는 `chaincode/petchain` 체인코드를 팀원들과 공유하고, 백엔드와 안정적으로 연동하기 위해 필요한 내용을 정리한 문서다.

대상 독자:

- 백엔드 개발자
- 체인코드 연동 담당자
- 테스트/운영 담당자

## 1. 체인코드의 역할

이 체인코드는 의료 원문 데이터를 저장하지 않는다. 원장에는 아래 종류의 메타데이터만 저장한다.

- 진료기록 해시
- 첨부파일 해시
- 보호자 동의 상태
- 제출 상태
- 검증 결과
- 보험사 포인트 거래
- 병원 크레딧 거래
- 감사 로그
- 거버넌스 정책 정보

즉 실제 파일 본문, 개인정보 원문, 보험 심사 메모 원문은 오프체인 DB/스토리지에서 관리하고, 체인코드는 무결성 고정과 상태 추적을 담당한다.

## 2. 도메인 개요

체인코드 도메인은 다음 순서로 연결된다.

1. `Record`
2. `Consent`
3. `Submission`
4. `Verification`
5. `Point`
6. `Credit`
7. `Audit`
8. `Governance`

실무 흐름으로 보면 보통 아래 순서다.

1. 병원이 진료기록 해시 등록
2. 보호자 동의 등록
3. 제출 생성
4. 보험사 검증
5. 성공 시 보험사 포인트 차감
6. 성공 시 병원 크레딧 적립
7. 필요 시 감사 로그 기록

## 3. 조직과 채널

### MSP

코드상 사용되는 조직 ID는 다음과 같다.

- `PlatformOrgMSP`
- `HospitalOrgMSP`
- `InsuranceAOrgMSP`
- `InsuranceBOrgMSP`
- `InsurerOrgMSP`
  설명:
  `InsurerOrgMSP`는 레거시 데모용 상수다. 실제 보험사 매핑은 `InsuranceAOrgMSP`, `InsuranceBOrgMSP` 기준으로 본다.

### 채널

- `governance-channel`
- `claim-insurance-a-channel`
- `claim-insurance-b-channel`
- 빈 채널 ID 또는 `petchannel`
  설명:
  공유 채널처럼 동작한다.

### 보험사 매핑

- `ins_001`, `insurance_a`, `insurer_a` 계열 -> `claim-insurance-a-channel`, `InsuranceAOrgMSP`
- `ins_002`, `insurance_b`, `insurer_b` 계열 -> `claim-insurance-b-channel`, `InsuranceBOrgMSP`

### 채널별 기본 원칙

- `governance-channel`에서는 청구/검증/포인트/크레딧 작업을 하면 안 된다.
- 전용 보험사 채널에서는 해당 보험사 MSP와 병원 MSP만 접근 가능하다.
- 공유 채널에서는 플랫폼이 주요 운영 호출을 담당한다.

## 4. 주요 트랜잭션 요약

### Record

- `RegisterRecord(recordId, hospitalId, recordHash, attachmentHashesJson, createdAt)`
- `GetRecordHash(recordId)`
- `MarkRecordSuperseded(recordId, newRecordHash, attachmentHashesJson, supersededAt)`

설명:

- 원문이 아니라 해시만 저장한다.
- `recordHash`, 첨부파일 해시는 `sha256:<64 hex>` 형식이어야 한다.
- `createdAt`, `supersededAt`은 ISO-8601 형식이어야 한다.

### Consent

- `RegisterConsent(consentId, recordId, insurerId, guardianHashedId, validUntil, createdAt)`
- `RegisterConsentWithPolicy(...)`
- `RevokeConsent(consentId, revokedAt, reason)`
- `ExpireConsent(consentId, expiredAt)`
- `GetConsentStatus(consentId)`

설명:

- 보호자가 특정 진료기록을 특정 보험사에 제공해도 된다는 상태를 기록한다.
- 보호자 원문 ID는 저장하지 않고 `guardianHashedId`만 저장한다.
- 동의 상태는 `ACTIVE`, `REVOKED`, `EXPIRED`로 관리된다.

### Submission

- `CreateSubmission(submissionId, recordId, hospitalId, insurerId, createdAt)`
- `CreateSubmissionWithConsent(submissionId, recordId, consentId, hospitalId, insurerId, recordHashAtSubmit, createdAt)`
- `CreateSubmissionWithConsentAndPolicy(...)`
- `MarkSubmissionStatus(submissionId, status)`

설명:

- 실제 MVP 제출 흐름에서는 `CreateSubmissionWithConsent` 사용을 권장한다.
- 이 함수는 제출 생성 시점에 아래를 함께 검증한다.
  - 진료기록 존재 여부
  - 병원 일치 여부
  - 제출 시점 해시 일치 여부
  - 동의 상태가 `ACTIVE`인지
  - 동의 대상 보험사가 맞는지

### Verification

- `RecordVerification(verificationId, submissionId, status, failureReasonsJson, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId)`
- `RecordVerificationWithPolicy(...)`
- `GetVerificationResult(verificationId)`
- `ProcessSuccessfulVerification(verificationId, submissionId, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, idempotencyKey)`
- `ProcessSuccessfulVerificationWithPolicy(...)`

설명:

- 실패 또는 차단은 `RecordVerification`
- 성공은 `ProcessSuccessfulVerification`

`ProcessSuccessfulVerification` 내부 처리:

1. 검증 결과 `PASSED` 기록
2. 제출 상태 `PASSED` 변경
3. 보험사 포인트 1 차감
4. 병원 크레딧 1 적립

이 네 단계가 한 Fabric 트랜잭션 안에서 처리된다.

### Point

- `IssuePoints(insurerId, amount, issuedBy, issuedAt)`
- `ConfirmPointPurchase(purchaseId, insurerId, amount, paymentId, orderId, paidAt, purchasedBy, idempotencyKey)`
- `GetPointPurchase(purchaseId)`
- `DeductPoints(insurerId, verificationId, amount, deductedAt, idempotencyKey)`
- `ReversePoints(originalTransactionId, reason, reversedBy, reversedAt)`
- `GetPointBalance(insurerId)`
- `GetPointTransactions(insurerId, filterJson)`

설명:

- `IssuePoints`는 운영성 수동 발행
- `ConfirmPointPurchase`는 결제 완료 후 포인트 충전용
- `DeductPoints`는 검증 성공 시 사용
- `ReversePoints`는 7일 이내 반전 거래 생성

### Credit

- `AccrueCredit(hospitalId, verificationId, amount, accruedAt, idempotencyKey)`
- `SpendCreditSaaS(hospitalId, featureId, amount, spentAt)`
- `SpendCreditBanner(hospitalId, bannerType, amount, spentAt, approvalId)`
- `BurnExpiredCredit(transactionId, expiredAt)`
- `ReverseCredit(originalTransactionId, reason, reversedBy, reversedAt)`
- `GetCreditBalance(hospitalId)`
- `GetCreditTransactions(hospitalId, filterJson)`

### Audit

- `RecordAuditEvent(auditLogId, eventType, actorId, actorOrgId, resourceType, resourceId, submissionId, verificationId, result, failureCode, pointsDelta, creditDelta, createdAt, auditHash)`
- `GetAuditEvent(auditLogId)`

설명:

- `ProcessSuccessfulVerification`이 감사 로그를 자동 생성하지는 않는다.
- `auditLogId`는 연결용이고, 실제 감사 로그 생성은 `RecordAuditEvent`를 별도로 호출해야 한다.

### Governance

- `UpsertGovernancePolicy(policyVersion, policyHash, effectiveFrom, createdAt)`
- `RegisterClaimChannel(channelName, insurerId, insurerMspId, policyVersion, policyHash, createdAt)`
- `GetGovernancePolicy(policyVersion)`
- `GetActiveGovernancePolicy()`

## 5. 권한 정리

### 병원

주로 수행:

- `RegisterRecord`
- `MarkRecordSuperseded`
- 전용 채널 참여
- 크레딧 사용

### 플랫폼

주로 수행:

- 공유 채널에서 제출/검증 운영
- 포인트 수동 발행
- 결제 완료 후 포인트 구매 확정
- 감사 로그 기록
- 거버넌스 정책 관리

### 보험사

주로 수행:

- 전용 채널에서 검증 수행
- 전용 채널에서 포인트 구매 확정 가능
- 포인트 잔액/거래 조회

### 보호자

주의:

- 현재 체인코드에는 보호자 직접 서명 구조가 없다.
- 보호자의 의사는 백엔드/운영 시스템이 대신 반영한다.

## 6. 백엔드가 반드시 알아야 할 핵심 규칙

### 6.1 해시 형식

해시는 아래 형식만 허용된다.

```text
sha256:<64 hex>
```

예시:

```text
sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

### 6.2 날짜 형식

모든 날짜는 ISO-8601 문자열이어야 한다.

예시:

```text
2026-05-15T00:01:00.000Z
```

### 6.3 중복 ID 금지

아래 값은 중복되면 거절된다.

- `recordId`
- `consentId`
- `submissionId`
- `verificationId`
- `auditLogId`
- `purchaseId`

### 6.4 포인트와 크레딧은 잔액 필드를 저장하지 않음

체인코드는 포인트/크레딧 잔액을 별도 필드로 저장하지 않는다. 모든 거래의 `delta` 합으로 계산한다.

의미:

- 포인트 잔액 조회는 거래 집계를 기반으로 계산됨
- 조회가 잦으면 성능 비용이 커질 수 있음
- 백엔드에서 캐시/리드모델을 고려하는 것이 좋음

## 7. 권장 백엔드 연동 흐름

### 7.1 병원 진료기록 등록

1. 백엔드가 원문 파일 저장
2. 파일 해시 계산
3. `RegisterRecord` 호출

권장 인자:

- `recordId`
- `hospitalId`
- `recordHash`
- `attachmentHashesJson`
- `createdAt`

### 7.2 보호자 동의 등록

1. 백엔드가 보호자 동의 수집
2. 보호자 식별자 원문 대신 해시 생성
3. `RegisterConsent` 호출

권장 인자:

- `consentId`
- `recordId`
- `insurerId`
- `guardianHashedId`
- `validUntil`
- `createdAt`

### 7.3 제출 생성

권장 함수:

- `CreateSubmissionWithConsent`

권장 이유:

- 제출 시점 해시 검증
- 동의 상태 검증
- 병원/보험사 정합성 검증

### 7.4 검증 실패 또는 차단

사용 함수:

- `RecordVerification`

대표 상황:

- 동의 철회
- 기록 무결성 불일치
- 외부 검증 실패
- 정책 차단

### 7.5 검증 성공

사용 함수:

- `ProcessSuccessfulVerification`

결과:

- 검증 결과 저장
- 제출 상태 변경
- 보험사 포인트 1 차감
- 병원 크레딧 1 적립

### 7.6 보험사 결제 완료 후 포인트 충전

사용 함수:

- `ConfirmPointPurchase`

대표 흐름:

1. 보험사가 백엔드에서 결제
2. PG/정산 서비스가 성공 확정
3. 백엔드가 `ConfirmPointPurchase` 호출
4. 체인코드가 `pointPurchase` 저장
5. 체인코드가 `POINT_PURCHASE` 거래 저장
6. 보험사 포인트 잔액 증가

## 8. 포인트 흐름 상세

### 충전 경로

두 가지가 있다.

1. 운영 발행
2. 결제 완료 구매 확정

#### 운영 발행

- 함수: `IssuePoints`
- 거래 타입: `POINT_ISSUE`

#### 결제 완료 구매 확정

- 함수: `ConfirmPointPurchase`
- 거래 타입: `POINT_PURCHASE`

추가 저장 정보:

- `purchaseId`
- `paymentId`
- `orderId`
- `paidAt`
- `purchasedBy`

### 사용 경로

- 함수: `ProcessSuccessfulVerification`
- 내부 호출: `DeductPoints(..., "1", ...)`
- 거래 타입: `POINT_DEDUCT`

### 취소 경로

- 함수: `ReversePoints`
- 거래 타입: `POINT_REVERSAL`

### 조회

- 잔액: `GetPointBalance`
- 거래내역: `GetPointTransactions`
- 구매 단건: `GetPointPurchase`

## 9. `ConfirmPointPurchase` 사용 규칙

### 목적

보험사 결제 완료를 체인코드에 반영해 포인트를 충전한다.

### 인자

- `purchaseId`
- `insurerId`
- `amount`
- `paymentId`
- `orderId`
- `paidAt`
- `purchasedBy`
- `idempotencyKey`

### 중복 방지

체인코드가 방지하는 중복:

- 동일 `purchaseId`
- 동일 `paymentId`
- 동일 `orderId`
- 동일 `idempotencyKey`의 5분 내 재시도

중요:

- 백엔드도 반드시 자기 DB에서 `paymentId`, `orderId`, 내부 결제 상태를 별도로 중복 관리해야 한다.
- 체인코드 idempotency는 영구 보장이 아니라 5분 윈도우 기반이다.

### 채널/권한 규칙

- 공유 채널 또는 기본 채널:
  `PlatformOrgMSP`가 호출
- 전용 보험사 채널:
  해당 보험사 MSP가 호출
- `governance-channel`:
  호출 불가

## 10. `ProcessSuccessfulVerification` 사용 규칙

### 목적

보험사 검증 성공을 원장에 반영하고 과금/보상을 동시에 처리한다.

### 인자

- `verificationId`
- `submissionId`
- `recordHashAtVerify`
- `consentSnapshotHash`
- `verifiedAt`
- `auditLogId`
- `idempotencyKey`

### 백엔드 주의사항

- 동일 성공 호출 재시도는 같은 `idempotencyKey` 사용
- 새로운 성공 호출이면 새로운 `idempotencyKey` 사용
- 5분이 지난 뒤 같은 `idempotencyKey`로 재호출하면 새 요청처럼 처리될 수 있으므로 백엔드 자체 중복 방지가 필요

## 11. 실패/예외 처리 포인트

### 자주 나올 수 있는 오류

#### `MSP ... is not allowed`

원인:

- 잘못된 조직 계정으로 호출
- 전용 채널에서 허용되지 않은 조직 사용

확인할 것:

- 현재 채널 ID
- 호출자 MSP
- 보험사 ID와 채널 매핑

#### `claim operation is not allowed on governance-channel`

원인:

- 청구/검증/포인트 관련 함수를 `governance-channel`에서 호출

#### `record ... hash does not match submitted hash`

원인:

- 제출 시점 진료기록 해시가 현재 원장 해시와 다름

#### `consent ... is not ACTIVE`

원인:

- 동의가 철회됨
- 동의가 만료됨

#### `insufficient points for insurer ...`

원인:

- 보험사 포인트 부족

대응:

- 결제 후 `ConfirmPointPurchase`
- 운영 발행 `IssuePoints`

#### `payment already exists`

원인:

- 같은 `paymentId`로 이미 포인트 구매 처리됨

#### `order already exists`

원인:

- 같은 `orderId`로 이미 포인트 구매 처리됨

## 12. 백엔드 설계 권장사항

### 반드시 필요한 것

- 체인코드 호출 전후 로그 저장
- 내부 요청 ID 저장
- `paymentId`, `orderId` 영구 중복 방지
- `verificationId` 생성 규칙 관리
- 재시도 정책 분리

### 권장 저장 항목

#### 제출 생성 요청

- `submissionId`
- `recordId`
- `consentId`
- `insurerId`
- `recordHashAtSubmit`
- 내부 요청 상태

#### 검증 성공 요청

- `verificationId`
- `submissionId`
- `idempotencyKey`
- `verifiedAt`
- 체인코드 응답 원문

#### 포인트 결제 요청

- `purchaseId`
- `paymentId`
- `orderId`
- `insurerId`
- `amount`
- `idempotencyKey`
- 결제 승인 상태
- 체인코드 반영 상태

### 재시도 전략 권장

- 네트워크 오류:
  같은 `idempotencyKey`로 재시도
- 비즈니스 오류:
  재시도 전에 상태 점검
- 결제 성공 후 체인코드 반영 실패:
  백엔드 DB 상태를 기준으로 보상/재시도 로직 수행

## 13. 체인코드 함수 추천 매핑

| 백엔드 기능 | 권장 체인코드 함수 |
| --- | --- |
| 진료기록 해시 등록 | `RegisterRecord` |
| 보호자 동의 등록 | `RegisterConsent` |
| 제출 생성 | `CreateSubmissionWithConsent` |
| 검증 실패 기록 | `RecordVerification` |
| 검증 성공 기록 + 포인트 차감 + 크레딧 적립 | `ProcessSuccessfulVerification` |
| 보험사 포인트 결제 완료 반영 | `ConfirmPointPurchase` |
| 보험사 포인트 잔액 조회 | `GetPointBalance` |
| 보험사 포인트 거래 조회 | `GetPointTransactions` |
| 단건 포인트 구매 조회 | `GetPointPurchase` |
| 병원 크레딧 잔액 조회 | `GetCreditBalance` |
| 감사 로그 생성 | `RecordAuditEvent` |

## 14. 권장 호출 예시

### 제출 생성

```json
{
  "function": "CreateSubmissionWithConsent",
  "Args": [
    "sub_001",
    "rec_001",
    "con_001",
    "hos_001",
    "ins_001",
    "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "2026-05-15T00:00:00.000Z"
  ]
}
```

### 검증 성공

```json
{
  "function": "ProcessSuccessfulVerification",
  "Args": [
    "ver_001",
    "sub_001",
    "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "2026-05-15T00:01:00.000Z",
    "audit_001",
    "idem_verify_001"
  ]
}
```

### 포인트 구매 확정

```json
{
  "function": "ConfirmPointPurchase",
  "Args": [
    "pp_001",
    "ins_001",
    "10",
    "pay_001",
    "ord_001",
    "2026-05-15T00:00:00.000Z",
    "billing-system",
    "idem_purchase_001"
  ]
}
```

## 15. 테스트 관련 메모

로컬 테스트 코드는 `main_test.go`에 있다.

검증되는 주요 시나리오:

- 권한 거부
- 제출 시 동의/해시 검증
- 정책 해시 스냅샷 보존
- 검증 성공 idempotency
- 포인트 부족 시 실패
- 감사 로그 저장
- 포인트 구매 성공
- 포인트 구매 중복 `paymentId`/`orderId` 거부
- 전용 채널 포인트 구매 성공

현재 이 환경에서는 `go` 실행 파일이 잡히지 않아 여기서 직접 테스트를 돌리지는 못했다. 팀 환경에서는 아래 명령으로 확인하면 된다.

```bash
go test ./...
```

## 16. 팀원 전달용 핵심 요약

- 체인코드는 원문이 아니라 해시와 상태를 저장한다.
- 제출 생성은 `CreateSubmissionWithConsent`를 우선 사용한다.
- 검증 성공은 `ProcessSuccessfulVerification`로 처리한다.
- 보험사 결제 완료 후 포인트 충전은 `ConfirmPointPurchase`로 처리한다.
- `ConfirmPointPurchase`는 `paymentId`, `orderId`, `purchaseId` 중복을 막는다.
- 하지만 백엔드 DB에서도 중복 방지를 반드시 별도로 해야 한다.
- `idempotencyKey`는 5분 윈도우 기준이다. 영구 중복 방지가 아니다.
- 포인트/크레딧 잔액은 거래 합산 방식이라 조회를 자주 때리면 비효율적일 수 있다.
- 감사 로그는 자동 생성이 아니라 필요 시 `RecordAuditEvent`를 별도로 호출해야 한다.
