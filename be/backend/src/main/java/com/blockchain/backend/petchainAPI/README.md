# petchainAPI 패키지 구조와 모듈 역할

`com.blockchain.backend.petchainAPI`는 반려동물 진료기록을 보험사에 제출하고, 보호자 동의와 검증 결과를 기반으로 보험 청구/포인트/감사 추적을 처리하기 위한 API 경계 계층이다.

현재 패키지는 **Controller → Port → Service → DTO/Common/Error/Security** 형태로 구성되어 있다. 컨트롤러는 HTTP 요청/응답과 검증을 담당하고, `port` 인터페이스는 비즈니스 기능의 계약을 정의하며, `service` 구현체는 각 Port를 구현하는 확장 지점이다. 서비스 계층은 MVP 범위에서 JPA 엔티티/Repository와 연결되어 진료기록, 동의, 제출, 검증, 포인트, 관리자 기능을 처리한다. 외부 스토리지/체인코드 연동은 아직 실제 원격 호출이 아니라 로컬 메타데이터와 감사 가능한 ID 중심으로 대체되어 있다.

## 전체 레이어 구조

```text
petchainAPI/
├── controller/  # REST 엔드포인트. 요청 파라미터/본문을 DTO로 받고 ApiResponse로 감싼다.
├── port/        # 컨트롤러가 의존하는 유스케이스 인터페이스.
├── service/     # Port 구현체. 현재는 스텁이며 이후 도메인/DB/블록체인 연동 위치.
├── dto/         # API 요청/응답 record와 상태 enum.
├── security/    # ApiActor 주입과 호출자 타입 해석.
└── error/       # API 전용 예외, 에러 코드, 전역 예외 응답 처리.
```

### 의존 방향

```text
HTTP 요청
  ↓
controller
  - @RestController, @GetMapping/@PostMapping
  - @Valid, @RequestParam, @PathVariable, @RequestPart 처리
  - ApiActor를 메서드 인자로 주입받음
  ↓
port 인터페이스
  - 기능별 입력/출력 계약
  - 컨트롤러는 구체 Service가 아니라 Port에만 의존
  ↓
service 구현체
  - @Service로 등록
  - 각 Port 구현
  - 현재 실제 구현 전 스텁
  ↓
dto/common/error/security
  - 요청/응답 스키마, 공통 상태값, 오류 응답, 호출자 컨텍스트 제공
```

## 기능 모듈별 구성

| 모듈 | Controller | Port | Service | 주요 DTO | 역할 |
| --- | --- | --- | --- | --- | --- |
| 진료기록 | `RecordController` | `RecordApiPort` | `RecordService` | `RecordDtos` | 병원에서 진료기록과 첨부 파일을 등록하고, 보호자/펫 기준으로 기록을 조회한다. |
| 동의 | `ConsentController` | `ConsentApiPort` | `ConsentService` | `ConsentDtos` | 보호자-보험사-진료기록 사이의 열람 동의를 생성, 조회, 철회한다. |
| 제출 | `SubmissionController` | `SubmissionApiPort` | `SubmissionService` | `SubmissionDtos` | 진료기록을 보험사 청구 검토 대상으로 제출하고 제출 상태/패키지를 조회한다. |
| 검증 | `SubmissionController`, `VerificationController` | `VerificationApiPort` | `VerificationService` | `VerificationDtos` | 제출 건을 검증하고 검증 상세, 비식별 데이터, 감사 로그를 조회한다. |
| 내부 검증 | `InternalVerificationController` | `InternalVerificationApiPort` | `InternalVerificationService` | `VerificationDtos.Internal*` | 내부 시스템이 제출 건 검증을 강제/재시도하는 내부용 엔드포인트를 제공한다. |
| 포인트/크레딧 | `PointController` | `PointApiPort` | `PointService` | `PointDtos`, `CommonDtos.TransactionSummary` | 보험사 포인트 잔액/거래와 병원 SaaS 크레딧 차감을 처리한다. |
| 관리자 | `AdminController` | `AdminApiPort` | `AdminService` | `AdminDtos` | 관리자 권한으로 보험사 포인트를 발급하거나 거래를 되돌린다. |
| 보안 컨텍스트 | - | - | - | `ApiActor`, `ActorType` | JWT 필터 또는 요청 헤더에서 호출자 정보를 읽어 컨트롤러 인자로 주입한다. |
| 오류 처리 | - | - | - | `ApiErrorCode`, `ApiException`, `ApiErrorResponse` | API 전용 예외를 HTTP 상태 코드와 추적 ID가 포함된 표준 오류 응답으로 변환한다. |

## 주요 업무 흐름

### 1. 진료기록 등록 및 조회

```text
POST /records
  → RecordController.createRecord()
  → RecordApiPort.createRecord()
  → RecordService.createRecord()
```

- `metadata` 파트는 `RecordDtos.CreateRecordRequest`로 받고, `recordFile`과 선택적 `attachments`는 `MultipartFile`로 받는다.
- 응답은 `recordId`, `recordHash`, 첨부파일 해시 목록을 포함한다.
- 등록된 기록은 `GET /records`와 `GET /records/{recordId}`로 조회한다.
- `RecordDtos`는 병원 ID, 보호자 ID, 펫 ID, 진료일, 진료비, 처치/진단 코드, 해시 정보를 다룬다.

### 2. 보호자 동의 관리

```text
POST /consents
  → ConsentController.createConsent()
  → ConsentApiPort.createConsent()
  → ConsentService.createConsent()
```

- `recordId`, `insurerId`, `guardianId`를 기준으로 보험사가 특정 진료기록에 접근할 수 있는 동의 관계를 만든다.
- `GET /consents`는 `recordId`, `guardianId`, `insurerId` 필터로 동의 목록을 조회한다.
- `POST /consents/{consentId}/revoke`는 동의를 철회한다. 요청 본문이 없으면 `reason = null`인 안전한 요청 객체를 만들어 Port로 넘긴다.
- 상태는 `ConsentStatus.ACTIVE`, `REVOKED`, `EXPIRED`를 사용한다.

### 3. 보험사 제출 패키지 생성/조회

```text
POST /submissions
  → SubmissionController.createSubmission()
  → SubmissionApiPort.createSubmission()
  → SubmissionService.createSubmission()
```

- 진료기록(`recordId`)을 보험사(`insurerId`) 검토 대상으로 제출한다.
- 제출 상태는 `SubmissionStatus`로 표현하며 `SUBMITTED`, `VERIFICATION_PENDING`, `VERIFICATION_PASSED`, `VERIFICATION_FAILED`, `BLOCKED` 등의 값을 가진다.
- `GET /submissions/{submissionId}/package`는 보험사 검토에 필요한 패키지를 반환한다.
  - 서명 URL(`SignedFileUrl`)
  - 원본/첨부 해시
  - 검증 요약
  - 동의 스냅샷
  - 병원/보호자/펫 최소 정보
  - 감사 로그 ID

### 4. 제출 건 검증

```text
POST /submissions/{submissionId}/verification
  → SubmissionController.verifySubmission()
  → VerificationApiPort.verifySubmission()
  → VerificationService.verifySubmission()
```

- 검증 요청은 `VerificationDtos.VerificationRequest`를 사용한다.
- 경로의 `submissionId`와 요청 본문의 `submissionId`가 다르면 `ApiException.validation(...)`을 던져 `VALIDATION_FAILED` 응답으로 변환한다.
- `Idempotency-Key` 헤더를 받을 수 있어 같은 검증 요청의 중복 처리를 방지하는 계약을 열어 둔다.
- 검증 응답에는 다음 정보가 포함된다.
  - 검증 상태(`VerificationStatus`)
  - 보험사 원본 기록 접근 가능 여부
  - 실패 사유/통과 체크 목록
  - 동의 스냅샷
  - 비식별 검증 데이터
  - 차감 포인트/적립 크레딧
  - 감사 로그 ID

검증 결과는 별도 조회 API로 다시 확인할 수 있다.

```text
GET /verifications/{verificationId}
GET /verifications/{verificationId}/deidentified-data
GET /verifications/{verificationId}/audit
```

### 5. 내부 검증 처리

```text
POST /internal/submissions/{submissionId}/verify
  → InternalVerificationController.verifySubmission()
  → InternalVerificationApiPort.verifySubmission()
  → InternalVerificationService.verifySubmission()
```

- 외부 클라이언트용 검증 요청과 분리된 내부 시스템용 엔드포인트다.
- 요청 본문이 없으면 `requestedBy = null`, `reason = null`, `force = false`인 기본 요청으로 처리한다.
- 강제 검증, 배치 재시도, 운영자/내부 잡 기반 검증 같은 흐름을 수용하기 위한 모듈이다.

### 6. 보험 청구 상태 업데이트

```text
POST /submissions/{submissionId}/claim-status
  → SubmissionController.updateClaimStatus()
  → SubmissionApiPort.updateClaimStatus()
  → SubmissionService.updateClaimStatus()
```

- 보험사가 제출 건의 청구 검토 상태를 갱신한다.
- 상태는 `ClaimReviewStatus`를 사용한다.
- `disclosable = true`는 `APPROVED_BY_INSURER` 또는 `REJECTED_BY_INSURER`일 때만 허용되도록 `@AssertTrue` 검증이 걸려 있다.

### 7. 포인트와 SaaS 크레딧

```text
GET  /insurers/{insurerId}/points/balance
GET  /insurers/{insurerId}/points/transactions
GET  /points/transactions
GET  /credits/transactions
POST /hospitals/{hospitalId}/credits/spend/saas
```

- 보험사 포인트 잔액과 거래 목록을 조회한다.
- 전체 포인트/크레딧 거래 조회는 보험사, 병원, 거래 타입, 기간, 페이지 조건을 받는다.
- 병원의 SaaS 기능 사용 시 크레딧을 차감하고 사용 권한(`entitlementId`, 유효 기간)을 반환한다.
- 거래 요약은 `CommonDtos.TransactionSummary`를 사용한다.

### 8. 관리자 포인트 운영

```text
POST /admin/insurers/{insurerId}/points/issue
POST /admin/points/{transactionId}/reversal
```

- 관리자가 보험사 포인트를 발급하거나 기존 포인트 거래를 취소/역거래로 되돌린다.
- 응답에는 거래 ID, 발급/취소 금액, 잔액 또는 감사 로그 ID가 포함된다.

## 공통 DTO와 상태값

### `dto/common/CommonDtos`

공통 응답 조각을 모아 둔 DTO 묶음이다.

- `AttachmentHash`: 첨부 파일 ID, 파일명, SHA-256 해시
- `SignedFileUrl`: 만료 시간이 있는 단회성 파일 접근 URL
- `ConsentSnapshot`: 검증/제출 시점의 동의 상태 스냅샷
- `HospitalMinimumInfo`, `GuardianMinimumInfo`, `PetMinimumInfo`: 패키지 응답에 포함되는 최소 식별 정보
- `VerificationSummary`: 제출 상태 응답에 포함되는 검증 요약
- `DeidentifiedVerificationData`: 보험사가 볼 수 있는 비식별 검증 데이터
- `AuditLogEntry`: 감사 로그 상세
- `TransactionSummary`: 포인트/크레딧 거래 요약

### 상태 enum

- `ConsentStatus`: `ACTIVE`, `REVOKED`, `EXPIRED`
- `SubmissionStatus`: 제출 생명주기 상태
- `VerificationStatus`: 검증 생명주기 상태
- `VerificationDataAccessStatus`: 검증 데이터 접근 가능/차단/만료 상태
- `PackageAccessStatus`: 제출 패키지 접근 가능/차단/삭제/만료 상태
- `ClaimReviewStatus`: 보험사 청구 검토 상태

## 보안 컨텍스트 구성

`security` 패키지는 컨트롤러 메서드의 `ApiActor actor` 인자를 자동으로 채운다.

```text
ApiWebMvcConfig
  → ApiActorArgumentResolver 등록
  → 컨트롤러 메서드의 ApiActor 파라미터 해석
```

`ApiActorArgumentResolver`는 다음 순서로 호출자 정보를 읽는다.

1. JWT 필터 등이 미리 설정한 request attribute
   - `actorId`
   - `actorRole`
   - `actorType`
2. attribute가 없으면 헤더 fallback
   - `X-Actor-Id`
   - `X-Actor-Org-Id`
   - `X-Actor-Role`
   - `X-Actor-Type`
3. 값이 없거나 알 수 없는 타입이면 `ActorType.UNKNOWN`으로 처리

`ActorType`은 `HOSPITAL`, `INSURER`, `GUARDIAN`, `ADMIN`, `INTERNAL`, `UNKNOWN`을 제공한다.

## 오류 처리 구성

`error` 패키지는 petchainAPI 전용 오류 응답을 표준화한다.

- `ApiErrorCode`: 도메인 오류 코드와 HTTP 상태를 매핑한다.
- `ApiException`: 코드, 메시지, 상세 정보를 담는 런타임 예외다.
- `ApiErrorResponse`: 클라이언트에 반환되는 오류 응답 형식이다.
- `ApiExceptionHandler`: `@RestControllerAdvice(basePackages = "com.blockchain.backend.petchainAPI")`로 이 패키지의 예외를 가로채 응답을 만든다.
- `TraceIds`: 요청에서 trace ID를 추출해 오류 응답에 포함한다.

예를 들어 제출 검증 요청의 경로/본문 `submissionId`가 다르면 `ApiException.validation(...)`이 발생하고, `ApiExceptionHandler`가 `VALIDATION_FAILED`와 trace ID를 포함한 응답으로 변환한다.

## 모듈 간 대표 관계

```text
Record
  └─ 진료기록 해시와 첨부 해시를 생성/보관하는 출발점

Consent
  └─ Record + Guardian + Insurer 접근 권한을 결정

Submission
  ├─ Record를 Insurer에게 제출
  ├─ Consent 상태를 바탕으로 package 접근 가능 여부 결정
  └─ Verification 결과 요약을 포함

Verification
  ├─ Submission, Record, Consent, Hash를 함께 검증
  ├─ 원본 접근 가능 여부와 비식별 데이터 제공 여부 결정
  ├─ Point 차감과 Hospital Credit 적립 결과 포함
  └─ AuditLog로 추적 가능

Point/Admin
  ├─ Verification 또는 SaaS 사용과 연계되는 금전성 거래 관리
  └─ Admin은 보험사 포인트 발급/취소 운영 기능 제공

Security/Error/Common
  └─ 모든 모듈이 공유하는 호출자 식별, 예외 응답, 공통 응답 조각 제공
```

## 구현 시 참고 사항

- 컨트롤러는 이미 API 계약과 입력 검증의 상당 부분을 정의하고 있으므로, 서비스 구현 시 Port 인터페이스 시그니처를 기준으로 도메인/DB/블록체인 연동을 연결하면 된다.
- 서비스는 MVP 범위에서 DB 연동으로 동작하며, 외부 S3/체인코드 원격 호출은 후속 연동 지점으로 남아 있다.
- 컨트롤러는 구체 서비스가 아닌 Port에 의존하므로, 테스트나 실제 구현에서 Port 구현체를 교체하기 쉽다.
- 동의 철회, 패키지 접근 차단, 검증 데이터 차단, 포인트 부족 등은 `ApiErrorCode`에 이미 도메인 오류 코드가 준비되어 있다.
