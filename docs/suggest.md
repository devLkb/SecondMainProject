# PetChain MVP 저장 정보 제안

## 1. 전제와 판단

현재 문제는 “병원마다 이미 EMR/차트 원문을 갖고 있다”고 가정했을 때, 그 원문을 우리 서비스가 어디에서 받고, 어떤 정보만 추출해 보험사와 온체인 검증 흐름에 사용할 것인지이다.

MVP에서는 병원별 실제 EMR 연동을 구현하지 않고, **PetChain이 EMR-lite를 제공**하는 방식이 가장 적절하다.

- 병원은 PetChain EMR-lite에 진료기록 원문 또는 원문에 준하는 입력값을 등록한다.
- 원문과 첨부파일은 병원 측 DB/스토리지에 저장된 것으로 본다.
- PetChain 백엔드는 보험 청구와 검증에 필요한 최소 정보만 받아 제출 패키지를 만든다.
- Hyperledger Fabric 온체인에는 원문을 저장하지 않고, 해시·식별자·상태·검증 이력만 저장한다.
- 보험사는 제출 패키지의 `recordHash`와 `attachmentHashes`를 온체인/백엔드 검증값과 비교해 **제출 이후 동일성 및 변조 여부**를 확인한다.

즉, MVP의 핵심은 **원문 보관 시스템을 완성하는 것**이 아니라, **원문에서 보험 청구 검증에 필요한 최소 구조화 정보와 해시를 만드는 흐름을 증명하는 것**이다.

해시는 제출/등록 이후 같은 입력이 유지되었는지 확인하는 기술적 증거다. 병원이 처음 입력한 내용의 진실성, 실제 원문에서 정확히 추출되었는지, 허위 진료가 없었는지는 해시만으로 판단할 수 없다. 따라서 본 문서에서 말하는 검증은 “원문 내용의 참/거짓 판정”이 아니라 “제출 이후 변조 여부 검증”을 의미한다.

### 백엔드 구현 필드명 검토 기준

`이 문서`의 예시 필드는 백엔드 API DTO 기준의 camelCase 필드명에 맞춘다. DB 엔티티에는 `claimId`, `detailDataHash`, `totalCost`처럼 내부명이 따로 있지만, 외부 API에서는 각각 `submissionId`, `recordHash`, `treatmentCost` 또는 `treatmentCostKrw`로 노출될 수 있다.

검토한 주요 파일은 다음과 같다.

- `be/backend/src/main/java/com/blockchain/backend/petchainAPI/dto/record/RecordDtos.java`
- `be/backend/src/main/java/com/blockchain/backend/petchainAPI/dto/consent/ConsentDtos.java`
- `be/backend/src/main/java/com/blockchain/backend/petchainAPI/dto/submission/SubmissionDtos.java`
- `be/backend/src/main/java/com/blockchain/backend/petchainAPI/dto/verification/VerificationDtos.java`
- `be/backend/src/main/java/com/blockchain/backend/petchainAPI/dto/common/CommonDtos.java`
- `be/backend/src/main/java/com/blockchain/backend/petchainDB/entity/ClaimPackage.java`
- `be/backend/src/main/java/com/blockchain/backend/petchainDB/entity/MedicalRecord.java`

주의할 점은 현재 백엔드에는 `claimPackageHash` 또는 `claim_package_hash`라는 단일 제출 패키지 해시 필드가 아직 없다. 현재 구현은 `recordHash`와 `attachmentHashes`를 중심으로 무결성을 검증한다.

---

## 2. MVP 업로드/추출 흐름

```text
병원 EMR-lite 진료기록 등록
→ 병원 DB/스토리지에 원문·첨부 저장
→ 백엔드가 구조화 청구 데이터 생성
→ `recordHash`, `attachmentHashes` 계산
→ 보호자 동의 확인
→ 온체인에 `submissionId`, `recordId`, `hospitalId`, `insurerId`, `recordHash`, `attachmentHashes`, `consentSnapshotHash`, `auditLogHash`, 상태, `hashContractVersion` 저장
→ 보험사가 제출 패키지 수신 후 `recordHash`, `attachmentHashes` 재검증
```

MVP에서는 OCR, PDF 파싱, 병원별 EMR API 연동, 자동 진단명 매핑은 구현하지 않는다. 대신 EMR-lite 입력 폼에 필요한 값을 직접 입력하게 하여, “원문에서 필요한 정보가 추출되었다”고 가정한다.

### 해시 계약 v1(Hash Contract v1)

MVP에서 `recordHash`, `attachmentHashes`, `consentSnapshotHash`, `auditLogHash`는 서로 다른 입력을 해시한다. 각 해시의 입력과 canonical 규칙을 혼동하면 백엔드, 보험사, 체인코드가 같은 제출 건을 서로 다르게 검증할 수 있으므로 다음 계약을 고정한다.

#### 공통 canonical 규칙

해시 계약 v1의 모든 canonical JSON 입력은 아래 규칙을 공통으로 따른다. 이 규칙은 예시가 아니라 백엔드, 보험사, 체인코드가 공유해야 하는 고정 스펙이다.

| 항목 | 규칙 |
|---|---|
| 해시 알고리즘 | SHA-256 |
| 해시 표기 | `sha256:<lowercase 64 hex>`로 통일. 예: `sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| 인코딩 | UTF-8 |
| 유니코드 | 모든 문자열은 해시 입력 전 NFC로 정규화. 병원명, 보호자/반려동물 이름, `memo`처럼 한글이 들어갈 수 있는 필드는 예외 없음 |
| 객체 키 | 모든 객체 키를 유니코드 코드포인트 기준 오름차순으로 정렬 |
| 공백 | 해시 입력 문자열에서 불필요한 공백, 줄바꿈, 들여쓰기 제거 |
| `null` | 값이 `null`인 필드는 canonical payload에서 생략 |
| 날짜/시각 | ISO 8601 UTC 형식으로 고정. 예: `2026-05-19T10:00:00Z` |
| 배열 | 의미상 순서가 없는 배열은 안정 정렬. 코드 배열은 문자열 오름차순, 첨부 메타 배열은 `attachmentId` → `fileName` 순, 감사 로그 참조 배열은 `auditLogId` 순 |
| 숫자 | JSON 숫자 표기는 정수만 허용. 지수 표기, 소수점 표기, 문자열 금액 금지 |
| 금액 | 해시 입력 필드명은 `treatmentCostKrw` 하나로 고정하고 원화 정수 원 단위로 저장. 예: `150000` |
| 버전 | 모든 canonical payload는 `hashContractVersion: "hash-contract-v1"`을 포함한다. `schemaVersion`, `recordPayloadVersion`, `packageVersion`은 해시 입력 버전명으로 쓰지 않는다 |

#### `recordHash`

`recordHash = SHA-256(canonicalRecordPayload)`로 정의한다.

`canonicalRecordPayload`는 보험 청구 검증에 필요한 구조화 진료 데이터만 포함한 canonical JSON 문자열이다. 원문 PDF/이미지 파일 bytes가 아니라, 아래 고정 필드 목록과 공통 canonical 규칙을 적용한 JSON이 입력이다.

`canonicalRecordPayload`의 필드는 다음으로 고정한다.

| 필드 | 필수 여부 | 규칙 |
|---|---:|---|
| `hashContractVersion` | 필수 | 항상 `"hash-contract-v1"` |
| `recordId` | 필수 | 진료기록 식별자 |
| `recordVersion` | 필수 | 동일 `recordId`의 업무상 개정 번호. 해시 계약 버전이 아님 |
| `hospitalId` | 필수 | 병원 식별자 |
| `insurerId` | 필수 | 제출 대상 보험사 식별자 |
| `petId` | 필수 | 반려동물 식별자 |
| `treatmentDate` | 필수 | UTC ISO 8601 시각. 날짜만 입력받아도 `T00:00:00Z`로 정규화 |
| `treatmentCostKrw` | 필수 | 원화 정수 원 단위. `totalCostKrw` 별칭 사용 금지 |
| `treatmentCodes` | 필수 | 문자열 배열, NFC 정규화 후 오름차순 정렬 |
| `diagnosisCodes` | 필수 | 문자열 배열, NFC 정규화 후 오름차순 정렬 |
| `memo` | 선택 | 병원 자유기재 메모. 값이 있으면 NFC 정규화해 해시 입력에 포함 |
| `metadata` | 선택 | 해시 대상 메타데이터는 `source`, `externalRecordId` 키만 허용. 그 외 임의 키는 해시 입력에서 제외하거나 별도 버전에서 명시 |

예시는 다음과 같다.

```json
{
  "diagnosisCodes": ["DX-A01"],
  "hashContractVersion": "hash-contract-v1",
  "hospitalId": "HOSP-001",
  "insurerId": "INS-001",
  "memo": "식욕 저하로 내원",
  "metadata": {"externalRecordId": "EMR-9001", "source": "emr-lite"},
  "petId": "PET-001",
  "recordId": "REC-001",
  "recordVersion": 1,
  "treatmentCodes": ["TRT-001", "TRT-002"],
  "treatmentCostKrw": 150000,
  "treatmentDate": "2026-05-19T00:00:00Z"
}
```

#### 금액 타입

해시 입력에서는 `treatmentCostKrw`만 JSON 정수로 사용한다. `150000`, `150000.0`, `150000.00`처럼 같은 금액이 서로 다른 문자열로 직렬화되는 문제를 막기 위해 BigDecimal 표기는 canonical hash 입력에서 금지한다.

API가 `BigDecimal treatmentCost`를 받더라도 다음 규칙을 적용한다.

1. scale 0만 허용한다.
2. 음수와 소수 금액은 거부한다.
3. canonical hash 입력 전 원화 정수로 변환한다.
4. 변환된 필드명은 항상 `treatmentCostKrw`로 고정한다.

#### `attachmentHashes`

`attachmentHashes`는 canonical JSON이 아니라 각 첨부 파일 **원본 bytes**의 SHA-256이다. 파일명, MIME 타입, 업로드 시각, JSON 직렬화 결과가 아니라 실제 파일 bytes를 해시 입력으로 사용한다.

각 항목은 다음처럼 표현한다.

```json
{
  "attachmentId": "ATT-001",
  "fileName": "receipt.pdf",
  "sha256": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

온체인과 제출 패키지에서는 `attachmentHashes` 배열 자체의 순서도 안정적으로 정렬한다. 기본 정렬 기준은 `attachmentId` 오름차순이고, `attachmentId`가 없으면 `fileName` 오름차순을 사용한다.

#### `consentSnapshotHash`

`consentSnapshotHash = SHA-256(canonicalConsentSnapshotPayload)`로 정의한다. 동의 스냅샷 해시는 “제출 시점에 어떤 동의 상태를 근거로 보험사에 자료를 제공했는지”를 고정한다.

`canonicalConsentSnapshotPayload`의 필드는 다음으로 고정한다.

| 필드 | 필수 여부 | 규칙 |
|---|---:|---|
| `hashContractVersion` | 필수 | 항상 `"hash-contract-v1"` |
| `consentId` | 필수 | 동의 식별자. `submissionId`나 `claimId` 재사용 금지 |
| `recordId` | 필수 | 동의 대상 진료기록 |
| `guardianId` | 필수 | 보호자 식별자. 실명·전화번호는 넣지 않음 |
| `insurerId` | 필수 | 자료를 열람할 보험사 |
| `status` | 필수 | `ACTIVE`, `REVOKED`, `EXPIRED` 등 enum 값 |
| `consentedAt` | 필수 | UTC ISO 8601 |
| `expiresAt` | 선택 | UTC ISO 8601 |
| `revokedAt` | 선택 | UTC ISO 8601. 철회 전이면 생략 |

#### `auditLogHash`

`auditLogHash = SHA-256(canonicalAuditLogPayload)`로 정의한다. 감사 로그 해시는 오프체인 감사 로그 원문을 온체인 참조와 연결하기 위한 값이며, 온체인에는 민감한 설명문이나 병원 메모를 올리지 않는다.

`canonicalAuditLogPayload`의 필드는 다음으로 고정한다.

| 필드 | 필수 여부 | 규칙 |
|---|---:|---|
| `hashContractVersion` | 필수 | 항상 `"hash-contract-v1"` |
| `auditLogId` | 필수 | 감사 로그 식별자. `submissionId`나 `claimId` 재사용 금지 |
| `eventType` | 필수 | 예: `SUBMISSION_VIEWED`, `VERIFICATION_REQUESTED`, `VERIFICATION_FAILED` |
| `actorId` | 선택 | 행위자 식별자. 실명 대신 내부 식별자 사용 |
| `actorOrgId` | 선택 | 병원/보험사 조직 식별자 |
| `actorRole` | 선택 | `HOSPITAL`, `INSURER`, `SYSTEM` 등 enum 값 |
| `resourceType` | 필수 | 예: `submission`, `record`, `verification` |
| `resourceId` | 필수 | 대상 리소스 식별자 |
| `submissionId` | 선택 | 제출 관련 이벤트이면 포함 |
| `verificationId` | 선택 | 검증 관련 이벤트이면 포함 |
| `result` | 필수 | `SUCCESS`, `FAILED`, `BLOCKED` 등 enum 값 |
| `failureReasonCodes` | 선택 | 실패 시 enum 코드 배열, 문자열 오름차순 정렬 |
| `createdAt` | 필수 | UTC ISO 8601 |
| `metadataHash` | 선택 | 상세 metadata가 민감하거나 자유 JSON이면 원문 대신 별도 canonical metadata의 SHA-256만 포함 |

#### 실패 사유 코드

검증 실패 사유는 자유 문자열이 아니라 enum 코드로 고정한다. 온체인에는 `failureReasonCodes`만 저장하고, 민감한 설명 문장, 진단명, 처방 내용, 병원 메모는 오프체인 감사 로그에만 둔다.

MVP enum 코드는 다음과 같다.

- `CONSENT_MISSING`
- `CONSENT_REVOKED`
- `INSURER_MISMATCH`
- `RECORD_HASH_MISMATCH`
- `ATTACHMENT_HASH_MISMATCH`
- `INVALID_SUBMISSION_STATUS`
- `INSUFFICIENT_POINTS`
- `AUDIT_LOG_FAILED`
- `SYSTEM_ERROR`

기존 응답 필드가 `failureReasons`라면 값은 사람이 쓴 설명문이 아니라 위 enum 코드 배열이어야 한다. 신규 설계에서는 명시적으로 `failureReasonCodes`를 사용한다. 현재 백엔드는 `CommonDtos.AuditLogEntry.failureCode` 단수 필드와 `VerificationDtos`/`SubmissionDtos`/`CommonDtos.VerificationSummary`의 `failureReasons` 배열을 함께 쓰므로, 이 설계로 가려면 두 계열 DTO를 모두 `failureReasonCodes` 배열 중심으로 마이그레이션해야 한다.

---

## 3. 오프체인 MVP 필수 9개

오프체인은 병원 DB/스토리지와 PetChain 백엔드 DB를 포함한다. 실제 원문과 개인정보성 데이터는 반드시 오프체인에 둔다.

| 번호 | 정보 | 예시 필드 | 저장 위치 | 이유 |
|---|---|---|---|---|
| 1 | 진료기록 식별 정보 | `recordId`, `recordVersion`, `hospitalId`, `createdAt`, `updatedAt` | 병원 DB + PetChain 메타 DB | 진료기록을 청구·동의·검증 흐름과 연결하기 위한 기준 키 |
| 2 | 병원/작성자 정보 | `hospitalId`, `name`, `businessRegistrationNumber`, `fabricOrgId`, `veterinarianId` | 병원 DB + PetChain 메타 DB | 보험사가 해당 기록이 어떤 병원에서 생성되었는지 확인해야 함 |
| 3 | 보호자/반려동물 최소 식별 정보 | `guardianId`, `nameMasked`, `phoneMasked`, `petId`, `name`, `species`, `breed` | 병원 DB 중심, PetChain은 최소 식별자만 | 보험 청구 대상 반려동물과 보호자를 특정하기 위해 필요 |
| 4 | 진료 원문 및 구조화 진료 데이터 | `treatmentDate`, `treatmentCostKrw`, `treatmentCodes`, `diagnosisCodes`, `memo`, `metadata`, `attachments` | 병원 DB/스토리지 | 보험사가 심사할 실제 근거 데이터. 온체인 저장 금지 |
| 5 | 진료비/청구 증빙 정보 | `treatmentCostKrw`, `attachments`, `attachmentId`, `fileName`, `sha256`, `fileType` | 병원 DB/스토리지 | 보험금 심사에서 가장 직접적으로 필요한 금액 근거. 현재 DB 내부명 `totalCost`와 API/해시 입력명 `treatmentCostKrw`를 구분해야 함 |
| 6 | 보호자 동의 정보 | `consentId`, `recordId`, `insurerId`, `guardianId`, `status`, `validFrom`, `expiresAt`, `blockchainReference`, `auditLogId` | 병원 DB + PetChain 메타 DB | 보험사 제공의 정당성을 판단하는 핵심 근거. 동의가 없으면 보험사 제출을 막아야 함 |
| 7 | 제출 패키지 정보 | `submissionId`, `verificationId`, `recordId`, `packageAccessStatus`, `recordFileUrl`, `attachmentFileUrls`, `recordHash`, `attachmentHashes`, `verificationResult`, `consentSnapshot`, `consentSnapshotHash`, `hospital`, `guardian`, `pet`, `submittedAt`, `verifiedAt`, `auditLogId`, `auditLogHash` | PetChain 백엔드 DB/스토리지 | 어떤 자료가 보험사에 전달되었는지 재현 가능해야 함 |
| 8 | 해시 기준값 | `recordHash`, `attachmentHashes`, `consentSnapshotHash`, `auditLogHash`, `attachmentId`, `fileName`, `sha256`, `hashAlgorithm`, `hashContractVersion` | 병원 DB/스토리지 + PetChain 메타 DB | 온체인 검증값을 만들기 위한 오프체인 기준값 |
| 9 | 접근/감사 로그 | `auditLogId`, `eventType`, `actorId`, `actorOrgId`, `actorRole`, `resourceType`, `resourceId`, `submissionId`, `verificationId`, `result`, `failureReasonCodes`, `createdAt`, `metadata`, `auditLogHash` | PetChain 감사 로그 DB | 분쟁 발생 시 누가 어떤 자료에 접근했는지 확인 필요 |

### 진료코드/진단코드 저장 위치

진료코드, 처치코드, 진단코드 같은 코드는 **오프체인에 저장**한다. 이 값들은 보험 심사에는 필요하지만 진료 내용과 질병 정보를 추정할 수 있으므로 온체인에 직접 저장하지 않는다.

| 정보 | 저장 위치 | 설명 |
|---|---|---|
| 실제 진료코드/처치코드/진단코드 | 병원 DB/스토리지 또는 PetChain 백엔드 DB | EMR-lite 입력 폼에서 병원이 선택하거나 입력한 `treatmentCodes`, `diagnosisCodes` |
| 코드명/설명 | `TreatmentCode`, `DiseaseCode` 테이블 | `code`, `nameKo`, `nameEn`, `category`, `isActive`로 관리 |
| 보험사 제출/검증용 코드 | `DeidentifiedVerificationData` | 현재 백엔드는 `treatmentCodes`, `diagnosisCodes`, `treatmentDate`, `treatmentCost`, `hospitalId`, `insurerId`를 비식별 검증 데이터로 제공 |
| 코드 포함 구조화 데이터의 무결성 값 | 온체인 해시에 간접 반영 | 코드 원문을 온체인에 저장하지 않고, 코드가 포함된 `recordHash`만 저장. 첨부 파일 무결성은 별도 `attachmentHashes`로 검증 |

정리하면, 코드는 보험사에게 전달되는 오프체인 데이터에는 포함되지만, 블록체인에는 코드값 자체가 아니라 **코드가 포함된 데이터의 해시**만 올라간다. 현재 백엔드 기준으로 제출 패키지 응답 자체에는 `treatmentCodes`, `diagnosisCodes`가 직접 포함되지 않고, 검증 응답의 `deidentifiedVerificationData`에 포함된다.

### 오프체인 낮은 우선순위 정보

아래 항목은 실제 서비스에서는 유용하지만 MVP 구현에서는 “있다고 가정”하고 제외해도 된다.

- 병원별 EMR API 연동 설정값
- OCR/PDF 파싱 결과 원문 좌표
- 보험사별 약관 매핑 코드
- 외부 표준코드 자동 매핑 테이블
- 장기 보관/파기 정책 자동화 상태
- 수의사 면허 검증 상세 이력

---

## 4. 온체인 MVP 필수 8개

온체인은 검증과 상태 추적을 위한 최소 정보만 저장한다. 진료기록 원문, 보호자 개인정보, 반려동물 상세정보, 영수증 원문, 첨부파일 본문, 진단명·처방 내용·병원 메모는 저장하지 않는다.

| 번호 | 정보 | 예시 필드 | 이유 |
|---|---|---|---|
| 1 | 식별자 | `submissionId`, `recordId`, `verificationId` | 오프체인 제출 패키지와 온체인 검증 기록을 연결하는 키 |
| 2 | 조직 | `hospitalId`, `insurerId`, `fabricOrgId` | 어느 병원이 어느 보험사에 제출했는지 권한과 라우팅 확인 |
| 3 | 해시 | `recordHash`, `attachmentHashes`, `consentSnapshotHash`, `auditLogHash`, `hashAlgorithm`, `hashContractVersion` | 오프체인 진료 데이터·첨부·동의 스냅샷·감사 로그가 제출 시점 이후 바뀌지 않았는지 검증 |
| 4 | 트랜잭션 참조 | `blockchainReference`, `fabricTxId`, `verifyTxId` | Fabric 기록 참조와 원문/첨부 해시로 검증 흐름을 연결 |
| 5 | 동의/상태 | `consentId`, `consentSnapshotHash`, `status`, `claimStatus`, `submittedAt`, `updatedAt`, `verifiedAt` | 동의가 있는 제출인지, 현재 처리 상태가 무엇인지 확인 |
| 6 | 검증 결과 코드 | `verificationStatus`, `failureReasonCodes` | 검증 통과/실패와 실패 원인을 enum 코드로만 남김 |
| 7 | 감사 로그 참조/해시 | `auditLogId`, `auditLogHash` | 분쟁 시 오프체인 감사 로그와 온체인 기록을 연결 |
| 8 | 버전/스키마 정보 | `hashContractVersion` | canonical hash 규칙 변경을 구분. 체인코드 저장 구조 자체의 버전이 필요하면 해시 입력과 분리된 별도 운영 필드로 관리 |

### 온체인 낮은 우선순위 정보

아래 항목은 온체인에 올리지 않거나 MVP에서는 제외하는 것이 좋다.

- 보호자 이름, 전화번호, 주소
- 반려동물 이름, 상세 병력 원문
- 진단명·증상·처방 내용 원문
- 영수증 이미지, 진료기록부 PDF, 검사결과 파일
- 보험금 예상 지급액 또는 보험사 내부 심사 결과 상세
- 병원 내부 메모, 수의사 자유기재 내용
- 자유 서술형 실패 사유 또는 민감한 검증 설명

---

## 5. 최종 MVP 기준

### 오프체인 MVP 필수 9개

1. 진료기록 식별 정보
2. 병원/작성자 정보
3. 보호자/반려동물 최소 식별 정보
4. 진료 원문 및 구조화 진료 데이터
5. 진료비/청구 증빙 정보
6. 보호자 동의 정보
7. 제출 패키지 정보
8. 해시 기준값
9. 접근/감사 로그

### 온체인 MVP 필수 8개

1. 식별자
2. 조직
3. 해시
4. 트랜잭션 참조
5. 동의/상태
6. 검증 결과 코드
7. 감사 로그 참조/해시
8. 버전/스키마 정보

온체인의 목적은 보험 심사 데이터를 저장하는 것이 아니라, 오프체인 원문과 제출 자료가 제출 시점 이후 바뀌지 않았음을 검증하는 것이다. 현재 백엔드 구현 기준으로는 단일 `claimPackageHash` 대신 `recordHash`, `attachmentHashes`, `fabricTxId`/`verifyTxId` 계열 참조를 사용한다. 목표 설계에서는 여기에 `consentSnapshotHash`, `auditLogHash`, `hashContractVersion`을 추가해 해시 계약 범위를 명확히 한다.

---

## 6. 제출 패키지 정보의 의미

**제출 패키지 정보**란 병원이 특정 보험사에 보험금 청구 심사를 위해 전달하는 자료 묶음의 메타데이터와 실제 전달 데이터 목록을 말한다. 원문 진료기록 하나만 의미하는 것이 아니라, 보험사가 심사할 수 있도록 구성된 “제출용 묶음”이다.

제출 패키지에서 `submissionId`, `consentId`, `auditLogId`, `verificationId`, `recordId`는 각각 독립된 식별자다. 동의는 제출 전에 존재할 수 있으므로 `consentId`를 `submissionId`로 재사용하면 안 된다. 감사 로그는 한 제출에서 여러 건 생길 수 있으므로 `auditLogId`도 제출 식별자와 분리해야 한다.

현재 백엔드의 `SubmissionPackageResponse` 기준 제출 패키지는 다음 정보를 포함한다. 진료비와 진료/진단 코드는 제출 패키지 응답 본문이 아니라 검증 응답의 `deidentifiedVerificationData`에서 제공된다.

| 구분 | 필드 | 설명 |
|---|---|---|
| 제출 식별 정보 | `submissionId`, `recordId`, `verificationId` | 어떤 제출 건과 진료기록, 검증 결과를 연결하는지 표시 |
| 접근 상태 | `packageAccessStatus` | 현재 패키지를 보험사가 조회할 수 있는지 표시 |
| 원문/첨부 접근 정보 | `recordFileUrl`, `attachmentFileUrls` | `fileId`, `fileName`, `url`, `expiresAt`, `singleUse`를 포함한 단기 접근 URL |
| 무결성 정보 | `recordHash`, `attachmentHashes` | `attachmentHashes`는 `attachmentId`, `fileName`, `sha256`로 구성 |
| 검증 결과 | `verificationResult` | `verificationId`, `status`, `failureReasonCodes`, `verifiedAt` |
| 동의 스냅샷 | `consentSnapshot`, `consentSnapshotHash` | `consentId`, `status`, `guardianId`, `insurerId`, `consentedAt`, `expiresAt`, `revokedAt`와 그 canonical hash |
| 병원 최소 정보 | `hospital` | `hospitalId`, `name`, `businessRegistrationNumber` |
| 보호자 최소 정보 | `guardian` | `guardianId`, `nameMasked`, `phoneMasked` |
| 반려동물 최소 정보 | `pet` | `petId`, `name`, `species`, `breed` |
| 제출/검증 시각 | `submittedAt`, `verifiedAt` | 제출 생성 시각과 검증 완료 시각 |
| 감사 로그 | `auditLogId`, `auditLogHash` | 제출 패키지 조회/검증 관련 감사 로그 참조 |

정리하면, 목표 설계 기준 제출 패키지는 다음과 같은 JSON 형태로 생각하면 된다.

```json
{
  "submissionId": "SUB-001",
  "verificationId": "VER-001",
  "recordId": "REC-001",
  "packageAccessStatus": "AVAILABLE",
  "recordFileUrl": {
    "fileId": "FILE-010",
    "fileName": "record.pdf",
    "url": "/api/records/REC-001/files/FILE-010",
    "expiresAt": "2026-05-19T10:10:00Z",
    "singleUse": true
  },
  "attachmentFileUrls": [
    {
      "fileId": "FILE-011",
      "fileName": "receipt.pdf",
      "url": "/api/records/REC-001/files/FILE-011",
      "expiresAt": "2026-05-19T10:10:00Z",
      "singleUse": true
    }
  ],
  "recordHash": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "attachmentHashes": [
    {
      "attachmentId": "ATT-001",
      "fileName": "receipt.pdf",
      "sha256": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }
  ],
  "hashContractVersion": "hash-contract-v1",
  "verificationResult": {
    "verificationId": "VER-001",
    "status": "FAILED",
    "failureReasonCodes": ["RECORD_HASH_MISMATCH"],
    "verifiedAt": "2026-05-19T10:00:00Z"
  },
  "consentSnapshotHash": "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
  "consentSnapshot": {
    "consentId": "CON-001",
    "status": "ACTIVE",
    "guardianId": "GUARD-001",
    "insurerId": "INS-001",
    "consentedAt": "2026-05-19T09:50:00Z",
    "expiresAt": "2027-05-19T09:50:00Z"
  },
  "hospital": {
    "hospitalId": "HOSP-001",
    "name": "샘플동물병원",
    "businessRegistrationNumber": "123-45-67890"
  },
  "guardian": {
    "guardianId": "GUARD-001",
    "nameMasked": "김***",
    "phoneMasked": "010****1234"
  },
  "pet": {
    "petId": "PET-001",
    "name": "초코",
    "species": "dog",
    "breed": "poodle"
  },
  "submittedAt": "2026-05-19T09:55:00Z",
  "verifiedAt": "2026-05-19T10:00:00Z",
  "auditLogId": "AUD-001",
  "auditLogHash": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
}
```

현재 백엔드에는 `claimPackageHash`가 없으므로, MVP 문서에서는 제출 패키지 전체 해시가 아니라 `recordHash`와 `attachmentHashes`를 기준 무결성 값으로 본다. 나중에 제출 패키지 전체 JSON까지 고정해야 한다면 백엔드에 `claimPackageHash` 필드를 별도로 추가해야 한다.

---

## 7. 구현 방향 제안

MVP 구현은 다음처럼 단순화하는 것이 좋다.

1. 병원 화면에 EMR-lite 진료기록 등록 폼을 만든다.
2. 원문 파일 업로드는 선택 사항으로 두고, 필수 구조화 필드는 `petId`, `treatmentDate`, `treatmentCostKrw`, `treatmentCodes`, `diagnosisCodes`, `memo`, `metadata` 중심으로 받는다.
3. 백엔드는 구조화 입력값을 canonical JSON으로 정규화해 `recordHash`를 만들고, 첨부파일 원본 bytes 기준으로 `attachmentHashes`를 만든다.
4. 보호자 동의는 `consentId`, `recordId`, `insurerId`, `guardianId`, `status`, `validFrom`, `expiresAt` 기준으로 관리한다.
5. 보험사 제출은 API 응답에서 `submissionId`를 독립 식별자로 노출하고, `consentId`, `auditLogId`, `verificationId`, `recordId`와 재사용하지 않는다.
6. 체인코드에는 `submissionId`, `recordId`, `hospitalId`, `insurerId`, `recordHash`, `attachmentHashes`, `consentId`, `consentSnapshotHash`, `verificationStatus`, `failureReasonCodes`, `auditLogId`, `auditLogHash`, `hashContractVersion` 계열 값만 우선 저장한다.
7. 보험사는 제출 패키지의 `recordHash`, `attachmentHashes`, `consentSnapshotHash`, `consentSnapshot`, `auditLogHash`, `verificationResult`를 기준으로 제출 이후 변조 여부와 동의 상태를 검증한다.

### 현재 백엔드와 목표 설계 차이

현재 구현은 목표 설계를 완전히 충족하지 않는다. MVP 문서에서는 새로 만드는 올바른 설계를 기준으로 삼고, 아래 차이는 후속 구현 과제로 분리한다.

- 현재 `RecordService`는 구조화 JSON이 아니라 record file bytes를 해시한다. 목표 설계에서는 `recordHash = SHA-256(canonicalRecordPayload)`를 사용한다.
- 현재 DB는 `totalCost` 정수, DTO는 `BigDecimal treatmentCost`를 사용한다. 목표 설계에서는 canonical hash 입력 전 scale 0 원화 정수로 변환하고 해시 입력 필드명은 `treatmentCostKrw` 하나로 고정한다.
- 현재 일부 응답은 `claimId`를 `consentId`/`auditLogId`처럼 재사용한다. 목표 설계에서는 `submissionId`, `consentId`, `auditLogId`, `verificationId`, `recordId`를 모두 독립 식별자로 둔다.
- 현재 체인코드는 `sha256:<hex>` 형식을 요구하지만 백엔드 일부 해시는 raw hex일 수 있다. 목표 설계에서는 모든 해시 표기를 `sha256:<lowercase 64 hex>`로 통일한다.
- 현재 `AuditLog` 엔티티와 `AuditLogRepository`는 있으나, 제출 패키지 조회·동의 스냅샷·검증 결과를 위 해시 계약의 `auditLogId`/`auditLogHash`로 영속화하는 경로는 분리되어 있지 않다. `VerificationService`의 감사 응답도 실제 `audit_logs` 조회가 아니라 `VerificationLog`에서 `AuditLogEntry`를 파생한다. 목표 설계에서는 감사 로그 저장, canonical `auditLogHash` 계산, 온체인 참조 기록을 별도 구현 과제로 둔다.
- 현재 실패 사유는 `AuditLogEntry.failureCode` 단수와 `failureReasons` 배열이 섞여 있다. 목표 설계에서는 온체인·응답 DTO 모두 enum 배열 `failureReasonCodes`로 통일한다.
- 현재 `MedicalRecord.findingsEncrypted`와 `prescriptionEncrypted`에는 진단/처치 코드가 콤마 join 문자열로 저장될 수 있어 컬럼명과 달리 실제 암호화된 값이라고 전제하면 안 된다. 목표 설계에서는 민감 코드·메모의 암호화/마스킹 여부를 명시적으로 구현하고, 온체인에는 코드 원문을 저장하지 않는다.
