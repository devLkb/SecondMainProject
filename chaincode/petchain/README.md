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
- `CreateSubmissionWithConsent(submissionId, recordId, consentId, hospitalId, insurerId, recordHashAtSubmit, createdAt)`
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

`CreateSubmissionWithConsent`는 제출 생성 시점에 체인코드가 진료기록 존재 여부, 활성 동의 상태, 동의 대상 병원/보험사, 제출 해시 일치를 함께 검증하는 함수입니다. 기존 `CreateSubmission`은 백엔드가 사전 검증을 끝낸 요청을 기록하는 호환용 함수로 유지합니다.

## MVP Policy Alignment

백엔드 연동 시 제출 요청 생성은 `CreateSubmissionWithConsent`를 우선 사용합니다. 이 함수는 MVP 정책 중 "동의 없는 진료기록은 보험사로 전달되지 않는다", "동의 대상이 아닌 보험사는 진료기록을 조회할 수 없다", "진료기록 해시가 다르면 제출 요청을 거절한다"는 조건을 체인코드 레벨에서도 검증합니다.

`CreateSubmission`은 기존 호출부나 테스트넷 초기 연동을 위한 호환 함수입니다. 실제 MVP 제출 흐름에서는 백엔드가 `consentId`와 제출 시점의 `recordHashAtSubmit`을 함께 전달해 `CreateSubmissionWithConsent`를 호출하는 것을 권장합니다.

검증 API 과금 정책은 `idempotencyKey`로 구분합니다.

- 같은 `idempotencyKey`를 5분 이내에 다시 사용하면 네트워크 재시도 또는 중복 요청으로 보고 포인트 차감과 크레딧 적립을 반복하지 않습니다.
- 같은 제출 건이라도 새로운 검증 API 성공 호출이면 새로운 `idempotencyKey`를 사용해야 하며, 이 경우 MVP 정책에 따라 보험사 포인트 1점 차감과 병원 크레딧 1점 적립이 다시 발생합니다.
- 포인트 부족, 권한 없음, 검증 실패, 차단 상태는 포인트 차감과 크레딧 적립 대상이 아닙니다.

## Backend API Mapping

백엔드 `petchainAPI` 서비스 구현 시에는 아래 기준으로 체인코드 함수를 연결합니다. DB와 파일 스토리지는 원문 데이터, 서명 URL, 화면 조회용 상세 정보를 담당하고, 체인코드는 해시, 상태, 포인트/크레딧, 감사 이력을 담당합니다.

| Backend API | Chaincode function | 호출 목적 | 비고 |
| --- | --- | --- | --- |
| `POST /records` | `RegisterRecord` | 진료기록 원문/첨부 파일의 SHA-256 해시를 원장에 고정 | 백엔드가 파일 저장과 해시 계산을 먼저 수행 |
| `GET /records` | 직접 호출 없음 | DB 기준 진료기록 목록 조회 | 필요 시 각 항목 검증용으로 `GetRecordHash` 보조 조회 가능 |
| `GET /records/{recordId}` | `GetRecordHash` | 상세 조회 시 온체인 해시/버전/상태 대조 | 원문과 상세 메타데이터는 DB/스토리지에서 조회 |
| `POST /consents` | `RegisterConsent` | 특정 진료기록과 보험사에 대한 보호자 동의 상태 등록 | 보호자 원문 식별자는 해시로 전달 |
| `GET /consents` | 직접 호출 없음 | DB 기준 동의 목록 조회 | 온체인 상태 대조가 필요한 단건은 `GetConsentStatus` 사용 |
| `GET /consents/{consentId}` | `GetConsentStatus` | 동의 상태, 유효기간, 철회/만료 상태 확인 | 상세 화면 응답은 DB 정보와 결합 |
| `POST /consents/{consentId}/revoke` | `RevokeConsent` | 동의 철회 상태와 이벤트를 원장에 기록 | 철회 후 백엔드는 신규 제출/패키지/검증 접근 차단 |
| `POST /submissions` | `CreateSubmissionWithConsent` | 제출 생성 시 ACTIVE 동의, 병원/보험사 일치, 제출 해시 일치를 체인코드에서 재검증 | MVP 제출 흐름의 권장 함수. `CreateSubmission`은 호환용 |
| `GET /submissions/{submissionId}` | 직접 호출 없음 | DB 기준 제출 상태 조회 | 온체인 검증 결과가 필요하면 `GetVerificationResult`와 결합 |
| `GET /submissions/{submissionId}/package` | `GetConsentStatus`, `GetVerificationResult` | 제출 패키지 제공 전 동의 상태와 검증 결과 재확인 | 원문/첨부는 체인코드가 반환하지 않고 서명 URL로 제공 |
| `POST /submissions/{submissionId}/verification` | `ProcessSuccessfulVerification` | 검증 API 성공 시 검증 기록, 포인트 차감, 병원 크레딧 적립을 한 트랜잭션으로 처리 | 새 성공 호출은 새 `idempotencyKey`; 재시도는 같은 key |
| `POST /submissions/{submissionId}/verification` | `RecordVerification` | 검증 실패 또는 차단 결과를 원장에 기록 | 실패/차단은 포인트 차감과 크레딧 적립 없음 |
| `POST /internal/submissions/{submissionId}/verify` | `RecordVerification` 또는 `ProcessSuccessfulVerification` | 내부 강제/재시도 검증 결과 기록 | 성공 과금 대상이면 `ProcessSuccessfulVerification`, 단순 상태 기록이면 `RecordVerification` |
| `GET /verifications/{verificationId}` | `GetVerificationResult` | 검증 상세 상태와 해시 기준 조회 | 비식별 상세 데이터는 DB와 결합 |
| `GET /verifications/{verificationId}/deidentified-data` | `GetVerificationResult` | 검증 통과 여부와 접근 가능 상태 확인 | 체인코드는 원문/비식별 본문을 직접 반환하지 않음 |
| `GET /verifications/{verificationId}/audit` | `GetAuditEvent` | 검증 관련 감사 로그 조회 | 백엔드 감사 로그 DB와 함께 사용할 수 있음 |
| `GET /insurers/{insurerId}/points/balance` | `GetPointBalance` | 보험사 포인트 잔액 조회 | 검증 API 호출 전 잔액 확인에도 사용 |
| `GET /insurers/{insurerId}/points/transactions` | `GetPointTransactions` | 특정 보험사의 포인트 거래 이력 조회 | `filterJson`으로 type/from/to 전달 |
| `GET /points/transactions` | `GetPointTransactions` | 보험사별 포인트 거래 이력 조회 | 전체 조회/페이지네이션은 백엔드 DB 인덱스와 결합 권장 |
| `GET /credits/transactions` | `GetCreditTransactions` | 병원별 크레딧 거래 이력 조회 | 전체 조회/페이지네이션은 백엔드 DB 인덱스와 결합 권장 |
| `POST /hospitals/{hospitalId}/credits/spend/saas` | `SpendCreditSaaS` | 병원 SaaS 기능 사용 시 크레딧 차감 | MVP에서는 SaaS 크레딧 사용 엔드포인트만 노출 |
| `POST /admin/insurers/{insurerId}/points/issue` | `IssuePoints` | 운영자가 보험사 포인트 발행 | `PlatformOrgMSP` 권한 필요 |
| `POST /admin/points/{transactionId}/reversal` | `ReversePoints` | 포인트 거래 취소/역거래 기록 | 7일 이내 역거래 제한 적용 |
| 보험사 청구 상태 변경 내부 처리 | `RecordAuditEvent` | 보험사 심사 상태 변경 이력을 감사 로그로 기록 | `POST /submissions/{submissionId}/claim-status` 응답 전후에 사용 가능 |

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

배포와 CLI 시연 절차는 [DEPLOY_DEMO.md](DEPLOY_DEMO.md)를 참고합니다.
