# PetChain DB 저장 테스트 가이드

> 24개 테이블에 데이터가 잘 들어가는지 단계별로 확인하기 위한 문서.
> 작성 기준: `develop` 브랜치, DB 초기화 직후 상태(시드만 들어간 상태).

---

## 0. 사전 준비

### 0-1. 실행 상태 확인
- Spring Boot 앱: `http://localhost:8080` 에서 실행 중이어야 함 (VSCode Run)
- MySQL: Windows 서비스 `MySQL84` 실행 중, DB명 `petchain`

### 0-2. DB 조회용 함수 (PowerShell에 한 번 등록)
```powershell
function q($sql){ & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -uroot -p1234 petchain -e $sql }
# 사용 예: q "SELECT * FROM users;"
```

### 0-3. 전체 테이블 행 수 한눈에 보기
```powershell
q "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA='petchain' ORDER BY TABLE_NAME;"
```
> `TABLE_ROWS`는 근사치라서 정확한 건 각 테이블 `SELECT COUNT(*)`로 확인.

### 0-4. 인증 방식
- API 엔드포인트는 로그인 후 받은 **`accessToken`** 을 `Authorization: Bearer <token>` 헤더로 전달.
- JWT 필터가 토큰에서 actorId / role / type 을 꺼내 처리함.
- 로그인 한 번 해두고 토큰을 변수에 담아 재사용:
```powershell
$login = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body '{"loginId":"hospital-major-kamc","password":"hospital1234"}'
$H = @{ Authorization = "Bearer $($login.accessToken)" }
```

---

## 전체 테이블 목록 (24개)

| 분류 | 테이블 |
|---|---|
| 시드 자동생성 | `users` `hospitals` `insurance_companies` `disease_codes` `treatment_codes` `point_balances` |
| 회원/인증 | `users` `guardians` `hospitals` `insurance_companies` `refresh_tokens` |
| 반려동물/진료 | `pets` `medical_records` `medical_record_diseases` `medical_record_treatments` `medical_record_files` |
| 동의/청구/검증 | `pet_insurance` `claim_packages` `verification_logs` |
| 포인트 | `point_balances` `point_transactions` |
| 커뮤니티 | `posts` `post_images` `post_likes` `post_comments` |
| 미구현 (저장 경로 없음) | `consent_history` `audit_logs` `nft_tokens` |

**권장 테스트 순서:** 1 → 2 → 3 → 6 → (4·5 혼합) (의존관계 때문에 순서 중요)
> ⚠️ 4번 검증(4-4)은 보험사 포인트가 있어야 성공하므로 **5-1 을 4-4 보다 먼저** 실행해야 한다.
> 실제 순서: `4-1 → 4-3 → 5-1 → 4-4 → 4-5`. 자세한 내용은 4번 섹션 머리말 참고.

---

## 1. 시드 데이터 확인 — 앱 재시작만 하면 채워짐

`DataInitializer`가 서버 기동 시 자동 생성. 별도 요청 불필요. **아래 행 수가 나오면 정상.**

```powershell
q "SELECT 'users' t,COUNT(*) c FROM users UNION ALL SELECT 'hospitals',COUNT(*) FROM hospitals UNION ALL SELECT 'insurance_companies',COUNT(*) FROM insurance_companies UNION ALL SELECT 'disease_codes',COUNT(*) FROM disease_codes UNION ALL SELECT 'treatment_codes',COUNT(*) FROM treatment_codes UNION ALL SELECT 'point_balances',COUNT(*) FROM point_balances;"
```

| 테이블 | 기대 행 수 | 내용 |
|---|---|---|
| `users` | 7 | admin 1 + 보험사 2 + 병원 4 |
| `hospitals` | 4 | kamc, haengbok, tunton, sarang |
| `insurance_companies` | 2 | samsung, db |
| `disease_codes` | 4 | 피부염/골절/관절염/슬개골탈구 |
| `treatment_codes` | 3 | X-ray/수술/약물처방 |
| `point_balances` | 6 | 보험사 2 + 병원 4 (잔액 0) |

**시드 계정 (로그인 ID / 비밀번호)**
- 관리자: `admin` / `admin1234`
- 보험사: `insurance-samsung`, `insurance-db` / `insurance1234`
- 병원: `hospital-major-kamc`, `hospital-coop-haengbok`, `hospital-coop-tunton`, `hospital-coop-sarang` / `hospital1234`

---

## 2. 회원 / 인증

### 2-1. 보호자(일반회원) 가입 → `users`, `guardians`
```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/auth/register/user -Method Post `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "name":"홍길동",
    "phone":"010-1234-5678",
    "email":"guardian1@test.com",
    "password":"test1234",
    "address":"서울시 강남구"
  }'
```
- 필수: `name`, `phone`, `email`(=로그인ID), `password`(8자 이상) / 선택: `address`
- 확인:
```powershell
q "SELECT id,login_id,member_type FROM users WHERE login_id='guardian1@test.com';"
q "SELECT * FROM guardians ORDER BY id DESC LIMIT 1;"
```

### 2-2. 병원 등록 신청 → `users`, `hospitals`
```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/auth/register/hospital -Method Post `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "name":"테스트동물병원",
    "businessNumber":"999-88-77777",
    "address":"서울시 송파구",
    "phone":"02-9999-9999",
    "fabricOrgId":"hospital-test-01",
    "adminEmail":"test-hospital@test.com",
    "password":"test1234"
  }'
```
- 필수: `name`, `businessNumber`, `fabricOrgId`(=로그인ID), `adminEmail`, `password`
- 확인: `q "SELECT * FROM hospitals ORDER BY id DESC LIMIT 1;"`

### 2-3. 보험사 등록 신청 → `users`, `insurance_companies`
```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/auth/register/insurance -Method Post `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "name":"테스트화재보험",
    "businessNumber":"111-22-33333",
    "fabricOrgId":"insurance-test-01",
    "adminEmail":"test-insurance@test.com",
    "password":"test1234"
  }'
```
- 확인: `q "SELECT * FROM insurance_companies ORDER BY id DESC LIMIT 1;"`

### 2-4. 로그인 → `refresh_tokens`
```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body '{"loginId":"guardian1@test.com","password":"test1234"}'
```
- 응답으로 `accessToken`, `refreshToken` 발급. refresh 토큰이 DB에 저장됨.
- 확인: `q "SELECT id,user_id,expires_at FROM refresh_tokens ORDER BY id DESC LIMIT 5;"`

> ⚠️ 병원/보험사 신규 가입 계정은 **관리자 승인 대기(PENDING)** 상태일 수 있음. 로그인이 막히면 시드 계정으로 테스트하거나 `users.status` 를 확인할 것.

---

## 3. 반려동물 & 진료기록

### 3-1. 반려동물 등록 → `pets`
보호자로 로그인한 토큰 필요.
```powershell
$g = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body '{"loginId":"guardian1@test.com","password":"test1234"}'
$GH = @{ Authorization = "Bearer $($g.accessToken)" }

Invoke-RestMethod -Uri http://localhost:8080/api/pets -Method Post -Headers $GH `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "name":"초코",
    "species":"dog",
    "breed":"푸들",
    "birthYear":2020,
    "gender":"male",
    "isNeutered":true
  }'
```
- 필수: `name`, `species`(dog|cat|rabbit|other) / 선택: `breed`, `birthYear`, `gender`, `isNeutered`
- 확인: `q "SELECT * FROM pets ORDER BY id DESC LIMIT 1;"`

### 3-2. 진료기록 생성 → `medical_records` (+ `medical_record_diseases`, `medical_record_treatments`, `medical_record_files`)
**multipart/form-data** 요청. 병원 토큰 필요. 파트 구성:
- `metadata` (JSON): `petId`, `date`, `cost`, `treatments[]`, `diseases[]`, `memo`
- `recordFile` (파일, 필수)
- `attachments` (파일, 선택, 여러 개)

```powershell
$h = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body '{"loginId":"hospital-major-kamc","password":"hospital1234"}'
$HH = @{ Authorization = "Bearer $($h.accessToken)" }

# 테스트용 더미 파일 2개 생성
Set-Content -Path .\record.json -Value '{"diagnosis":"피부염"}' -Encoding utf8
Set-Content -Path .\xray.txt -Value 'dummy x-ray' -Encoding utf8

$form = @{
  metadata    = '{"petId":"<펫ID>","date":"2026-05-19","cost":150000,"treatments":["VA-011"],"diseases":["KC-001"],"memo":"테스트 진료"}'
  recordFile  = Get-Item .\record.json
  attachments = Get-Item .\xray.txt
}
Invoke-RestMethod -Uri http://localhost:8080/api/records -Method Post -Headers $HH -Form $form
```
- `metadata.petId` 는 3-1에서 만든 펫 식별자로 교체.
- `diseases` 는 `disease_codes` 의 code (KC-001 등), `treatments` 는 `treatment_codes` 의 code (VA-011 등).
- 확인:
```powershell
q "SELECT * FROM medical_records ORDER BY id DESC LIMIT 1;"
q "SELECT * FROM medical_record_diseases ORDER BY id DESC LIMIT 5;"
q "SELECT * FROM medical_record_treatments ORDER BY id DESC LIMIT 5;"
q "SELECT * FROM medical_record_files ORDER BY id DESC LIMIT 5;"
```

---

## 4. 동의 · 보험금 청구 · 검증

> 3번에서 만든 `recordId` 와 보험사 식별자가 필요. 응답 JSON에서 ID를 확보해 다음 단계에 넣을 것.
>
> ⚠️ **이 섹션은 실행 순서가 중요하다.** 검증(4-4)은 보험사 포인트 잔액이 있어야 성공하므로
> **5-1(보험사 포인트 발행)을 먼저 실행**한 뒤 4-4를 호출해야 한다.
> 권장 순서: `4-1 → 4-3 → 5-1 → 4-4 → 4-5`
>
> ⚠️ **`consent_history` / `audit_logs` 는 현재 코드에 저장 경로가 없다.** 엔티티·리포지토리는
> 존재하지만 어떤 서비스도 `save` 를 호출하지 않으므로 이 두 테이블은 **항상 비어 있는 게 정상**이다.
> (`ConsentService` 는 `claim_packages` 를, 검증은 `verification_logs` 만 채운다.)

### 4-0. 보험사 로그인 토큰 준비
청구 제출(4-3)과 검증(4-4)은 **보험사 토큰**이 필요하다. 미리 발급해 둔다.
```powershell
$i = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body '{"loginId":"insurance-samsung","password":"insurance1234"}'
$IH = @{ Authorization = "Bearer $($i.accessToken)" }
```

### 4-1. 정보제공 동의 생성 → `claim_packages` (+ `pet_insurance`)
보호자 토큰(`$GH`) 필요. 엔드포인트 이름은 `consents` 지만 실제 저장 테이블은 `claim_packages` 다.
```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/consents -Method Post -Headers $GH `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "recordId":"<진료기록ID>",
    "insurerId":"<보험사ID>",
    "guardianId":"<보호자ID>"
  }'
```
- 응답의 `consentId`(= `claimId`) 를 다음 단계용으로 확보할 것.
- 확인:
```powershell
q "SELECT * FROM claim_packages ORDER BY id DESC LIMIT 1;"   -- consent_status='active' 로 생성됨
q "SELECT * FROM pet_insurance ORDER BY id DESC LIMIT 1;"
-- consent_history 는 비어 있음(미구현). 조회해도 0건이 정상.
```

### 4-2. 동의 철회 → `claim_packages.consent_status` 변경
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/consents/<동의ID>/revoke" -Method Post -Headers $GH `
  -ContentType 'application/json; charset=utf-8' -Body '{"reason":"테스트 철회"}'
```
- 확인: `q "SELECT claim_id, consent_status, claim_status FROM claim_packages ORDER BY id DESC LIMIT 1;"`
  `consent_status` 가 `revoked` 로 바뀐다. (`consent_history` 에는 이력이 남지 않음 — 미구현)
- ⚠️ 철회하면 4-3/4-4 가 막히므로, 청구·검증을 테스트하려면 4-2 는 건너뛰거나 마지막에 실행할 것.

### 4-3. 보험금 청구 제출 → `claim_packages` (+ `pet_insurance`)
⚠️ **보험사 토큰(`$IH`) 필요.** 코드(`SubmissionService`)가 인증 액터에서 보험사를 도출하고
보험사 권한(`requireInsurerScope`)을 요구하므로 병원 토큰으로 호출하면 권한 오류가 난다.
```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/submissions -Method Post -Headers $IH `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "recordId":"<진료기록ID>",
    "insurerId":"<보험사ID>"
  }'
```
- 활성 동의(4-1)가 없으면 `CONSENT_MISSING` 오류가 난다. 4-1 을 먼저 실행할 것.
- 확인: `q "SELECT * FROM claim_packages ORDER BY id DESC LIMIT 1;"`

### 4-4. 검증 실행 → `verification_logs`
⚠️ **보험사 토큰(`$IH`) 필요**, 그리고 **5-1 을 먼저 실행해 보험사 포인트 잔액을 확보**해야 한다
(잔액 0이면 `INSUFFICIENT_POINTS` 오류).
요청 body 는 **필수 필드가 많고**, `recordHash` 는 진료기록의 실제 해시와 일치해야 한다.

먼저 진료기록 해시를 조회한다:
```powershell
q "SELECT record_id, detail_data_hash FROM medical_records ORDER BY id DESC LIMIT 1;"
```
검증 요청 (`<청구ID>` = 4-1/4-3 의 `claimId`, path 와 body 의 `submissionId` 가 일치해야 함):
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/submissions/<청구ID>/verification" -Method Post -Headers $IH `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "submissionId":"<청구ID>",
    "recordId":"<진료기록ID>",
    "hospitalId":"<병원ID>",
    "insurerId":"<보험사ID>",
    "consentId":"<동의ID>",
    "recordHash":"<medical_records.detail_data_hash 값>",
    "requestedBy":"insurance-samsung",
    "requestedAt":"2026-05-19T00:00:00Z"
  }'
```
- 확인:
```powershell
q "SELECT * FROM verification_logs ORDER BY id DESC LIMIT 1;"   -- result='verified' 면 성공
q "SELECT * FROM point_transactions ORDER BY id DESC LIMIT 1;"  -- 검증 시 spend 거래 발생
-- audit_logs 는 비어 있음(미구현). 조회해도 0건이 정상.
```
> 참고: `/api/internal/submissions/<청구ID>/verify` 엔드포인트도 있지만, 이쪽은 DTO 응답만
> 반환하고 `verification_logs` 를 포함해 **DB에 아무것도 저장하지 않는다.** 테이블 채우기 테스트에는 쓰지 말 것.

### 4-5. 청구 심사 상태 변경 → `claim_packages` 상태
⚠️ **보험사 토큰(`$IH`) 필요** (코드가 `requireInsurerScope` 를 요구함).
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/submissions/<청구ID>/claim-status" -Method Post -Headers $IH `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "status":"APPROVED_BY_INSURER",
    "disclosable":true,
    "claimReferenceId":"CLM-TEST-001"
  }'
```
- 확인: `q "SELECT claim_id, claim_status, review_result FROM claim_packages ORDER BY id DESC LIMIT 1;"`

---

## 5. 포인트

### 5-1. 보험사에 포인트 발행 → `point_transactions` (+ `point_balances` 갱신)
관리자 토큰 필요.
```powershell
$a = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body '{"loginId":"admin","password":"admin1234"}'
$AH = @{ Authorization = "Bearer $($a.accessToken)" }

Invoke-RestMethod -Uri "http://localhost:8080/api/admin/insurers/<보험사ID>/points/issue" -Method Post -Headers $AH `
  -ContentType 'application/json; charset=utf-8' -Body '{"amount":100000,"reason":"테스트 발행"}'
```
- 확인:
```powershell
q "SELECT * FROM point_transactions ORDER BY id DESC LIMIT 1;"
q "SELECT * FROM point_balances;"
```

### 5-2. 포인트 거래 취소(reversal) → `point_transactions`
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/admin/points/<거래ID>/reversal" -Method Post -Headers $AH `
  -ContentType 'application/json; charset=utf-8' -Body '{"reason":"테스트 취소"}'
```

### 5-3. 병원 SaaS 크레딧 사용 → `point_transactions` (+ `point_balances`)
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/hospitals/<병원ID>/credits/spend/saas" -Method Post -Headers $HH `
  -ContentType 'application/json; charset=utf-8' -Body '{"featureCode":"AI_DIAGNOSIS","requestedBy":"hospital-major-kamc"}'
```

---

## 6. 커뮤니티

### 6-1. 게시글 작성 → `posts` (+ 이미지 포함 시 `post_images`)
```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/posts -Method Post -Headers $GH `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "content":"우리 강아지 자랑합니다",
    "petName":"초코",
    "petBreed":"푸들",
    "authorRegion":"서울"
  }'
```
- 필수: `content`(5000자 이내) / 선택: `petName`, `petBreed`, `authorRegion`, `imageData`(base64)
- 확인: `q "SELECT * FROM posts ORDER BY id DESC LIMIT 1;"`

### 6-2. 좋아요 → `post_likes`
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/posts/<게시글ID>/likes" -Method Post -Headers $GH
```
- 확인: `q "SELECT * FROM post_likes ORDER BY id DESC LIMIT 5;"`

### 6-3. 댓글 → `post_comments`
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/posts/<게시글ID>/comments" -Method Post -Headers $GH `
  -ContentType 'application/json; charset=utf-8' -Body '{"content":"귀엽네요!","parentCommentId":null}'
```
- `parentCommentId` 에 댓글ID를 넣으면 대댓글.
- 확인: `q "SELECT * FROM post_comments ORDER BY id DESC LIMIT 5;"`

### 6-4. 게시글 이미지 메타 저장 → `post_images`
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/posts/<게시글ID>/images" -Method Post -Headers $GH `
  -ContentType 'application/json; charset=utf-8' -Body '{
    "s3Key":"posts/test/img1.jpg",
    "originalFilename":"choco.jpg",
    "mimeType":"image/jpeg",
    "fileSize":204800
  }'
```
- 확인: `q "SELECT * FROM post_images ORDER BY id DESC LIMIT 5;"`

---

## 7. ⚠️ 미구현 테이블 — 테스트 불가 (항상 비어 있음)

아래 3개 테이블은 생성되지만 **현재 코드에 데이터를 저장하는 경로가 없다.**
엔티티와 리포지토리는 존재하지만 어떤 서비스도 `save` 를 호출하지 않으므로 항상 0건인 게 정상이다.

| 테이블 | 상태 | 비고 |
|---|---|---|
| `consent_history` | 미구현 | `ConsentService` 가 `claim_packages` 만 갱신. 동의 이력을 별도 저장하지 않음 |
| `audit_logs` | 미구현 | 검증 감사 응답은 `ApiDomainSupport` 가 동적으로 만든 DTO. DB 저장 없음 |
| `nft_tokens` | 미구현 | `NftToken` / `NftTokenRepository` 만 존재. NFT 발급 기능 자체가 미구현 |

→ 이 3개 테이블을 채우려면 **코드 수정이 필요**하다. 문서만으로는 테스트 불가.

---

## 부록: 자주 쓰는 확인 쿼리

```powershell
# 모든 테이블 정확한 행 수
q "SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema='petchain' AND c.table_name=t.table_name) cols FROM information_schema.tables t WHERE t.table_schema='petchain';"

# 특정 테이블 전체 조회
q "SELECT * FROM users;"

# DB 다시 초기화 (전체 삭제 후 빈 DB) — 이후 앱 재시작 필요
q "DROP DATABASE petchain; CREATE DATABASE petchain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> **DB 초기화 후에는 반드시 앱을 재시작**해야 테이블 + 시드가 다시 생성됨.

---

## 체크리스트

- [ ] 1. 시드 6종 (users/hospitals/insurance_companies/disease_codes/treatment_codes/point_balances)
- [ ] 2-1. guardians
- [ ] 2-2. hospitals (신규)
- [ ] 2-3. insurance_companies (신규)
- [ ] 2-4. refresh_tokens
- [ ] 3-1. pets
- [ ] 3-2. medical_records / medical_record_diseases / medical_record_treatments / medical_record_files
- [ ] 4-1. claim_packages / pet_insurance  (consent_history 는 미구현 — 항상 0건)
- [ ] 4-3. claim_packages  (보험사 토큰 필요)
- [ ] 4-4. verification_logs  (5-1 선행 필수 / audit_logs 는 미구현 — 항상 0건)
- [ ] 5-1. point_transactions / point_balances
- [ ] 6-1. posts
- [ ] 6-2. post_likes
- [ ] 6-3. post_comments
- [ ] 6-4. post_images
- [ ] 7. consent_history / audit_logs / nft_tokens — 미구현 (테스트 제외)
