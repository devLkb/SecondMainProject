# 프론트 ↔ 백엔드 API 계약 불일치 점검 (수정 전 정리)

> 점검일: 2026-05-18
> 증상: "프론트에서 추가했는데 DB에 저장이 안 됨 / 새로고침하면 사라짐"
> 결론: **DB(엔티티·리포지토리·서비스) 자체에는 버그 없음.** 원인은 프론트↔백엔드 요청 계약 불일치 + 프론트의 에러 무시.

---

## 0. 공통 메커니즘 — 프론트가 모든 API 에러를 삼킴

추가(create) 호출이 전부 아래 패턴이라, 백엔드가 400/403/500으로 거부해도 화면에는 성공처럼 보이고 DB에는 안 들어간다. 새로고침하면 사라진다.

```js
try { await apiFetch('/records', { ... }) }
catch { /* API failure: local state already updated */ }
```

해당 위치:
- `fe/petchain/src/pages/hospital/HospitalDash.jsx:222`
- `fe/petchain/src/pages/guardian/GuardianDash.jsx:682`
- `fe/petchain/src/pages/insurance/InsuranceDash.jsx:36`, `:95`

**고쳐야 할 것:** 최소한 개발 중에는 에러를 콘솔에 출력하거나 토스트로 노출해 실패를 보이게 할 것. (지금은 디버깅 자체가 불가능)

---

## 1. 🔴 진료기록 등록 — `POST /api/records` (확정 실패: 항상 400)

**프론트** `HospitalDash.jsx:210` 가 보내는 metadata JSON:
```
{ petId, diseases, treatments, cost, date, memo }
```

**백엔드** `RecordDtos.CreateRecordRequest` 가 요구하는 필드:
```
hospitalId(@NotBlank), guardianId(@NotBlank), petId(@NotBlank),
insurerId, treatmentDate(@NotNull @PastOrPresent), treatmentCost,
treatmentCodes, diagnosisCodes, metadata
```

| 백엔드 필수 필드 | 프론트 전송 | 문제 |
|---|---|---|
| `hospitalId` @NotBlank | 없음 | 검증 실패 → 400 |
| `guardianId` @NotBlank | 없음 | 검증 실패 → 400 |
| `petId` @NotBlank | `petId` ✅ | OK |
| `treatmentDate` @NotNull | `date` 라는 이름으로 전송 | 이름 불일치 → null → 400 |
| `treatmentCost` | `cost` 라는 이름으로 전송 | 이름 불일치 → 무시 |
| `diagnosisCodes` | `diseases` 라는 이름으로 전송 | 이름 불일치 → 무시 |
| `treatmentCodes` | `treatments` 라는 이름으로 전송 | 이름 불일치 → 무시 |
| (사용 안 함) | `memo` | 백엔드에 대응 필드 없음 |

**수정 방향 (택1):**
- (A) 프론트를 백엔드에 맞춤: 필드명을 `treatmentDate/treatmentCost/diagnosisCodes/treatmentCodes` 로 바꾸고, `hospitalId`(로그인 병원 식별자)·`guardianId`(조회된 환자의 보호자 식별자)를 추가 전송.
  - ⚠️ 선결 과제: 프론트가 환자 검색 시 그 펫의 **보호자 식별자**와 **로그인 병원 식별자**를 확보하고 있어야 함. 현재 화면 상태에 없으면 그 데이터부터 확보 필요.
- (B) 백엔드를 프론트에 맞춤: `CreateRecordRequest` 필드명을 프론트 형식으로 바꾸고, `hospitalId`는 인증 토큰(ApiActor)에서, `guardianId`는 `petId`로 역조회. → 백엔드만 고치면 되어 더 견고함.

---

## 2. 🔴 동의 생성 — `POST /api/consents` (필드명은 일치, 값이 틀림)

**프론트** `GuardianDash.jsx:680`:
```js
body: {
  recordId: c.recordId,
  insurerId: c.insurerId || localStorage.getItem('userId') || '1',
  guardianId: c.guardianId || localStorage.getItem('userId') || '1',
}
```
**백엔드** `ConsentDtos.CreateConsentRequest`: `{ recordId, insurerId, guardianId }` — **필드명은 일치**.

**문제 (값):**
- `insurerId` 폴백이 `localStorage userId` → 이건 로그인한 **보호자의 user id**지 보험사 식별자가 아님 → `insurerByExternalId()` 실패 → 400/404.
- `guardianId` 폴백도 마찬가지 의미 혼동(`userId`는 user.id이고, 백엔드는 guardian 식별자를 기대).
- `recordId`가 실제 존재하는 진료기록이어야 함 → 1번 때문에 진료기록 자체가 생성 안 되어 유효한 recordId가 없음.

**수정 방향:** 프론트가 `c.insurerId`/`c.guardianId`/`c.recordId`에 **실제 식별자**를 채우도록 보장(목록 조회 응답에서 받아와 보관). 폴백 `'1'`·`userId` 제거.

---

## 3. 🔴 청구 제출 — `POST /api/submissions` (연쇄 실패)

**프론트** `InsuranceDash.jsx:76`: `body: { recordId, insurerId }`
**백엔드** `SubmissionDtos.CreateSubmissionRequest`: `{ recordId(@NotBlank), insurerId(@NotBlank) }` — **필드명 일치**.

**문제:**
- `recordId`(`c.recordId`)가 실존 진료기록이어야 하는데 1번 때문에 진료기록이 DB에 없음 → `recordByRecordId()` 실패.
- `insurerId = localStorage userId` → 보험사 식별자 의미 확인 필요(`insurerByExternalId`가 db id/회원번호 중 무엇을 받는지에 맞춰야 함).

**수정 방향:** 1번 해결이 선행 조건. 그 후 `insurerId` 값 정합성 확인.

---

## 4. 🔴 검증 호출 — `POST /api/submissions/{id}/verification` (선행 의존)

**프론트** `InsuranceDash.jsx:79` 가 보내는 body는 `VerificationDtos.VerificationRequest`의 필드(`submissionId, recordId, hospitalId, insurerId, consentId, recordHash, requestedBy, requestedAt, petId, guardianId`)를 **구조상 모두 채워 보냄** → 형식은 OK.

**문제:**
- 선행 `POST /submissions`(3번)가 성공해야 `submissionId`를 얻는데 3번이 실패 → 검증도 실행 불가.
- 값 일부가 플레이스홀더(`hospitalId: '1'`, `recordHash: 'demo-record-hash'`) → 실제 검증 시 해시 불일치 등으로 실패 가능.

**수정 방향:** 1·3번 해결 후 실제 값으로 교체.

---

## 5. ✅ 정상 동작 확인된 것 (수정 불필요)

| 기능 | 엔드포인트 | 비고 |
|---|---|---|
| 동물 등록 | `POST /api/pets` | 프론트 `{name,species,breed,birthYear,gender,isNeutered}` ↔ `PetRegisterRequest` 필드명 일치 |
| 회원가입(보호자/병원/보험사) | `POST /api/auth/register/*` | 필드명 일치, AuthPage가 에러를 화면에 표시(삼키지 않음) |
| 로그인 | `POST /api/auth/login` | 정상 |
| 게시판 글/댓글 | `POST /api/posts`, `/api/posts/{id}/comments` | `PostService` 정상 구현 |
| 동의 철회 | `POST /api/consents/{id}/revoke` | `RevokeConsentRequest.reason` 선택값, 정상 |

---

## 6. 부수 이슈 (저장 실패와 별개지만 같이 정리)

### 6-1. 회원가입 거주지역이 저장 안 됨
`AuthPage.jsx:320`의 거주지역 `<select>`에 `value`/`onChange`가 없어 선택값이 상태에 안 들어감.
`handleGuardianSignup`도 `address`를 전송하지 않음. `UserRegisterRequest.address`는 optional이라 **가입은 되지만 거주지역 정보는 항상 유실**됨.
→ select를 상태에 연결하고 가입 요청 body에 `address` 추가.

### 6-2. PointBalance `@Version` 추가에 따른 기존 행 마이그레이션
이번 보안 수정에서 `PointBalance`에 `@Version`을 추가함. `ddl-auto=update`로 `version` 컬럼이 추가되면 **기존 행은 version=NULL**이 되고, 그 행을 UPDATE(포인트 발급/차감)할 때 `OptimisticLockException`이 날 수 있음.
→ 1회 실행 필요: `UPDATE point_balances SET version = 0 WHERE version IS NULL;`

---

## 7. 권장 수정 순서

1. **프론트 에러 노출** (0번) — 안 고치면 이후 검증 자체가 불가능.
2. **진료기록 등록** (1번) — 모든 후속 기능(동의·청구·검증)의 데이터 출발점.
3. **동의 생성** (2번) — 식별자 값 정합성.
4. **청구 제출 / 검증** (3·4번) — 1·2 해결 후 자동으로 풀리는 부분 확인.
5. 부수 이슈(6-1, 6-2) 정리.

> 핵심 결정 사항: 1번을 **프론트 수정(A)** 으로 갈지 **백엔드 수정(B)** 으로 갈지.
> 권장은 (B) — 백엔드에서 `hospitalId`를 인증정보로, `guardianId`를 `petId` 역조회로 채우면 프론트가 보낼 데이터가 줄어 계약이 단순해지고 깨질 여지가 적다.
