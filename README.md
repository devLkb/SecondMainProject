# PetChain

Hyperledger Fabric 기반 펫보험 진료기록 검증 인프라 서비스입니다.

진료 원문은 병원 측 DB에 보관하고, 블록체인에는 해시·동의 상태·검증 로그만 기록하여 병원의 데이터 통제권과 보험사의 무결성 검증 요구를 분리한 구조입니다.

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 개발 기간 | 2026.05.04 ~ 2026.05.23 (3주) |
| 팀 규모 | 5인 (백엔드 / 프론트엔드 / 블록체인 협업) |
| 담당 역할 | 백엔드 API 계약 설계 (Controller, Port, DTO, 오류 처리), Docker/AWS 배포 |
| 백엔드 | Java, Spring Boot |
| 프론트엔드 | React, Vite |
| 데이터베이스 | MySQL |
| 블록체인 | Hyperledger Fabric, Golang |
| 배포 | Docker, Docker Compose, AWS EC2 |

## 백엔드 아키텍처

### 레이어 구조

컨트롤러가 구체 Service가 아닌 Port 인터페이스에 의존하는 구조로 설계했습니다.

```
HTTP 요청
  │
  ▼
Controller        ← REST 엔드포인트 정의, 요청 검증 (내 담당)
  │
  ▼
Port 인터페이스    ← 유스케이스별 입출력 계약 (내 담당)
  │
  ▼
Service 구현체     ← 비즈니스 로직, JPA/블록체인 연동 (팀원 담당)
  │
  ▼
DTO / Error / Common (내 담당)
```

### 서비스 전체 흐름 (팀 공동)

```
[병원] 진료기록 등록 → [보호자] 제출 동의 → [보험사] 검증 요청 → 포인트 차감/크레딧 적립
```

## 내가 담당한 코드

API 계층의 계약(Controller, Port, DTO, 오류 처리)을 설계하고, 서비스 구현체는 팀원이 담당했습니다.

```
be/backend/src/main/java/com/blockchain/backend/petchainAPI/
├── controller/           ← 내 담당: REST 엔드포인트 정의
│   ├── RecordController.java
│   ├── ConsentController.java
│   ├── SubmissionController.java
│   ├── VerificationController.java
│   ├── InternalVerificationController.java
│   ├── PointController.java
│   └── AdminController.java
├── port/                 ← 내 담당: 유스케이스 인터페이스 (7개)
├── dto/                  ← 내 담당: 요청/응답 스키마, 상태 enum
├── error/                ← 내 담당: 전역 오류 처리
│   ├── ApiErrorCode.java
│   ├── ApiException.java
│   ├── ApiExceptionHandler.java
│   ├── ApiErrorResponse.java
│   └── TraceIds.java
├── security/             ← 내 담당: API 호출자 식별
└── service/              ← 팀원 담당: 비즈니스 로직 구현
```

## API 엔드포인트 (내가 정의한 계약)

### 진료기록 (Record)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/records` | 진료기록 등록 (멀티파트) |
| GET | `/api/records` | 진료기록 목록 조회 |
| GET | `/api/records/{recordId}` | 진료기록 상세 조회 |

### 동의 (Consent)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/consents` | 동의 생성 |
| GET | `/api/consents` | 동의 목록 조회 |
| GET | `/api/consents/{consentId}` | 동의 상세 조회 |
| POST | `/api/consents/{consentId}/revoke` | 동의 철회 |

### 제출/검증 (Submission + Verification)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/submissions` | 진료기록 제출 |
| GET | `/api/submissions/{submissionId}` | 제출 상세 조회 |
| GET | `/api/submissions/{submissionId}/package` | 검토 패키지 조회 |
| POST | `/api/submissions/{submissionId}/verification` | 검증 요청 |
| POST | `/api/submissions/{submissionId}/claim-status` | 심사 상태 갱신 |
| GET | `/api/verifications/{verificationId}` | 검증 결과 조회 |
| GET | `/api/verifications/{verificationId}/deidentified-data` | 비식별 데이터 조회 |
| GET | `/api/verifications/{verificationId}/audit` | 감사 로그 조회 |

### 포인트/크레딧 (Point)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/insurers/{insurerId}/points/balance` | 포인트 잔액 |
| GET | `/api/insurers/{insurerId}/points/transactions` | 거래 내역 |
| POST | `/api/insurers/{insurerId}/points/charge` | 포인트 충전 |
| POST | `/api/hospitals/{hospitalId}/credits/spend/saas` | 크레딧 차감 |
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
{ "errorCode": "CONSENT_REVOKED", "message": "...", "traceId": "abc-123" }
  → HTTP 409 Conflict
```

주요 에러 코드:

| 에러 코드 | HTTP 상태 | 설명 |
|-----------|-----------|------|
| `VALIDATION_FAILED` | 400 | 요청 검증 실패 |
| `RESOURCE_NOT_FOUND` | 404 | 리소스 없음 |
| `CONSENT_REVOKED` | 409 | 동의 철회 상태 |
| `INSUFFICIENT_POINTS` | 402 | 포인트 부족 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

## Trouble Shooting

**컨테이너 의존성 버전 불일치**

Docker Compose 환경에서 백엔드 실행 시 컨테이너 의존성 버전 불일치로 에러가 발생했습니다. 해당 의존성을 로컬에 직접 설치하지 않고 Docker 이미지로 관리하여 해결했습니다.

## 실행 방법

### Docker Compose (권장)

```bash
cp .env.example .env
docker compose up -d --build
```

### 로컬 실행

```bash
cd be/backend
./gradlew bootRun
```

상세 Docker 운영 가이드는 [`docker_guide.md`](docker_guide.md)를 참고해 주세요.
