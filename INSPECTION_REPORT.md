# 백엔드 전체 점검 결과 보고서

> 점검 기준일: 2026-05-17  
> 점검 범위: `be/backend/src/main/java/` 전체 Java 파일 (총 96개)  
> 프론트엔드 제외

---

## 점검 영역별 결과 요약

| 영역 | 파일 수 | 상태 |
|------|---------|------|
| 엔티티 (Entity) | 23개 | ✅ 이상 없음 |
| 레포지토리 (Repository) | 18개 | ✅ 이상 없음 |
| 서비스 (Service) | 10개 | ⚠️ 버그 수정 / 미구현 존재 |
| 컨트롤러 (Controller) | 13개 | 🔴 버그 수정 완료 |
| DTO | 12개 | ✅ 이상 없음 |
| 보안/필터 (Security) | 5개 | ✅ 이상 없음 |
| OAuth | 7개 | 🔴 버그 수정 완료 |
| 설정/공통 (Config) | 8개 | ✅ 이상 없음 |

---

## 발견된 버그 전체 목록 (발견 순서)

### 🔴 버그 1 — ID 생성기 충돌 위험
**파일:** `common/IdentifierGenerator.java`  
**심각도:** 높음  
**상태:** ✅ 수정 완료

`generateRecordId()`, `generateClaimId()`의 랜덤 숫자가 5자리(최대 100,000가지)로,  
레코드/청구 누적 시 중복 ID 충돌 확률이 급격히 상승.

```java
// Before: 5자리 → 100,000가지
"REC-" + Year.now().getValue() + "-" + digits(5)

// After: 8자리 → 100,000,000가지
"REC-" + Year.now().getValue() + "-" + digits(8)
```

---

### 🔴 버그 2 — DB 컬럼 길이 부족
**파일:** `entity/MedicalRecord.java`, `entity/ClaimPackage.java`, `entity/NftToken.java`  
**심각도:** 중간  
**상태:** ✅ 수정 완료

ID 길이 증가 후 `record_id`, `claim_id` 컬럼 길이(30)가 새 형식(`REC-2026-12345678` = 18자 + 여유)에 부족.  
30 → 40으로 확장.

---

### 🔴 버그 3 — 로그인 응답 memberNumber 항상 null
**파일:** `petchainLOGIN/service/AuthService.java`  
**심각도:** 치명  
**상태:** ✅ 수정 완료

`login()` 메서드에 `memberNumber` 조회 로직이 없어 JWT 응답의 `memberNumber`가 항상 null 반환.  
`resolveMemberNumber(User)` 메서드를 추가해 memberType별로 적합한 테이블에서 조회하도록 수정.

---

### 🔴 버그 4 — InsuranceCompany `isActive` 필드 누락
**파일:** `entity/InsuranceCompany.java`  
**심각도:** 중간  
**상태:** ✅ 수정 완료

`Hospital` 엔티티와 달리 `InsuranceCompany`에 관리자 승인 여부 필드가 없어 구조 불일치.  
`@Column(name = "is_active", nullable = false) private Boolean isActive = false;` 추가.

---

### 🔴 버그 5 — Repository 메서드 누락
**파일:** `repository/HospitalRepository.java`, `repository/InsuranceCompanyRepository.java`  
**심각도:** 치명 (컴파일 오류)  
**상태:** ✅ 수정 완료

`AuthService.resolveMemberNumber()`에서 호출하는 `findByUser_Id(Long userId)` 메서드 미정의.  
두 Repository에 해당 메서드 추가.

---

### 🔴 버그 6 — 커뮤니티 게시판 백엔드 전체 미구현
**파일:** (신규 20개 파일 생성)  
**심각도:** 치명 (기능 전체 불동작)  
**상태:** ✅ 수정 완료

게시판 UI는 존재했으나 백엔드(DB, API)가 전혀 없어 새로고침 시 모든 데이터 소실.  
4개 엔티티(Post, PostImage, PostLike, Comment), 4개 Repository, DTO, Port, Service, Controller 전체 구현.

| 생성 파일 | 역할 |
|----------|------|
| `entity/Post.java` | 게시글 |
| `entity/PostImage.java` | 이미지 메타데이터 |
| `entity/PostLike.java` | 좋아요 (post_id+user_id 유니크) |
| `entity/Comment.java` | 댓글/대댓글 |
| `repository/Post*Repository.java` × 4 | 조회 + JOIN FETCH |
| `dto/post/PostDtos.java` | 요청/응답 DTO |
| `port/PostApiPort.java` | 서비스 인터페이스 |
| `service/PostService.java` | 비즈니스 로직 |
| `controller/PostController.java` | REST API (`/api/posts`) |

---

### 🔴 버그 7 — PostService 입력값 검증 누락 → DB 제약 위반
**파일:** `petchainAPI/service/PostService.java`  
**심각도:** 높음  
**상태:** ✅ 수정 완료

게시글 content, 댓글 content, s3Key가 null/빈 문자열인 채로 저장 시  
DB의 `NOT NULL` 제약 위반으로 500 오류 발생.  
page < 0, size 범위 초과 시 Spring Data IllegalArgumentException 발생.

추가한 검증:
- `createPost()`: content 필수 검증
- `addComment()`: content 필수 검증
- `savePostImage()`: s3Key 필수 검증
- `listPosts()`: page ≥ 0, size 1~100 범위 검증

---

### 🔴 버그 8 — N+1 쿼리 (게시글 목록/댓글)
**파일:** `repository/PostRepository.java`, `repository/CommentRepository.java`  
**심각도:** 높음 (성능)  
**상태:** ✅ 수정 완료

게시글 10개 조회 시 author 조회 쿼리가 10번 추가 발생.  
댓글 트리에서도 author 조회 N번 발생.  
JOIN FETCH 쿼리로 교체, 페이지네이션을 위한 countQuery 별도 명시.

```sql
-- PostRepository
SELECT p FROM Post p JOIN FETCH p.author WHERE p.isDeleted = false ...
-- countQuery 분리 필수 (미분리 시 메모리 내 페이지네이션 발생)
SELECT COUNT(p) FROM Post p WHERE p.isDeleted = false

-- CommentRepository
SELECT c FROM Comment c JOIN FETCH c.author WHERE c.post.id = :postId ...
```

---

### 🔴 버그 9 — deletePost에서 author 지연 로딩
**파일:** `petchainAPI/service/PostService.java`  
**심각도:** 중간  
**상태:** ✅ 수정 완료

`findById()` 후 `post.getAuthor().getId()` 호출 → LAZY 로딩으로 추가 쿼리 발생.  
`findWithAuthorById()`(JOIN FETCH)로 교체.

---

### 🔴 버그 10 — ApiExceptionHandler에 IllegalArgumentException 핸들러 없음
**파일:** `petchainAPI/error/ApiExceptionHandler.java`  
**심각도:** 치명  
**상태:** ✅ 수정 완료

`petchainAPI` 패키지 컨트롤러(PostController, FileUploadController 등)에서  
`IllegalArgumentException` 발생 시 핸들러가 없어 400 대신 500 반환.  
`IllegalStateException`도 동일하게 500 반환.

```
GlobalExceptionHandler → petchainLOGIN 컨트롤러에만 적용
ApiExceptionHandler    → petchainAPI 컨트롤러에만 적용
```

`ApiExceptionHandler`에 두 핸들러 추가:
- `IllegalArgumentException` → 400 Bad Request
- `IllegalStateException` → 403 Forbidden

---

### 🔴 버그 11 — OAuth 콜백 NPE (null 메시지)
**파일:** `petchainLOGIN/oauth/OAuthController.java`  
**심각도:** 중간  
**상태:** ✅ 수정 완료

예외 발생 시 `URLEncoder.encode(e.getMessage(), ...)` 호출.  
일부 예외 타입은 `getMessage()`가 null을 반환 → NullPointerException 발생.

```java
// Before
URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8)

// After
String errorMsg = e.getMessage() != null ? e.getMessage() : "OAuth 처리 중 오류가 발생했습니다.";
URLEncoder.encode(errorMsg, StandardCharsets.UTF_8)
```

---

### 🔴 버그 12 — `/api/` 경로 prefix 누락 (7개 컨트롤러)
**파일:** 아래 7개  
**심각도:** 치명  
**상태:** ✅ 수정 완료

`PostController`, `AuthController`, `PetController`는 `/api/` prefix를 올바르게 사용하는데,  
아래 7개 컨트롤러는 클래스 레벨 `@RequestMapping`이 없어 `/api/` prefix 누락.  
프론트엔드가 `/api/records`를 호출하면 **404 Not Found** 반환.

| 컨트롤러 | 잘못된 경로 | 수정 후 경로 |
|---------|-----------|------------|
| `AdminController` | `/admin/...` | `/api/admin/...` |
| `RecordController` | `/records` | `/api/records` |
| `VerificationController` | `/verifications/...` | `/api/verifications/...` |
| `SubmissionController` | `/submissions/...` | `/api/submissions/...` |
| `PointController` | `/insurers/...` 등 | `/api/insurers/...` 등 |
| `ConsentController` | `/consents` | `/api/consents` |
| `InternalVerificationController` | `/internal/...` | `/api/internal/...` |

전원 `@RequestMapping("/api")` 추가.

---

### 🔴 버그 13 — FileUploadService s3Key null 검증 누락
**파일:** `petchainAPI/service/FileUploadService.java`  
**심각도:** 높음  
**상태:** ✅ 수정 완료

`PostService.savePostImage()`에는 s3Key 검증이 있지만, 동일 역할을 하는  
`FileUploadService.saveFileMeta()`에는 s3Key null/blank 검증이 없었음.  
`FileUploadController`에서 body에 `s3Key` 키가 없으면 null로 전달되고  
`MedicalRecordFile.s3_key NOT NULL` 제약 위반으로 500 오류 발생.

```java
// 추가된 검증
if (s3Key == null || s3Key.isBlank()) {
    throw new IllegalArgumentException("s3Key는 필수입니다.");
}
```

---

## 점검 항목별 상세 결과

### ✅ 엔티티 (정상)

| 엔티티 | 확인 사항 | 결과 |
|--------|----------|------|
| `User` | 컬럼 제약, OAuth 필드 | 정상 |
| `Guardian` | User 1:1 연관, memberNumber | 정상 |
| `Hospital` | User 1:1 연관, isActive | 정상 |
| `InsuranceCompany` | User 1:1 연관, isActive | 버그 4에서 수정 |
| `Pet` | Guardian ManyToOne, petNumber 자동생성 | 정상 |
| `PetInsurance` | Pet/Guardian/InsuranceCompany 연관 | 정상 |
| `MedicalRecord` | recordId @PrePersist 자동생성 | 정상 |
| `MedicalRecordFile` | s3_key NOT NULL, uploadedAt | 정상 |
| `MedicalRecordDisease` | (record_id, disease_code) 유니크 | 정상 |
| `MedicalRecordTreatment` | (record_id, treatment_code) 유니크 | 정상 |
| `ClaimPackage` | claimId @PrePersist 자동생성 | 정상 |
| `NftToken` | tokenId @PrePersist 자동생성 | 정상 |
| `PointBalance` | (owner_type, owner_id) 유니크 | 정상 |
| `PointTransaction` | 폴리모픽 from/to owner | 정상 |
| `RefreshToken` | tokenHash SHA-256, isRevoked | 정상 |
| `ConsentHistory` | ClaimPackage/Guardian 연관 | 정상 |
| `VerificationLog` | ClaimPackage/InsuranceCompany 연관 | 정상 |
| `AuditLog` | user nullable (시스템 자동처리 허용) | 정상 |
| `DiseaseCode` | String @Id (코드가 PK) | 정상 |
| `TreatmentCode` | String @Id (코드가 PK) | 정상 |
| `Post` | author LAZY, isDeleted soft-delete | 정상 |
| `PostImage` | uploadedAt @PrePersist | 정상 |
| `PostLike` | (post_id, user_id) 유니크 제약 | 정상 |
| `Comment` | parentComment nullable (최상위/대댓글) | 정상 |

---

### ✅ 레포지토리 (정상)

| 레포지토리 | 주요 메서드 | 결과 |
|-----------|-----------|------|
| `UserRepository` | findByLoginId, existsByLoginId, findByOauthProviderAndOauthProviderId | 정상 |
| `GuardianRepository` | findByUser_Id, existsByMemberNumber | 정상 |
| `HospitalRepository` | findByUser_Id, existsByMemberNumber, existsByFabricOrgId, existsByBusinessNumber | 버그 5에서 추가 |
| `InsuranceCompanyRepository` | findByUser_Id, existsByMemberNumber 등 | 버그 5에서 추가 |
| `PetRepository` | existsByPetNumber, findByGuardian_Id | 정상 |
| `MedicalRecordRepository` | existsByRecordId, findByRecordId | 정상 |
| `MedicalRecordFileRepository` | findByMedicalRecord_IdAndIsDeletedFalse | 정상 |
| `ClaimPackageRepository` | existsByClaimId, findByClaimId | 정상 |
| `RefreshTokenRepository` | findByTokenHash, revokeAllByUserId (@Modifying) | 정상 |
| `PointBalanceRepository` | findByOwnerTypeAndOwnerId | 정상 |
| `PostRepository` | findWithAuthor, findWithAuthorByRegion, findWithAuthorById (JOIN FETCH) | 정상 |
| `PostImageRepository` | findByPost_Id | 정상 |
| `PostLikeRepository` | findByPost_IdAndUser_Id, countByPost_Id, existsByPost_IdAndUser_Id | 정상 |
| `CommentRepository` | findRootCommentsWithAuthor, findRepliesWithAuthor (JOIN FETCH) | 정상 |

---

### ✅ 보안 / 필터 (정상)

| 항목 | 확인 내용 | 결과 |
|------|----------|------|
| `SecurityConfig` | `/api/auth/**`, `/error` permitAll, 나머지 authenticated | 정상 |
| `JwtAuthFilter` | Bearer 토큰 파싱, actorId/actorRole/actorType request attribute 세팅 | 정상 |
| `JwtUtil` | HS256 서명, Subject에 userId, Claim에 memberType | 정상 |
| `ApiActorArgumentResolver` | request attribute 우선, 헤더 fallback | 정상 |
| `ApiWebMvcConfig` | ArgumentResolver 등록 | 정상 |

---

### ✅ OAuth 흐름 (정상 — 버그 11 수정 후)

| 항목 | 확인 내용 | 결과 |
|------|----------|------|
| `OAuthStateStore` | UUID state 발급, 10분 TTL, 1회용 검증 | 정상 |
| `OAuthProperties` | @ConfigurationProperties 바인딩 | 정상 |
| `GoogleOAuthClient` | 토큰→사용자정보 교환, OAuthUserInfo 빌드 | 정상 |
| `NaverOAuthClient` | response 중첩 구조 처리 | 정상 |
| `KakaoOAuthClient` | kakao_account.profile 중첩 구조, client_secret 선택적 | 정상 |
| `OAuthService` | find-or-create 로직, 신규 계정 Guardian 자동생성 | 정상 |
| `OAuthController` | authorize/callback 엔드포인트, NPE 수정 | 버그 11에서 수정 |

---

### ✅ 설정 / 공통 (정상)

| 파일 | 확인 내용 | 결과 |
|------|----------|------|
| `application.properties` | DB/JPA/JWT/OAuth 설정, 환경변수 fallback | 정상 |
| `DataInitializer` | admin 중복 방지 시드, DiseaseCode/TreatmentCode 초기 데이터 | 정상 |
| `RootDotenvEnvironmentPostProcessor` | `.env` 파일 자동 로딩, 기존 환경변수 우선 | 정상 |
| `DomainValues` | MemberType/AccountStatus/PointOwnerType 상수 | 정상 |
| `IdentifierGenerator` | 8자리 랜덤 숫자, SecureRandom 사용 | 버그 1에서 수정 |

---

### ⚠️ 미구현 기능 (버그 아님, 현재 의도된 상태)

#### 토큰 재발급 엔드포인트 없음
- `RefreshToken` 엔티티와 `RefreshTokenRepository.findByTokenHash()`는 존재하지만
- `/api/auth/refresh` 엔드포인트가 없어 토큰 갱신 불가
- access token 만료(기본 1시간) 후 강제 재로그인 필요
- 구현이 필요한 시점에 `AuthService`에 `refresh(String rawRefreshToken)` 메서드 추가 필요

#### 주요 API 서비스 스텁 상태
아래 서비스는 모두 `throw new UnsupportedOperationException("Not implemented yet")`만 존재:

| 서비스 | 담당 API |
|--------|---------|
| `AdminService` | 포인트 발급/취소 |
| `RecordService` | 진료기록 CRUD |
| `SubmissionService` | 보험 청구 제출 |
| `ConsentService` | 동의 관리 |
| `PointService` | 포인트 잔액/거래 |
| `VerificationService` | 검증 조회 |
| `InternalVerificationService` | 내부 검증 처리 |

해당 엔드포인트 호출 시 500 오류 반환 (현재 의도된 미완성 상태).

---

## 수정된 파일 전체 목록

| # | 파일 경로 | 수정 내용 |
|---|----------|---------|
| 1 | `common/IdentifierGenerator.java` | digits(5) → digits(8) |
| 2 | `entity/MedicalRecord.java` | record_id 컬럼 길이 30→40 |
| 3 | `entity/ClaimPackage.java` | claim_id 컬럼 길이 30→40 |
| 4 | `entity/NftToken.java` | record_id/claim_id 컬럼 길이 30→40 |
| 5 | `entity/InsuranceCompany.java` | isActive 필드 추가 |
| 6 | `repository/HospitalRepository.java` | findByUser_Id 추가 |
| 7 | `repository/InsuranceCompanyRepository.java` | findByUser_Id 추가 |
| 8 | `service/AuthService.java` | resolveMemberNumber() 추가 |
| 9 | `entity/Post.java` | 신규 생성 |
| 10 | `entity/PostImage.java` | 신규 생성 |
| 11 | `entity/PostLike.java` | 신규 생성 |
| 12 | `entity/Comment.java` | 신규 생성 |
| 13 | `repository/PostRepository.java` | 신규 생성 (JOIN FETCH) |
| 14 | `repository/PostImageRepository.java` | 신규 생성 |
| 15 | `repository/PostLikeRepository.java` | 신규 생성 |
| 16 | `repository/CommentRepository.java` | 신규 생성 (JOIN FETCH) |
| 17 | `dto/post/PostDtos.java` | 신규 생성 |
| 18 | `port/PostApiPort.java` | 신규 생성 |
| 19 | `service/PostService.java` | 신규 생성 |
| 20 | `controller/PostController.java` | 신규 생성 |
| 21 | `error/ApiExceptionHandler.java` | IllegalArgumentException/IllegalStateException 핸들러 추가 |
| 22 | `oauth/OAuthController.java` | NPE 방지 (null 메시지 fallback) |
| 23 | `controller/AdminController.java` | @RequestMapping("/api") 추가 |
| 24 | `controller/RecordController.java` | @RequestMapping("/api") 추가 |
| 25 | `controller/VerificationController.java` | @RequestMapping("/api") 추가 |
| 26 | `controller/SubmissionController.java` | @RequestMapping("/api") 추가 |
| 27 | `controller/PointController.java` | @RequestMapping("/api") 추가 |
| 28 | `controller/ConsentController.java` | @RequestMapping("/api") 추가 |
| 29 | `controller/InternalVerificationController.java` | @RequestMapping("/api") 추가 |
| 30 | `service/FileUploadService.java` | s3Key null/blank 검증 추가 |

---

## 심각도별 요약

| 심각도 | 건수 | 내용 |
|-------|------|------|
| 🔴 치명 | 5건 | 게시판 미구현, memberNumber null, Repository 메서드 누락, ApiExceptionHandler 누락, /api/ prefix 누락 |
| 🔴 높음 | 5건 | s3Key 검증 누락, N+1 쿼리, ID 충돌 위험, 입력값 검증 누락, FileUploadService s3Key 누락 |
| 🟠 중간 | 3건 | InsuranceCompany isActive 누락, 컬럼 길이 부족, OAuth NPE |
| ⚠️ 미구현 | 2건 | refresh 엔드포인트 없음, 7개 서비스 스텁 상태 |
