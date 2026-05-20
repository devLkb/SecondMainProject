# PetChain EMR-lite 구현 문서

> `suggest.md`(PetChain MVP 저장 정보 제안)를 토대로 구현한 EMR-lite 진료기록 등록 기능 정리.
> 작성 기준: `develop` 브랜치. 백엔드 `BUILD SUCCESSFUL`(컴파일 + 테스트 통과) 확인.

---

## 1. 개요

EMR-lite는 병원이 PetChain에 진료기록을 직접 등록하는 경량 입력 흐름이다. 병원별 실제 EMR 연동·OCR·PDF 파싱은 구현하지 않고, 입력 폼으로 받은 **구조화 진료 데이터에서 `recordHash`를 만드는 흐름**을 제공한다.

이번 구현의 핵심 변경은 다음 한 줄로 요약된다.

> `recordHash`를 **원문 파일 bytes의 해시 → canonicalRecordPayload(구조화 JSON)의 해시**로 전환했다.

부수 변경:

- 원문 파일(`recordFile`) 업로드를 **선택 사항**으로 전환.
- 모든 해시 표기를 `sha256:<lowercase 64 hex>`로 통일.
- `treatmentCostKrw`를 원화 정수로 검증·변환.
- 해시 재계산에 필요한 `recordVersion`을 진료기록에 영속화.

---

## 2. Hash Contract v1

`suggest.md` 2장 "해시 계약 v1"의 공통 canonical 규칙을 코드로 고정했다. 구현체는 [`HashContract.java`](be/backend/src/main/java/com/blockchain/backend/common/HashContract.java).

| 항목 | 규칙 |
|---|---|
| 알고리즘 | SHA-256 |
| 해시 표기 | `sha256:<lowercase 64 hex>` |
| 인코딩 | UTF-8 |
| 유니코드 | 모든 문자열 NFC 정규화 |
| 문자열 직렬화 | 필수 이스케이프(`"`, `\`, 제어문자)만 사용, 비ASCII는 리터럴 UTF-8 |
| 객체 키 | 코드포인트 오름차순 정렬(중첩 객체 재귀) |
| 공백 | 불필요한 공백·줄바꿈·들여쓰기 제거 |
| `null` / 빈 배열 | `null` 필드는 생략, 빈 배열 `[]`은 유지 |
| 숫자 | 정수만 허용(소수·지수·BigDecimal 금지) |

### API

```java
HashContract.VERSION                 // "hash-contract-v1"
HashContract.HASH_PREFIX             // "sha256:"
HashContract.canonicalJson(Object)   // payload 트리 → canonical JSON 문자열
HashContract.hashCanonical(Object)   // canonical payload → "sha256:<hex>"
HashContract.hashBytes(byte[])       // raw bytes → "sha256:<hex>" (첨부 파일용)
```

입력 트리는 `Map` / `List` / `String` / 정수(`Integer`·`Long` 등) / `Boolean`만 허용한다. 날짜·시각은 호출 측에서 ISO 8601 UTC 문자열로 정규화해 전달한다.

---

## 3. canonicalRecordPayload

`recordHash = HashContract.hashCanonical(canonicalRecordPayload)`. payload 필드는 다음으로 고정한다.

| 필드 | 필수 | 설명 |
|---|---|---|
| `hashContractVersion` | 필수 | 항상 `"hash-contract-v1"` |
| `recordId` | 필수 | 진료기록 식별자(`save` 전 미리 발급) |
| `recordVersion` | 필수 | 동일 `recordId`의 업무상 개정 번호. 생성 시 `1` |
| `hospitalId` | 필수 | 병원 식별자 |
| `petId` | 필수 | 반려동물 식별자 |
| `treatmentDate` | 필수 | UTC ISO 8601. 날짜만 입력해도 `T00:00:00Z`로 정규화 |
| `treatmentCostKrw` | 필수 | 원화 정수 원 단위 |
| `treatmentCodes` | 필수 | 문자열 배열, 오름차순 정렬. 진료 코드는 농림축산식품부 표준안을 따름 |
| `diagnosisCodes` | 필수 | 문자열 배열, 오름차순 정렬 |
| `insurerId` | 선택 | 제출 대상 보험사. 값이 있을 때만 포함 |
| `memo` | 선택 | 병원 자유기재 메모 |
| `metadata` | 선택 | `source`, `externalRecordId` 키만 허용 |

키 정렬·NFC·공백 제거·`null` 생략은 `HashContract`가 처리하므로, 서비스 코드는 필드만 채운다.

### 진료 코드 기준

`treatmentCodes`에 입력하는 진료 코드는 농림축산식품부의 표준안을 따른다. EMR-lite는 표준안에 정의된 코드 문자열을 canonical payload에 그대로 포함하고, 해시 안정성을 위해 오름차순 정렬한 뒤 `recordHash` 산출에 사용한다.

### 예시 payload

```json
{
  "diagnosisCodes": ["KC-001"],
  "hashContractVersion": "hash-contract-v1",
  "hospitalId": "1",
  "memo": "테스트 진료",
  "petId": "1",
  "recordId": "REC-2026-12345678",
  "recordVersion": 1,
  "treatmentCodes": ["VA-011"],
  "treatmentCostKrw": 150000,
  "treatmentDate": "2026-05-19T00:00:00Z"
}
```

---

## 4. API — `POST /api/records`

`multipart/form-data` 요청. 병원 토큰 필요.

| 파트 | 필수 | 설명 |
|---|---|---|
| `metadata` (JSON) | 필수 | `petId`, `date`, `cost`, `treatments[]`, `diseases[]`, `memo`, `insurerId`, `metadata` |
| `recordFile` (파일) | **선택** | 원문 파일. EMR-lite에서 선택 사항으로 전환 |
| `attachments` (파일) | 선택 | 첨부 파일, 여러 개 |

### 진료비 검증

`metadata.cost`(`BigDecimal`)는 다음을 만족해야 한다.

1. 음수 거부 → `treatmentCost: negative`
2. 소수 거부(scale 0만 허용) → `treatmentCost: not_integer`
3. `null`이면 `0` 처리

검증 통과 후 원화 정수 `treatmentCostKrw`로 변환되어 해시 입력과 `total_cost` 컬럼에 들어간다.

### 응답

```json
{
  "recordId": "REC-2026-12345678",
  "recordHash": "sha256:<64 hex>",
  "attachments": [
    { "attachmentId": "12", "fileName": "xray.txt", "sha256": "sha256:<64 hex>" }
  ]
}
```

---

## 5. 변경 파일

| 파일 | 변경 |
|---|---|
| [`common/HashContract.java`](be/backend/src/main/java/com/blockchain/backend/common/HashContract.java) | **신규.** Hash Contract v1 canonical JSON 직렬화 + SHA-256 |
| [`petchainDB/entity/MedicalRecord.java`](be/backend/src/main/java/com/blockchain/backend/petchainDB/entity/MedicalRecord.java) | `recordVersion`·`intendedInsurerId` 컬럼 추가, `detailDataHash` 64→80자 |
| [`petchainAPI/service/RecordService.java`](be/backend/src/main/java/com/blockchain/backend/petchainAPI/service/RecordService.java) | `recordHash`를 canonical payload 기반으로 산출, 파일 선택화, 진료비 검증, 첨부 해시 `sha256:` 통일 |
| [`petchainAPI/controller/RecordController.java`](be/backend/src/main/java/com/blockchain/backend/petchainAPI/controller/RecordController.java) | `recordFile` 파트를 `required = false`로 |

---

## 6. DB 스키마 변경 (`medical_records`)

| 컬럼 | 변경 | 비고 |
|---|---|---|
| `record_version` | 신규 `INT NOT NULL` | 생성 시 `1` |
| `intended_insurer_id` | 신규 `VARCHAR(40) NULL` | 해시 재계산용 보험사 식별자 |
| `detail_data_hash` | `VARCHAR(64)` → `VARCHAR(80)` | `sha256:` 접두사 + 64 hex 수용 |

⚠️ **빈 DB를 재초기화한 뒤 앱을 기동**할 것. 기존 행이 있는 DB에서는 `ddl-auto=update`가 `NOT NULL` 컬럼(`record_version`) 추가에 실패할 수 있다.

---

## 7. 테스트 방법

```powershell
# 병원 로그인
$h = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post `
  -ContentType 'application/json; charset=utf-8' `
  -Body '{"loginId":"hospital-major-kamc","password":"hospital1234"}'
$HH = @{ Authorization = "Bearer $($h.accessToken)" }

# 원문 파일 없이 등록 (EMR-lite: recordFile 선택)
$form = @{
  metadata = '{"petId":"<펫ID>","date":"2026-05-19","cost":150000,"treatments":["VA-011"],"diseases":["KC-001"],"memo":"테스트 진료"}'
}
Invoke-RestMethod -Uri http://localhost:8080/api/records -Method Post -Headers $HH -Form $form
```

확인:

```powershell
q "SELECT record_id, record_version, detail_data_hash, intended_insurer_id FROM medical_records ORDER BY id DESC LIMIT 1;"
```

- `detail_data_hash`가 `sha256:`로 시작하면 정상.
- 같은 입력으로 두 번 등록하면 `recordId`만 다르고, `recordId`/`recordVersion`이 payload에 들어가므로 해시는 서로 다르다(정상).

---

## 8. 이번 범위에 포함하지 않은 것

`suggest.md` 해시 계약 v1은 4개 해시를 정의하지만, EMR-lite(진료기록 등록)에서 구현한 것은 `recordHash`와 `attachmentHashes`다.

| 해시 | 상태 |
|---|---|
| `recordHash` | ✅ 구현 |
| `attachmentHashes` | ✅ 구현(`sha256:` 통일) |
| `consentSnapshotHash` | ❌ 미구현 — 동의 흐름 작업 |
| `auditLogHash` | ❌ 미구현 — 감사 로그 영속화 선행 필요 |

`consentSnapshotHash`·`auditLogHash`는 동의/감사 로그 저장 경로가 갖춰진 뒤 별도 작업으로 진행한다.
