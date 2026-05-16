# PetChain MVP 체인코드 진행 흐름

백엔드와 프론트엔드가 `mvp.md` 내용대로 완성되었을 때, 체인코드는 화면과 API에서 발생한 업무를 Hyperledger Fabric 원장에 기록하고 검증하는 역할을 한다.

체인코드는 원문 진료기록, 첨부파일 본문, 보호자 개인정보를 직접 저장하지 않는다. 대신 해시, 상태값, 동의 이력, 검증 결과, 포인트/크레딧 거래, 감사 로그처럼 나중에 무결성과 이력을 확인할 수 있는 데이터만 저장한다.

## 전체 역할

프론트엔드는 병원, 보호자, 보험사, 관리자 화면을 제공한다.

백엔드는 로그인, 권한 확인, DB/스토리지 저장, 파일 해시 생성, 제출 패키지 생성, 서명 URL 발급, API 응답 생성을 담당한다.

체인코드는 다음 항목을 원장에 남긴다.

- 진료기록 해시
- 보호자 동의 상태
- 제출 요청 상태
- 플랫폼 검증 결과
- 보험사 포인트 거래
- 병원 크레딧 거래
- 감사 로그

## 1. 병원이 진료기록을 등록

병원 프론트에서 진료기록 원문과 첨부파일을 등록하면, 백엔드는 원문 파일을 DB 또는 스토리지에 저장하고 파일 해시를 계산한다.

그 다음 체인코드의 `RegisterRecord`를 호출한다.

온체인에는 다음 데이터가 저장된다.

- `recordId`
- `hospitalId`
- `recordHash`
- `attachmentHashes`
- `version`
- `status`
- `createdAt`
- `updatedAt`

이 단계의 목적은 진료기록 원문을 블록체인에 올리는 것이 아니라, 이후 제출 또는 검증 시 원문이 바뀌지 않았는지 확인할 수 있는 기준 해시를 고정하는 것이다.

## 2. 보호자가 특정 보험사 제출에 동의

보호자 화면에서 특정 진료기록을 특정 보험사에 제출하도록 동의하면, 백엔드는 체인코드의 `RegisterConsent`를 호출한다.

원장에는 다음 데이터가 저장된다.

- `consentId`
- `recordId`
- `hospitalId`
- `insurerId`
- `guardianHashedId`
- `status`
- `validUntil`
- `createdAt`
- 동의 이벤트 목록

동의 상태는 처음에 `ACTIVE`로 저장된다.

보호자가 동의를 철회하면 `RevokeConsent`가 호출되고, 유효기간이 끝나면 `ExpireConsent`가 호출된다.

동의 철회 또는 만료 후에는 백엔드가 신규 제출, 제출 패키지 신규 조회, 검증 API 신규 조회를 차단한다. 체인코드는 해당 동의의 상태 변화 이력을 원장에 보존한다.

## 3. 병원이 보험사 제출 요청 생성

병원 화면에서 보험사 제출 요청을 만들면, 백엔드는 먼저 제출 가능 여부를 확인한다.

확인 기준은 다음과 같다.

- 보호자 동의가 존재하는가
- 동의 상태가 `ACTIVE`인가
- 동의 대상 보험사와 제출 대상 보험사가 같은가
- 진료기록 해시가 등록 시점의 해시와 같은가
- 제출 가능한 상태인가

검증을 통과하면 백엔드는 체인코드의 `CreateSubmission`을 호출한다.

원장에는 제출 요청이 `PENDING` 상태로 저장된다.

```text
record -> consent -> submission
```

이 단계에서 체인코드는 제출 요청과 진료기록, 병원, 보험사의 연결 관계를 고정한다.

## 4. 플랫폼이 제출 요청을 검증

플랫폼 백엔드는 제출 요청을 검증한 뒤 체인코드의 `RecordVerification`을 호출한다.

검증 성공 시 상태 흐름은 다음과 같다.

```text
verification.status = PASSED
submission.status = PASSED
```

검증 실패 또는 차단 시 상태 흐름은 다음과 같다.

```text
verification.status = FAILED 또는 BLOCKED
submission.status = FAILED 또는 BLOCKED
```

`RecordVerification`은 다음 정보를 저장한다.

- `verificationId`
- `submissionId`
- `recordId`
- `hospitalId`
- `insurerId`
- `status`
- `failureReasons`
- `recordHashAtVerify`
- `consentSnapshotHash`
- `verifiedAt`
- `auditLogId`

즉, 특정 제출 요청이 어떤 진료기록 해시와 어떤 동의 상태 기준으로 통과 또는 실패했는지가 원장에 남는다.

## 5. 보험사가 제출 패키지를 조회

보험사 프론트 또는 API에서 검증 완료 제출 패키지를 조회하면, 백엔드는 체인코드와 자체 DB를 함께 확인한다.

조회 가능 조건은 다음과 같다.

- 제출 상태가 `PASSED`인가
- 검증 결과가 `PASSED`인가
- 동의 상태가 아직 `ACTIVE`인가
- 요청 보험사가 동의 대상 보험사와 같은가
- 권한 있는 보험사 계정 또는 API 키인가

체인코드는 제출 패키지 원문을 직접 반환하지 않는다. 백엔드는 체인코드 상태를 근거로 조회 가능 여부를 판단하고, 실제 제출 패키지는 DB/스토리지의 데이터와 단기 서명 URL로 구성한다.

제출 패키지에는 다음 항목이 포함된다.

- `submissionId`
- `verificationId`
- `recordId`
- 진료기록 원문 접근 URL
- 첨부 파일 접근 URL
- 진료기록 해시
- 첨부 파일 해시
- 검증 결과
- 동의 스냅샷
- 병원 최소 정보
- 보호자 최소 식별 정보
- 반려동물 최소 정보
- 제출 요청 시각
- 검증 완료 시각
- 감사 로그 ID

## 6. 보험사가 검증 API 호출

보험사가 검증 API를 호출하면 백엔드는 먼저 보험사 포인트 잔액을 확인한다.

사용되는 체인코드 함수는 다음과 같다.

- `GetPointBalance`
- `GetPointTransactions`

포인트가 부족하면 백엔드는 검증 API를 실패로 응답하고 포인트를 차감하지 않는다.

검증 API가 성공하고 비식별 진료 검증 데이터가 정상 반환되는 경우에만 체인코드에서 포인트 차감과 크레딧 적립이 발생한다.

현재 체인코드에서는 이 성공 흐름을 `ProcessSuccessfulVerification` 함수가 한 번에 처리한다.

```text
RecordVerification(PASSED)
-> DeductPoints: 보험사 포인트 1점 차감
-> AccrueCredit: 병원 크레딧 1점 적립
```

결과적으로 원장에는 다음 데이터가 함께 남는다.

- 검증 성공 이력
- 보험사 포인트 차감 거래
- 병원 크레딧 적립 거래

주의할 점은 `idempotencyKey` 처리이다. 현재 체인코드는 같은 `idempotencyKey`가 5분 안에 재시도되면 중복 차감과 중복 적립을 막는다.

`mvp.md`의 "동일 제출 요청 반복 성공 호출도 매번 차감/적립" 조건을 만족하려면, 백엔드는 실제 새로운 검증 API 성공 호출마다 새로운 `idempotencyKey`를 사용해야 한다. 네트워크 재시도나 중복 요청 방지 목적의 재시도에만 같은 `idempotencyKey`를 사용해야 한다.

## 7. 병원이 크레딧 사용

병원 화면에서 고급 SaaS 기능을 사용하거나 자체 웹사이트 배너 홍보를 요청하면, 백엔드는 병원 크레딧 잔액을 확인하고 체인코드를 호출한다.

사용되는 함수는 다음과 같다.

- `SpendCreditSaaS`
- `SpendCreditBanner`
- `BurnExpiredCredit`
- `GetCreditBalance`
- `GetCreditTransactions`

`SpendCreditSaaS`는 고급 SaaS 기능 사용 시 병원 크레딧 10점을 차감한다.

`SpendCreditBanner`는 배너 홍보 요청 시 크레딧을 차감한다.

- `BASIC`: 20점
- `MAIN`: 50점

`BurnExpiredCredit`은 365일이 지난 적립 크레딧의 남은 수량을 소각한다.

## 8. 관리자와 운영자가 이력 조회

관리자 화면에서는 체인코드의 조회 함수를 통해 운영 이력을 확인한다.

주요 조회 함수는 다음과 같다.

- `GetRecordHash`
- `GetConsentStatus`
- `GetVerificationResult`
- `GetPointBalance`
- `GetPointTransactions`
- `GetCreditBalance`
- `GetCreditTransactions`
- `GetAuditEvent`

운영 이벤트는 백엔드가 `RecordAuditEvent`를 호출해 감사 로그로 남긴다.

감사 로그에는 다음과 같은 정보가 저장된다.

- 이벤트 종류
- 행위자 ID
- 행위자 조직 ID
- 리소스 종류
- 리소스 ID
- 제출 ID
- 검증 ID
- 결과
- 실패 코드
- 포인트 변화량
- 크레딧 변화량
- 감사 해시
- 생성 시각

## 전체 정상 흐름 요약

```text
병원 진료기록 등록
-> 백엔드 해시 생성
-> RegisterRecord

보호자 제출 동의
-> RegisterConsent

병원 제출 요청
-> 백엔드가 동의/보험사/해시 검증
-> CreateSubmission

플랫폼 검증
-> RecordVerification
-> 성공 건만 보험사 조회 가능

보험사 제출 패키지 조회
-> 백엔드가 체인코드 상태 확인
-> 원문은 서명 URL로 제공

보험사 검증 API 성공
-> ProcessSuccessfulVerification
-> 포인트 1점 차감
-> 병원 크레딧 1점 적립

병원 크레딧 사용
-> SpendCreditSaaS 또는 SpendCreditBanner

운영 감사
-> RecordAuditEvent
```

## 실패 흐름 요약

보호자 동의가 없으면 백엔드는 제출 요청을 거절하고 `CreateSubmission`을 호출하지 않는다.

동의 대상 보험사와 요청 보험사가 다르면 제출 요청을 거절한다.

진료기록 해시가 등록 시점과 다르면 검증 실패로 처리하고, 필요 시 `RecordVerification`에 `FAILED` 상태와 실패 사유를 남긴다.

보험사 포인트가 부족하면 검증 API를 실패로 응답하고 `DeductPoints`를 호출하지 않는다.

동의가 철회되거나 만료되면 신규 제출, 제출 패키지 신규 조회, 검증 API 신규 조회를 차단한다.

검증 실패, 권한 없음, 포인트 부족 응답은 포인트 차감과 병원 크레딧 적립 대상이 아니다.

## 핵심 정리

백엔드가 실제 업무 판단과 파일 제공을 담당하고, 체인코드는 그 판단의 근거와 결과를 변조하기 어렵게 남긴다.

프론트엔드는 사용자가 업무를 수행하는 화면이고, 백엔드는 권한과 데이터 흐름을 제어하는 실행 계층이며, 체인코드는 해시와 상태, 거래, 감사 이력을 고정하는 신뢰 계층이다.
