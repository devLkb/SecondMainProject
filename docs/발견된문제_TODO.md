# 런타임 점검에서 발견된 문제 — 일괄 수정 완료

> 작성일: 2026-05-20
> 상황: 백엔드 기동 후 프론트에서 실데이터로 흐름 점검 + 2차 정적 전수 감사 결과
> **3차 일괄 수정 (2026-05-20):** TODO-2/3/4/5/6/7/8/10/11/12/13/14/15/16/17/19 적용 완료. 보류 항목: TODO-1, TODO-9-pre, TODO-18
> 2차 감사 범위: AuthPage·OAuth·JwtFilter·SecurityConfig·모든 controller/DTO/service · 모든 FE apiFetch 호출 (29건)

---

## 🔧 3차 일괄 수정 결과 요약 (2026-05-20)

| TODO | 항목 | 적용된 변경 |
|---|---|---|
| TODO-10 | `GET /flags` admin 가드 누락 | `FlagController.listFlags(ApiActor)` + `FlagService.listFlags(actor)` 에 `support.requireAdmin(actor)` 추가 |
| TODO-11 | `POST /flags` 보험사 actor 검증 누락 | `FlagService.createFlag` 에 `insurerByActor + requireInsurerScope` 강제. 신고자 id 는 인증된 보험사에서 도출 |
| TODO-13 | 동일 record PENDING 신고 중복 | `RecordFlagRepository.existsByRecordIdAndReportedByInsurerIdAndStatus` 추가 + service 에서 차단 |
| TODO-4·19 | Hospital `/consents` 권한 누설 | `ConsentApiPort.listConsents` 에 `hospitalId` 매개변수 추가, `me` 치환 + `claim.medicalRecord.hospital` 필터. FE 도 `hospitalId=me` 전송 |
| TODO-12 | Verification idempotency | `VerificationService.verifySubmission` 가 이미 verified 상태면 기존 성공 로그 반환. 포인트 추가 차감 없음 |
| TODO-14 | 회원가입 거주지역 누락 | `AuthPage` 에 `gAddress` state + body 에 `address` 포함 |
| TODO-16 | 로그인 가짜 폴백 제거 | `AuthPage.handleLogin` 의 `isNetworkError → onLogin(role)` 제거. 실패는 실패로 표시 |
| TODO-2 | 펫 카드 가짜 보험사 라벨 | 모든 매핑에서 `insurer:'DB손해보험'` → `insurer:''`. 카드는 `보험사 미등록` 표시 |
| TODO-15 | species 한/영 혼재 | FE 가 `dog/cat/rabbit` 영문 코드 전송. `SPECIES_LABEL` 추가, `speciesIcon` 양쪽 처리 |
| TODO-17 | 가짜 verificationId DB 오염 | FE 가 BE 응답 없으면 `verificationId=null`. flag 제출 시도 `VER-\d+` 정규식 통과한 값만 전송. BE 도 `isRealVerificationId` 가드 |
| TODO-3 | 검증 hospitalId 폴백 `'1'` | `hospitalId: c.hospitalId || ''` 로 정리 (BE 는 어차피 본문 무시) |
| TODO-5 | 검증 더블클릭 가드 | `verifyingRef = useRef(new Set())` 으로 record 단위 in-flight 차단 |
| TODO-7 | 검증 후 잔액 비동기화 | 검증 직후 `/insurers/me/points/balance` 재조회. BE idempotent 응답 시 `pointsCharged=0` 반영 |
| TODO-6 | Platform 신고 처리 후 미갱신 | `handleResolve` 가 성공 후 `/flags` 재조회로 다른 신고 상태까지 최신화 |
| TODO-8 | Hospital 환자 조회 로딩 상태 | `try/finally` 로 `setSearchLoading(false)` 보장 |

---

---

## ✅ 이미 수정 완료된 것 (참고용)

| # | 파일 | 내용 |
|---|---|---|
| F1 | [PetDetailResponse.java](be/backend/src/main/java/com/blockchain/backend/petchainLOGIN/dto/response/PetDetailResponse.java) · [PetService.java](be/backend/src/main/java/com/blockchain/backend/petchainLOGIN/service/PetService.java) | 병원 환자 조회 응답의 `petId` 가 numeric DB id 였음 → 펫번호(`A-xxxxxxxx`) 문자열로 변경 |
| F2 | [ConsentDtos.java](be/backend/src/main/java/com/blockchain/backend/petchainAPI/dto/consent/ConsentDtos.java) · [ConsentService.java](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/ConsentService.java) | `ConsentResponse` 에 `hospitalId`·`recordHash` 추가. 추가 안 했더니 보험사 검증이 항상 `hash_mismatch` 실패 |
| F3 | [InsuranceDash.jsx](fe/petchain/src/pages/insurance/InsuranceDash.jsx) · [HospitalDash.jsx](fe/petchain/src/pages/hospital/HospitalDash.jsx) | 위 두 필드를 state 에 보존해서 `handleVerify` 가 실제 해시를 보내도록 |
| F4 | [PetServiceTest.java](be/backend/src/test/java/com/blockchain/backend/petchainLOGIN/service/PetServiceTest.java) | 메인 `PetService` 가 의존성 2개 → 4개 로 진화했는데 테스트가 옛 시그니처로 호출해서 `compileTestJava` 실패. mock 2개 추가 |
| F5 | [PlatformDtos.java](be/backend/src/main/java/com/blockchain/backend/petchainAPI/dto/admin/PlatformDtos.java) · [PlatformAdminService.java](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/PlatformAdminService.java) · [Platform.jsx](fe/petchain/src/pages/platform/Platform.jsx) | "보험사별 포인트 현황" 표가 하드코딩이라 어느 보험사 발행이든 항상 `DB손해보험` 행에 표시됨. `OrgResponse.balance`/`usedPoints` 추가하고 표를 실데이터로 교체 |

---

## ⏳ 발견은 했는데 아직 안 고친 것

### TODO-1. Platform "+ Org 등록" 버튼 무동작
**위치:** [Platform.jsx:150](fe/petchain/src/pages/platform/Platform.jsx#L150)
```jsx
<button className="btn btn-primary">+ Org 등록</button>
```
- onClick 핸들러가 없음. 클릭해도 아무 일도 안 일어남.
- 백엔드에 admin 측 Org 생성 엔드포인트 없음 (병원·보험사는 회원가입 페이지에서 자가 가입하는 설계).
- **선택지:**
  - (a) 버튼 자체 제거 — 가장 간단. 설계와 일치
  - (b) 회원가입 페이지로 새 탭 열기
  - (c) admin 측 Org 생성 모달 + `POST /admin/orgs` 신규 BE 엔드포인트 + 임시 비밀번호 발급 로직 (큰 작업)

### TODO-2. 펫 등록 시 "DB손해보험" 가짜 라벨 자동 표시
**위치:** [GuardianDash.jsx:788](fe/petchain/src/pages/guardian/GuardianDash.jsx#L788) · [GuardianDash.jsx:792](fe/petchain/src/pages/guardian/GuardianDash.jsx#L792) · [GuardianDash.jsx:760](fe/petchain/src/pages/guardian/GuardianDash.jsx#L760)
```js
addPet({..., insurer:'DB손해보험'})
// 그리고
update({ pets:a.map(p=>({..., insurer:'DB손해보험' })) })
```
- 프론트가 모든 펫에 보험사 라벨을 'DB손해보험' 으로 하드코딩.
- DB `pet_insurance` 테이블은 비어 있음 — 실제로는 보험사 연결 안 됨.
- 사용자에게 "동물 등록하면 자동으로 보험사 등록되는 거 맞나?" 같은 오해 발생.
- **연관 한계:** 보호자 보험계약 등록 모달이 [프론트백_연결작업.md:112](프론트백_연결작업.md#L112) 에서 의도적으로 미연결로 둔 부분. 백엔드에 `POST /api/pets/{id}/insurance` 같은 엔드포인트가 아예 없음.
- **선택지:**
  - (a) 라벨을 `'미등록'` 으로 바꾸고, 보험사 연결은 "보호자가 동의 토글 ON 한 시점에 자동으로 `pet_insurance` 행 생성" 으로 유도 (현재 `ConsentService.createPolicy` 로직이 이미 그렇게 동작 중 — 펫 인슈어런스가 없으면 자동 생성)
  - (b) 펫 등록 모달에 보험사 select 추가 + 백엔드 신규 엔드포인트

### TODO-3. 검증 호출 시 hospitalId 폴백
**위치:** [InsuranceDash.jsx:130](fe/petchain/src/pages/insurance/InsuranceDash.jsx#L130)
```js
hospitalId: c.hospitalId || '1',
```
- F2 수정으로 `c.hospitalId` 는 이제 채워지지만, 폴백 `'1'` 이 여전히 코드에 남아 있음.
- 백엔드 `VerificationService` 가 hospitalId 본문 값을 무시하고 `claim.getMedicalRecord().getHospital()` 에서 직접 가져오기 때문에 동작은 정상.
- 코드 정리 차원에서 폴백을 빈 문자열로 바꾸거나 라인 자체 제거 가능.

### TODO-4. Hospital `/api/consents` 가 전체 동의를 받는다
**위치:** [HospitalDash.jsx:237](fe/petchain/src/pages/hospital/HospitalDash.jsx#L237)
- 병원 대시보드가 `GET /api/consents` (필터 없이) 호출 → 다른 병원의 동의까지 받아 옴.
- 백엔드에 `?hospitalId=me` 필터 분기가 없음 ([ConsentService.listConsents](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/ConsentService.java) 는 guardianId/insurerId 만 처리).
- 데모 환경에서는 데이터가 적어 문제 안 드러나지만 다 병원 환경에서는 권한 누설.
- **수정:** `ConsentService.listConsents` 에 hospitalId 매개변수 추가 → `me` 치환 → ClaimPackage 의 `medicalRecord.hospital.id` 와 매칭하는 필터.

### TODO-5. handleVerify 더블클릭 시 중복 제출
**위치:** [InsuranceDash.jsx:112](fe/petchain/src/pages/insurance/InsuranceDash.jsx#L112)
- API await 동안 검증 버튼이 disabled 안 됨 → 빠른 더블클릭 시 같은 record 가 두 번 검증돼 포인트 -2 차감 가능.
- `handleVerify` 진입 시 in-flight 가드 추가 (`useRef` 또는 disabled state).

### TODO-6. Platform 신고 목록 1회 로드 후 갱신 안 됨
**위치:** [Platform.jsx:29](fe/petchain/src/pages/platform/Platform.jsx#L29)
- 진입 시 `/flags` 1회 호출 후 새로고침 전엔 신규 신고 미반영.
- 처리 후 같은 페이지에 머물면 다른 행의 변경도 안 보임.
- **수정:** `handleResolve` 성공 후 `/flags` 재조회 (이번에 발행 후 `/admin/orgs` 재조회 패턴과 동일).

### TODO-7. 포인트 잔액 낙관적 갱신
**위치:** [InsuranceDash.jsx:155](fe/petchain/src/pages/insurance/InsuranceDash.jsx#L155)
- 검증 시 `state.ptBalance - 1` 로컬 즉시 차감, 백엔드 동기화는 다음 마운트 시.
- 같은 페이지에 머무르면 실잔액과 표시값 누적 어긋남 가능.
- **수정:** verification 응답에 잔액 포함 → 즉시 동기화, 또는 검증 후 `/insurers/me/points/balance` 재조회.

### TODO-8. Hospital 환자 조회 폴백 분기에서 setSearchLoading 누락
**위치:** [HospitalDash.jsx:298](fe/petchain/src/pages/hospital/HospitalDash.jsx#L298)
```js
const pet = state.pets.find(...)
if (!pet) { showToast(...); setSearchLoading(false); return }
const records = state.medicalRecords.filter(...)
setFoundPet({ ...pet, records })
// ↓ setSearchLoading(false) 누락 — 로컬 폴백 경로
```
- API 성공 경로는 `setSearchLoading` 을 다시 false 로 안 돌리고 그냥 return.
- 실제로는 API 호출이 동기 try/catch 이므로 다음 렌더링에서 자연스럽게 false 가 됨… 확인 필요.

### TODO-9-pre. 동의 생성 시 insurerId 폴백
**위치:** [GuardianDash.jsx:776](fe/petchain/src/pages/guardian/GuardianDash.jsx#L776)
```js
await apiFetch('/consents',{method:'POST',body:{
  recordId:c.recordId,
  insurerId:c.insurerId||localStorage.getItem('userId')||'1',
  guardianId:c.guardianId||localStorage.getItem('userId')||'1'
}})
```
- `c.insurerId` 가 없으면 보호자의 userId 를 보험사 id 로 보냄(!) → API 검증 통과 못 함.
- 신규 동의 생성 케이스는 도메인 설계 이슈로 [프론트백_연결작업.md:113](프론트백_연결작업.md#L113) 에 명시됨. 보류.

---

## 🆕 2차 전수 감사에서 추가로 발견된 것 (TODO-10 ~ TODO-19)

### TODO-10. **[보안]** `GET /api/flags` 가 인증만 되면 누구나 조회 가능
**위치:** [FlagController.java:35-38](be/backend/src/main/java/com/blockchain/backend/petchainAPI/controller/FlagController.java#L35) · [FlagService.java:60-65](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/FlagService.java#L60)
- `listFlags()` 메서드에 `requireAdmin(actor)` 호출 없음. 인증만 통과하면 보호자·병원·보험사 누구나 전체 이상신고 목록 조회 가능.
- 다른 admin 엔드포인트는 `support.requireAdmin(actor)` 가 있는데 이것만 누락.
- **수정:** `FlagService.listFlags()` 시작에 `support.requireAdmin(actor)` 추가하고 컨트롤러도 actor 인자 받도록.

### TODO-11. **[보안]** `POST /api/flags` 가 actor 검증 없음
**위치:** [FlagService.java:38-58](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/FlagService.java#L38)
- 보험사만 신고할 수 있어야 하는데 `createFlag` 에 actor type 체크 없음. 보호자 토큰으로도 신고 생성됨.
- `reportedByInsurerId` 에 보호자의 userId 가 들어가는 식의 데이터 오염 가능.
- **수정:** 시작에 `support.insurerByActor(actor)` 강제(없으면 throw).

### TODO-12. **[데이터 무결성]** 동일 record 에 verification 무한 반복 가능
**위치:** [VerificationService.java:36-66](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/VerificationService.java#L36) (실제 발견: 런타임 테스트에서 같은 claim_package_id=3 에 verification_log 2건 + point_transaction spend 2건 발생)
- 같은 claim_package 에 대해 verify 가 이미 성공한 경우에도 또 호출하면 포인트가 계속 차감되고 verification_log 가 또 쌓임.
- 가드 위치 둘 중 하나: (a) `claim.getClaimStatus().equals("verified")` 이면 idempotent 응답 반환, (b) DB unique 제약 추가.
- **수정 추천:** 기존 성공 verification_log 가 있으면 그것을 반환(빠른 가드).

### TODO-13. **[데이터 무결성]** 동일 record 에 PENDING 신고 중복 가능
**위치:** [FlagService.java:38-58](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/FlagService.java#L38) (런타임 발견)
- 같은 record_id + 같은 보험사가 PENDING 신고를 여러 번 만들 수 있음.
- **수정:** `recordFlagRepository.existsByRecordIdAndReportedByInsurerIdAndStatus(recordId, insurerId, "PENDING")` 으로 중복 차단.

### TODO-14. **[UX]** 보호자 회원가입 폼의 거주 지역이 BE 로 전송 안 됨
**위치:** [AuthPage.jsx:277-279](fe/petchain/src/pages/AuthPage.jsx#L277) · [AuthPage.jsx:117](fe/petchain/src/pages/AuthPage.jsx#L117)
- 회원가입 폼에 `<select>` 거주 지역이 있지만 useState 가 없고, `handleGuardianSignup` body 에 `address` 가 포함되지 않음.
- 결과: `guardians.address` 가 NULL 로 저장됨 → 보호자가 다시 "내 정보" 에서 지역 설정해야 함.
- **수정:** `gAddress` state 추가, 셀렉트 onChange, body 에 `address: gAddress` 포함. BE DTO `UserRegisterRequest.address` 는 이미 받을 준비 됨.

### TODO-15. **[데이터 일관성]** 펫 species 값에 한글/영문 혼재
**위치:** [GuardianDash.jsx:797](fe/petchain/src/pages/guardian/GuardianDash.jsx#L797) (등록 경로)
- 폼에서 `dog|cat|rabbit` 선택 → `sm` 매핑으로 **한글값** (`강아지|고양이|토끼`) 을 `POST /pets` 로 전송.
- BE `PetRegisterRequest.species` 주석은 "dog | cat | rabbit | other" 라고 명시 (영문 기대).
- 결과: DB `pets.species` 에 한글로 저장됨. 추후 영문 코드로 들어오는 외부 데이터와 섞이면 일관성 깨짐.
- **수정:** FE 가 영문 코드(`dog/cat/rabbit`) 그대로 보내고 화면 표시만 한글로. 또는 BE 에 enum 검증 추가.

### TODO-16. **[UX]** 로그인 실패 시 graceful fallback 으로 가짜 로그인됨
**위치:** [AuthPage.jsx:101-103](fe/petchain/src/pages/AuthPage.jsx#L101)
```js
} catch (e) {
  if (isNetworkError(e)) {
    onLogin(role)   // ← 네트워크 에러여도 그냥 로그인된 척
  }
```
- 백엔드 다운 / 네트워크 끊김 → FE 가 "로그인 성공한 척" 하고 대시보드로 이동. 사용자는 왜 데이터가 안 나오는지 알 수 없음.
- 데모 편의용으로 보이지만 실제로는 혼란 큼. 토스트로 "오프라인 모드" 같은 명시 표시 권장.

### TODO-17. **[데이터 정확성]** Insurance FE 의 가짜 verificationId 생성
**위치:** [InsuranceDash.jsx:146](fe/petchain/src/pages/insurance/InsuranceDash.jsx#L146)
```js
verificationId: verificationId || `VER-${crypto.randomUUID().slice(0,8).toUpperCase()}`,
```
- BE 검증 실패 시 로컬 폴백으로 가짜 `VER-XXXXXXXX` 생성. 이후 이 가짜 id 가 `handleFlag` → `flagModal.verificationId` → `POST /flags` 의 `verificationId` 필드로 DB 에 들어감.
- DB `record_flags.verification_id` 컬럼에 매핑되는 실제 verification_logs 행이 없는 죽은 참조.
- **수정:** BE 실패 시 verificationId 를 보내지 않거나 null 로 두기.

### TODO-18. **[코드 클린업]** Hospital `handleSubmitRecord` 의 dummy recordFile 제거 가능
**위치:** [HospitalDash.jsx](fe/petchain/src/pages/hospital/HospitalDash.jsx) — 첨부 파일 기능 추가 이후
- 첨부 파일 picker 추가하면서 `recordFile` 더미 Blob 전송은 제거했음. ✅ 이미 처리됨.
- 다만 BE 의 `medical_record_files` 에 attachments 가 들어갈 때 `file_type` 이 'other' 로 고정됨 ([RecordService.java:111](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/RecordService.java#L111)). UI 가 영수증·X-RAY·초음파를 구분해서 보내면 더 좋음. 보류 가능.

### TODO-19. **[보안/스코프]** ConsentService.listConsents 에 hospitalId 필터 부재
**위치:** [ConsentService.java:57-67](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/ConsentService.java#L57)
- 메서드 시그니처에 hospitalId 가 없음. 병원이 `/consents` 호출 시 ALL 동의 반환. (TODO-4 와 동일 이슈 — 강조 차원에서 중복 등재 X, TODO-4 참고).

---

## ✅ 정적 감사에서 "이상 없음" 확인된 부분

| 영역 | 확인 결과 |
|---|---|
| 모든 controller 의 RequestMapping 경로 | `{"", "/api"}` 더블 매핑으로 FE 의 `/api` prefix 와 일치 |
| `ApiResponse<T>` 자동 언래핑 | `apiFetch` 가 `data+traceId` 쌍을 감지해서 data 로 풀어줌. raw 응답(Pet/Flag/Platform admin) 도 통과 ✓ |
| `@JsonIgnoreProperties(ignoreUnknown=false)` 5개 DTO | FE 보내는 body 가 모두 DTO 필드와 정확히 일치 (CreateSubmission, Verification, ClaimStatus, SpendSaasCredits, CreatePostRequest 는 ignoreUnknown=true) ✓ |
| JwtAuthFilter + ApiActorArgumentResolver | 헤더 fallback 까지 정상. 익명 actor 도 안전하게 처리 ✓ |
| OAuth callback → FE URL 파라미터 → localStorage | `App.jsx initFromUrl` 가 정상 처리, 에러 케이스도 토스트 표시 ✓ |
| ClaimReviewStatus enum 매핑 | FE 가 보내는 `APPROVED_BY_INSURER`/`REJECTED_BY_INSURER` 둘 다 enum 값에 존재 ✓ |
| FlagDtos REASON_LABELS | FE FLAG_REASONS 6개 코드와 정확히 일치 ✓ |
| RESOLVE_OPTIONS (Platform) | FE 라벨만 있고 BE 는 resolveCode 문자열을 그대로 저장 — 매핑 누락 없음 ✓ |
| `me` 식별자 치환 | guardianId/insurerId/hospitalId 모두 BE service 에서 `me` 처리 분기 있음 ✓ |
| CORS PATCH 메서드 | SecurityConfig 에 추가되어 있음 ✓ |

---

## 🔄 수정 우선순위 (재정렬)

| 우선순위 | 항목 | 이유 |
|---|---|---|
| 🔴 1 | TODO-10 (`GET /flags` admin 가드) | **보안 — 권한 누설**. 1줄 추가로 해결 |
| 🔴 2 | TODO-11 (`POST /flags` 보험사 actor 강제) | **보안 — 위조 신고 방지** |
| 🔴 3 | TODO-4·19 (Hospital `/consents` 스코프) | **보안 — 권한 누설**. 새 hospitalId 매개변수 추가 필요 |
| 🟠 4 | TODO-12 (verification idempotency) | 데이터 무결성 — 포인트 과다 차감 가능 |
| 🟠 5 | TODO-13 (flag 중복 차단) | 데이터 무결성 |
| 🟡 6 | TODO-14 (회원가입 지역 누락) | UX 큼 — 1줄 추가 |
| 🟡 7 | TODO-2 (펫 카드 가짜 보험사) | UX 혼동 |
| 🟡 8 | TODO-17 (가짜 verificationId DB 오염) | 데이터 정확성 |
| 🟢 9 | TODO-15 (species 한/영 혼재) | 일관성 — 외부 연동 시 문제 |
| 🟢 10 | TODO-1, TODO-6, TODO-7, TODO-16 | UX |
| 🟢 11 | TODO-3, TODO-5, TODO-8, TODO-9-pre, TODO-18 | 클린업 |
