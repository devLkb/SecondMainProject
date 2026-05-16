# PetChain Chaincode

PetChain MVP 기능명세서 기준 Hyperledger Fabric Go 체인코드입니다. MVP에서는 여섯 논리 체인코드(`Record`, `Consent`, `Submission`, `Point`, `Credit`, `Audit`)를 단일 계약 패키지 `PetChainContract`로 묶었습니다.

## Scope

- 온체인 저장 대상은 식별자, SHA-256 해시, 상태값, 검증 결과, 포인트/크레딧 거래, 감사 로그 메타데이터로 제한합니다.
- 진료기록 원문, 첨부 파일 본문, 보호자 개인정보, 반려동물 상세 정보, 보험 심사 메모는 저장하지 않습니다.
- NFT, SBT, 보호자 리워드, 현금 환급, 외부 가맹점 사용 함수는 포함하지 않습니다.

## Main Transactions

- `RegisterRecord(recordId, hospitalId, recordHash, attachmentHashesJson, createdAt)`
- `GetRecordHash(recordId)`
- `MarkRecordSuperseded(recordId, newRecordHash, attachmentHashesJson, supersededAt)`
- `RegisterConsent(consentId, recordId, insurerId, guardianHashedId, validUntil, createdAt)`
- `RevokeConsent(consentId, revokedAt, reason)`
- `ExpireConsent(consentId, expiredAt)`
- `GetConsentStatus(consentId)`
- `CreateSubmission(submissionId, recordId, hospitalId, insurerId, createdAt)`
- `RecordVerification(verificationId, submissionId, status, failureReasonsJson, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId)`
- `MarkSubmissionStatus(submissionId, status)`
- `GetVerificationResult(verificationId)`
- `IssuePoints(insurerId, amount, issuedBy, issuedAt)`
- `DeductPoints(insurerId, verificationId, amount, deductedAt, idempotencyKey)`
- `ReversePoints(originalTransactionId, reason, reversedBy, reversedAt)`
- `GetPointBalance(insurerId)`
- `GetPointTransactions(insurerId, filterJson)`
- `AccrueCredit(hospitalId, verificationId, amount, accruedAt, idempotencyKey)`
- `SpendCreditSaaS(hospitalId, featureId, amount, spentAt)`
- `SpendCreditBanner(hospitalId, bannerType, amount, spentAt, approvalId)`
- `BurnExpiredCredit(transactionId, expiredAt)`
- `ReverseCredit(originalTransactionId, reason, reversedBy, reversedAt)`
- `GetCreditBalance(hospitalId)`
- `GetCreditTransactions(hospitalId, filterJson)`
- `RecordAuditEvent(auditLogId, eventType, actorId, actorOrgId, resourceType, resourceId, submissionId, verificationId, result, failureCode, pointsDelta, creditDelta, createdAt, auditHash)`
- `GetAuditEvent(auditLogId)`
- `ProcessSuccessfulVerification(verificationId, submissionId, recordHashAtVerify, consentSnapshotHash, verifiedAt, auditLogId, idempotencyKey)`

`ProcessSuccessfulVerification`는 검증 성공 기록, 보험사 포인트 1점 차감, 병원 크레딧 1점 적립을 같은 Fabric 트랜잭션 안에서 실행하기 위한 MVP 편의 함수입니다.

## Access Control

MSP 기준으로 최소 권한을 적용합니다.

- `PlatformOrgMSP`: 포인트 발행/차감/역거래, 크레딧 적립/소각/역거래, 검증 결과, 감사 로그, 동의 대리 처리
- `HospitalOrgMSP`: 진료기록 등록/대체, 제출 생성, SaaS 크레딧 사용
- `InsurerOrgMSP`: 현재 MVP 체인코드에서는 쓰기 권한을 두지 않고 백엔드가 PlatformOrg로 대리 기록합니다.

## Test

```bash
go test ./...
```

테스트는 Fabric 런타임 없이 `shimtest` mock stub으로 실행됩니다. Fabric 네트워크에 배포할 때는 `chaincode/petchain` 디렉터리를 Go 체인코드 패키지로 지정해 패키징합니다.
