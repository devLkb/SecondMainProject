# PetChain

Hyperledger Fabric 기반 펫보험 진료기록 검증 인프라 서비스입니다.

진료 원문은 병원 측 DB에 보관하고, 블록체인에는 해시·동의 상태·검증 로그만 기록하여 병원의 데이터 통제권과 보험사의 무결성 검증 요구를 분리한 구조입니다.

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 개발 기간 | 2026.05.04 ~ 2026.05.23 (3주) |
| 팀 규모 | 5인 (백엔드 / 프론트엔드 / 블록체인 협업) |
| 담당 역할 | 백엔드 API 계층 설계 및 구현, Docker/AWS 배포 |
| 백엔드 | Java, Spring Boot |
| 프론트엔드 | React, Vite |
| 데이터베이스 | MySQL |
| 블록체인 | Hyperledger Fabric, Golang |
| 배포 | Docker, Docker Compose, AWS EC2 |

## 백엔드 아키텍처

### 레이어 구조

컨트롤러가 구체 Service가 아닌 Port 인터페이스에 의존하는 구조로 설계하여, 테스트나 구현에서 Port 구현체를 교체할 수 있도록 분리했습니다.

```
HTTP 요청
  │
  ▼
Controller        ← REST 엔드포인트, 요청 검증, ApiActor 주입
  │
  ▼
Port 인터페이스    ← 유스케이스별 입출력 계약
  │
  ▼
Service 구현체     ← 비즈니스 로직, JPA/블록체인 연동
  │
  ▼
DTO / Error / Common
```

### 핵심 비즈니스 흐름

```
[병원] 진료기록 등록 (파일 업로드 + SHA-256 해시 생성)
  │
  ▼
[보호자] 진료기록 제출 동의 (recordId + insurerId 기반)
  │
  ▼
[보험사] 제출 요청 → 검증 요청 (Idempotency-Key 지원)
  │
  ├─ 해시 비교로 변조 여부 검증
  ├─ 검증 결과·비식별 데이터·감사 로그 조회
  └─ 포인트 차감 / 병원 크레딧 적립
```

## 내가 담당한 코드

API 계층 전체(`petchainAPI` 패키지)를 설계하고 핵심 모듈을 구현했습니다.

```
be/backend/src/main/java/com/blockchain/backend/petchainAPI/
├── controller/
│   ├── RecordController.java              ← 진료기록 등록/조회
│   ├── ConsentController.java             ← 동의 생성/조회/철회
│   ├── SubmissionController.java          ← 제출/검증 요청/보험금 심사
│   ├── VerificationController.java        ← 검증 결과/비식별 데이터/감사 로그
│   ├── InternalVerificationController.java ← 내부 검증 (강제/재시도)
│   ├── PointController.java               ← 포인트/크레딧 조회·충전·차감
│   └── AdminController.java               ← 관리자 포인트 발급/취소
├── port/                                   ← 유스케이스 인터페이스 (7개)
├── service/                                ← Port 구현체
├── dto/
│   ├── common/     ← 공통 응답 조각, 상태 enum
│   ├── record/     ├── consent/     ├── submission/
│   ├── verification/    ├── point/     └── admin/
├── error/
│   ├── ApiErrorCode.java          ← 도메인 에러 코드 ↔ HTTP 상태 매핑
│   ├── ApiException.java          ← 커스텀 런타임 예외
│   ├── ApiExceptionHandler.java   ← @RestControllerAdvice 전역 예외 처리
│   ├── ApiErrorResponse.java      ← 통일된 에러 응답 포맷
│   └── TraceIds.java              ← 요청별 trace ID 추출
└── security/                       ← 별도 팀원이 구현한 JWT 인증 위에서 동작
```

> 커뮤니티(Post), 신고(Flag), 플랫폼 관리(PlatformAdmin), 파일 업로드(FileUpload) 컨트롤러는 다른 팀원이 담당했습니다.

## API 명세

### 진료기록 (Record)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/records` | 진료기록 등록 (멀티파트 파일 업로드) |
| GET | `/api/records` | 진료기록 목록 조회 |
| GET | `/api/records/{recordId}` | 진료기록 상세 조회 |

### 동의 (Consent)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/consents` | 동의 생성 (보호자 → 보험사) |
| GET | `/api/consents` | 동의 목록 조회 (필터: recordId, guardianId, insurerId) |
| GET | `/api/consents/{consentId}` | 동의 상세 조회 |
| POST | `/api/consents/{consentId}/revoke` | 동의 철회 |

### 제출/검증 (Submission + Verification)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/submissions` | 진료기록 제출 (보험사 검토 대상) |
| GET | `/api/submissions/{submissionId}` | 제출 상세 조회 |
| GET | `/api/submissions/{submissionId}/package` | 검토 패키지 조회 (서명 URL, 해시, 동의 스냅샷) |
| POST | `/api/submissions/{submissionId}/verification` | 검증 요청 (Idempotency-Key 지원) |
| POST | `/api/submissions/{submissionId}/claim-status` | 보험금 심사 상태 갱신 |
| GET | `/api/verifications/{verificationId}` | 검증 결과 조회 |
| GET | `/api/verifications/{verificationId}/deidentified-data` | 비식별 데이터 조회 |
| GET | `/api/verifications/{verificationId}/audit` | 감사 로그 조회 |

### 포인트/크레딧 (Point)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/insurers/{insurerId}/points/balance` | 보험사 포인트 잔액 |
| GET | `/api/insurers/{insurerId}/points/transactions` | 보험사 포인트 거래 내역 |
| POST | `/api/insurers/{insurerId}/points/charge` | 보험사 포인트 충전 |
| POST | `/api/hospitals/{hospitalId}/credits/spend/saas` | 병원 SaaS 크레딧 차감 |
| POST | `/api/admin/insurers/{insurerId}/points/issue` | 관리자 포인트 발급 |
| POST | `/api/admin/points/{transactionId}/reversal` | 관리자 거래 취소 |

## 오류 처리 구조

컨트롤러마다 try-catch를 분산시키지 않고, 전역 예외 핸들러에서 통일된 응답 포맷으로 변환합니다.

```
서비스에서 throw new ApiException(ApiErrorCode.CONSENT_REVOKED, "동의가 철회되었습니다")
  │
  ▼
ApiExceptionHandler (@RestControllerAdvice)
  │
  ▼
{
  "errorCode": "CONSENT_REVOKED",
  "message": "동의가 철회되었습니다",
  "traceId": "abc-123",
  "details": {}
}
  → HTTP 409 Conflict
```

주요 에러 코드 예시:

| 에러 코드 | HTTP 상태 | 설명 |
|-----------|-----------|------|
| `CONSENT_REVOKED` | 409 | 동의 철회 상태 |
| `INSUFFICIENT_POINTS` | 402 | 포인트 부족 |
| `RECORD_HASH_MISMATCH` | 409 | 진료기록 해시 불일치 (변조 의심) |
| `SUBMISSION_NOT_FOUND` | 404 | 제출 건 없음 |
| `VALIDATION_FAILED` | 400 | 요청 검증 실패 |

## Trouble Shooting

**컨테이너 의존성 버전 불일치**

Docker Compose 환경에서 백엔드 실행 시 컨테이너 의존성 버전 불일치로 에러가 발생했습니다. 해당 의존성을 로컬에 직접 설치하지 않고 Docker 이미지로 관리하여 해결했습니다. 서버 환경 오염을 방지하고 Docker 도입 취지에 부합하는 방식으로 처리했습니다.

## 실행 방법

### Docker Compose (권장)

```bash
cp .env.example .env
# .env에 DB 비밀번호, API 키 등 설정
docker compose up -d --build
```

### 로컬 실행

```bash
cd be/backend
./gradlew bootRun
```

상세 Docker 운영 가이드는 [`docker_guide.md`](docker_guide.md)를 참고해 주세요.
