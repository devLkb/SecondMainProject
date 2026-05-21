# 백엔드 버그 수정 보고서

> 점검 범위: `be/backend/src/main/java/` 하위 전체 Java 파일  
> 프론트엔드는 수정 대상에서 제외

---

## 1. ID 생성기 충돌 위험 — `IdentifierGenerator.java`

### 문제
`generateRecordId()`, `generateClaimId()`에서 5자리 숫자를 사용해 조합 가능한 경우의 수가 100,000개뿐이었음.  
연간 레코드/청구 건수가 늘어날수록 중복 ID 충돌 확률이 급격히 상승.

### 수정
```java
// Before
"REC-" + Year.now().getValue() + "-" + digits(5)  // 최대 100,000가지

// After
"REC-" + Year.now().getValue() + "-" + digits(8)  // 최대 100,000,000가지
```

---

## 2. DB 컬럼 길이 부족 — `MedicalRecord`, `ClaimPackage`, `NftToken` 엔티티

### 문제
`record_id` / `claim_id` 컬럼 길이가 30으로 설정되어 있었으나,  
실제 생성되는 ID 형식 `"REC-2026-12345678"` (18자) + 여유 공간 고려 시 부족할 수 있음.  
ID 생성기 자릿수 증가 후 컬럼 길이도 함께 확장 필요.

### 수정
```java
// Before
@Column(name = "record_id", length = 30)

// After
@Column(name = "record_id", length = 40)
```
`ClaimPackage`, `NftToken`의 `claim_id`, `record_id` 컬럼도 동일하게 수정.

---

## 3. 로그인 시 memberNumber가 항상 null — `AuthService.java`

### 문제
`login()` 메서드에서 JWT와 응답에 포함될 `memberNumber`를 조회하는 로직이 없어  
로그인 응답의 `memberNumber` 필드가 항상 `null`로 반환됨.

### 수정
`resolveMemberNumber(User user)` 메서드를 추가해 memberType별로 각 프로필 테이블을 조회하도록 수정.

```java
private String resolveMemberNumber(User user) {
    return switch (user.getMemberType()) {
        case MemberType.USER ->
            guardianRepository.findByUser_Id(user.getId())
                    .map(Guardian::getMemberNumber).orElse(null);
        case MemberType.HOSPITAL ->
            hospitalRepository.findByUser_Id(user.getId())
                    .map(Hospital::getMemberNumber).orElse(null);
        case MemberType.INSURANCE ->
            insuranceCompanyRepository.findByUser_Id(user.getId())
                    .map(InsuranceCompany::getMemberNumber).orElse(null);
        default -> null;
    };
}
```

---

## 4. InsuranceCompany 엔티티에 isActive 필드 누락 — `InsuranceCompany.java`

### 문제
`Hospital` 엔티티에는 `isActive` 필드(관리자 승인 여부)가 있었으나  
`InsuranceCompany` 엔티티에는 해당 필드가 없어 구조 불일치.

### 수정
```java
@Column(name = "is_active", nullable = false)
private Boolean isActive = false;
```

---

## 5. Repository 메서드 누락 — `HospitalRepository`, `InsuranceCompanyRepository`

### 문제
`AuthService.resolveMemberNumber()`에서 userId로 병원/보험사를 조회하는 메서드가 없어  
컴파일 오류 또는 조회 불가 상태.

### 수정
```java
// HospitalRepository
Optional<Hospital> findByUser_Id(Long userId);

// InsuranceCompanyRepository
Optional<InsuranceCompany> findByUser_Id(Long userId);
```

---

## 6. 커뮤니티 게시판 백엔드 전체 미구현

### 문제
게시판 UI는 프론트엔드에 존재했으나 백엔드(DB 저장, API)가 전혀 없어  
작성한 게시글/댓글/이미지가 React 상태에만 저장되고 새로고침 시 모두 소실됨.

### 수정 — 신규 생성 파일 목록

| 파일 | 역할 |
|------|------|
| `entity/Post.java` | 게시글 테이블 (`posts`) |
| `entity/PostImage.java` | 게시글 이미지 테이블 (`post_images`) |
| `entity/PostLike.java` | 좋아요 테이블 (`post_likes`, post_id+user_id 유니크 제약) |
| `entity/Comment.java` | 댓글/대댓글 테이블 (`post_comments`) |
| `repository/PostRepository.java` | 게시글 조회 (JOIN FETCH 포함) |
| `repository/PostImageRepository.java` | 이미지 조회 |
| `repository/PostLikeRepository.java` | 좋아요 조회/카운트 |
| `repository/CommentRepository.java` | 댓글 조회 (JOIN FETCH 포함) |
| `dto/post/PostDtos.java` | 요청/응답 DTO 전체 |
| `port/PostApiPort.java` | 서비스 인터페이스 |
| `service/PostService.java` | 비즈니스 로직 |
| `controller/PostController.java` | REST API 엔드포인트 |

### 제공 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/posts` | 게시글 작성 |
| `GET` | `/api/posts?region=&page=0&size=10` | 게시글 목록 (페이지네이션, 지역 필터) |
| `GET` | `/api/posts/{postId}` | 게시글 상세 (댓글 트리 포함) |
| `DELETE` | `/api/posts/{postId}` | 게시글 삭제 (본인만) |
| `POST` | `/api/posts/{postId}/likes` | 좋아요 토글 |
| `POST` | `/api/posts/{postId}/comments` | 댓글/대댓글 작성 |
| `DELETE` | `/api/posts/{postId}/comments/{commentId}` | 댓글 삭제 (본인만) |
| `POST` | `/api/posts/{postId}/images` | S3 업로드 후 이미지 메타데이터 저장 |

---

## 7. 입력값 검증 누락 — `PostService.java`

### 문제
게시글 내용, 댓글 내용, S3 키가 null이나 빈 문자열인 채로 저장 시도 시  
DB의 `NOT NULL` 제약 조건 위반으로 500 오류 발생.

### 수정
```java
// createPost()
if (request.getContent() == null || request.getContent().isBlank()) {
    throw new IllegalArgumentException("게시물 내용을 입력해주세요.");
}

// addComment()
if (request.getContent() == null || request.getContent().isBlank()) {
    throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
}

// savePostImage()
if (request.getS3Key() == null || request.getS3Key().isBlank()) {
    throw new IllegalArgumentException("s3Key는 필수입니다.");
}

// listPosts()
if (page < 0) throw new IllegalArgumentException("페이지 번호는 0 이상이어야 합니다.");
if (size < 1 || size > 100) throw new IllegalArgumentException("페이지 크기는 1~100 사이여야 합니다.");
```

---

## 8. N+1 쿼리 문제 — `PostRepository`, `CommentRepository`

### 문제
게시글 목록 조회 시 author를 지연 로딩(LAZY)으로 가져와  
게시글 10개 조회 시 author 조회 쿼리가 10번 추가로 발생 (최악의 경우 61개 쿼리).  
댓글 트리도 동일한 문제 존재.

### 수정 — `PostRepository`
```java
@Query(value = "SELECT p FROM Post p JOIN FETCH p.author WHERE p.isDeleted = false ORDER BY p.createdAt DESC",
       countQuery = "SELECT COUNT(p) FROM Post p WHERE p.isDeleted = false")
Page<Post> findWithAuthor(Pageable pageable);

@Query(value = "SELECT p FROM Post p JOIN FETCH p.author WHERE p.isDeleted = false AND p.authorRegion = :region ORDER BY p.createdAt DESC",
       countQuery = "SELECT COUNT(p) FROM Post p WHERE p.isDeleted = false AND p.authorRegion = :region")
Page<Post> findWithAuthorByRegion(@Param("region") String region, Pageable pageable);

@Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.id = :postId")
Optional<Post> findWithAuthorById(@Param("postId") Long postId);
```

### 수정 — `CommentRepository`
```java
@Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.post.id = :postId AND c.parentComment IS NULL AND c.isDeleted = false ORDER BY c.createdAt ASC")
List<Comment> findRootCommentsWithAuthor(@Param("postId") Long postId);

@Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.parentComment.id = :parentId AND c.isDeleted = false ORDER BY c.createdAt ASC")
List<Comment> findRepliesWithAuthor(@Param("parentId") Long parentId);
```

> **참고:** 페이지네이션에서 JOIN FETCH 사용 시 countQuery를 반드시 별도로 명시해야 함.  
> 미명시 시 `HHH90003004` 경고와 함께 인메모리 페이지네이션이 발생해 메모리 낭비 및 성능 저하.

---

## 9. 게시글 삭제 시 지연 로딩으로 author 조회 — `PostService.deletePost()`

### 문제
`deletePost()`에서 `findActivePost(postId)`로 게시글을 가져온 뒤  
`post.getAuthor().getId()`를 호출하면 LAZY 로딩으로 author를 추가 조회함.  
(불필요한 추가 쿼리 발생)

### 수정
`findWithAuthorById()`로 교체해 author를 JOIN FETCH로 한 번에 가져오도록 수정.

```java
Post post = postRepository.findWithAuthorById(postId)
        .filter(p -> !p.getIsDeleted())
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시물입니다."));
```

---

## 10. `IllegalArgumentException` 미처리 → 500 오류 — `ApiExceptionHandler.java`

### 문제
`PostService`와 `FileUploadService`는 입력값 오류 시 `IllegalArgumentException`을 던지지만  
`petchainAPI` 패키지 컨트롤러에 적용되는 `ApiExceptionHandler`에  
`IllegalArgumentException` 핸들러가 없어 **400이 아닌 500 오류**가 반환됨.

`IllegalStateException`도 동일하게 핸들러가 없어 **403이 아닌 500 오류** 반환.

### 수정
```java
@ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
        IllegalArgumentException exception, HttpServletRequest request) {
    ApiErrorResponse response = new ApiErrorResponse(
            ApiErrorCode.VALIDATION_FAILED,
            exception.getMessage(),
            TraceIds.from(request),
            Map.of()
    );
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
}

@ExceptionHandler(IllegalStateException.class)
public ResponseEntity<ApiErrorResponse> handleIllegalState(
        IllegalStateException exception, HttpServletRequest request) {
    ApiErrorResponse response = new ApiErrorResponse(
            ApiErrorCode.VALIDATION_FAILED,
            exception.getMessage(),
            TraceIds.from(request),
            Map.of()
    );
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
}
```

> **왜 두 개의 ExceptionHandler가 있는가?**  
> `GlobalExceptionHandler`는 `petchainLOGIN` 패키지 컨트롤러에만 적용되고  
> `ApiExceptionHandler`는 `petchainAPI` 패키지 컨트롤러에만 적용됨.  
> 두 핸들러는 서로 다른 컨트롤러 그룹에 독립적으로 작동함.

---

## 11. OAuth 콜백 NPE — `OAuthController.java`

### 문제
OAuth 콜백 처리 중 예외 발생 시 오류 메시지를 프론트엔드로 리다이렉트하는 코드에서  
`e.getMessage()`가 `null`을 반환하는 예외 타입일 경우  
`URLEncoder.encode(null, ...)` 호출로 **NullPointerException** 발생.

```java
// Before (버그)
response.sendRedirect(oAuthService.getFrontendUrl()
        + "?oauth_error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8));
```

### 수정
```java
// After (수정)
String errorMsg = e.getMessage() != null ? e.getMessage() : "OAuth 처리 중 오류가 발생했습니다.";
response.sendRedirect(oAuthService.getFrontendUrl()
        + "?oauth_error=" + URLEncoder.encode(errorMsg, StandardCharsets.UTF_8));
```

---

## 12. `/api/` 경로 prefix 누락 — 7개 컨트롤러 (2차 점검에서 발견)

### 문제
`PostController`, `AuthController`, `PetController`, `OAuthController`는 모두 `/api/...` prefix를 사용하는데  
아래 7개 컨트롤러에는 클래스 레벨 `@RequestMapping`이 없어 `/api/` prefix가 완전히 누락됨.

| 컨트롤러 | 잘못된 경로 | 올바른 경로 |
|---------|-----------|-----------|
| `AdminController` | `/admin/insurers/{id}/points/issue` | `/api/admin/insurers/{id}/points/issue` |
| `RecordController` | `/records` | `/api/records` |
| `VerificationController` | `/verifications/{id}` | `/api/verifications/{id}` |
| `SubmissionController` | `/submissions` | `/api/submissions` |
| `PointController` | `/insurers/{id}/points/balance` | `/api/insurers/{id}/points/balance` |
| `ConsentController` | `/consents` | `/api/consents` |
| `InternalVerificationController` | `/internal/submissions/{id}/verify` | `/api/internal/submissions/{id}/verify` |

이 상태에서 프론트엔드가 `/api/records`를 호출하면 **404 Not Found** 반환.  
Spring Security 인증은 경로 패턴과 무관하게 적용되므로 보안 문제는 없지만, 모든 API 요청이 실패함.

### 수정
7개 컨트롤러 모두에 `@RequestMapping("/api")` 추가.

```java
// Before
@RestController
public class RecordController { ... }

// After
@RestController
@RequestMapping("/api")
public class RecordController { ... }
```

---

## 수정 파일 전체 목록

| # | 파일 | 수정 유형 |
|---|------|-----------|
| 1 | `common/IdentifierGenerator.java` | 버그 수정 |
| 2 | `entity/MedicalRecord.java` | 버그 수정 |
| 3 | `entity/ClaimPackage.java` | 버그 수정 |
| 4 | `entity/NftToken.java` | 버그 수정 |
| 5 | `entity/InsuranceCompany.java` | 버그 수정 |
| 6 | `repository/HospitalRepository.java` | 버그 수정 |
| 7 | `repository/InsuranceCompanyRepository.java` | 버그 수정 |
| 8 | `service/AuthService.java` | 버그 수정 |
| 9 | `entity/Post.java` | 신규 생성 |
| 10 | `entity/PostImage.java` | 신규 생성 |
| 11 | `entity/PostLike.java` | 신규 생성 |
| 12 | `entity/Comment.java` | 신규 생성 |
| 13 | `repository/PostRepository.java` | 신규 생성 |
| 14 | `repository/PostImageRepository.java` | 신규 생성 |
| 15 | `repository/PostLikeRepository.java` | 신규 생성 |
| 16 | `repository/CommentRepository.java` | 신규 생성 |
| 17 | `dto/post/PostDtos.java` | 신규 생성 |
| 18 | `port/PostApiPort.java` | 신규 생성 |
| 19 | `service/PostService.java` | 신규 생성 |
| 20 | `controller/PostController.java` | 신규 생성 |
| 21 | `error/ApiExceptionHandler.java` | 버그 수정 |
| 22 | `oauth/OAuthController.java` | 버그 수정 |
| 23 | `controller/AdminController.java` | 버그 수정 |
| 24 | `controller/RecordController.java` | 버그 수정 |
| 25 | `controller/VerificationController.java` | 버그 수정 |
| 26 | `controller/SubmissionController.java` | 버그 수정 |
| 27 | `controller/PointController.java` | 버그 수정 |
| 28 | `controller/ConsentController.java` | 버그 수정 |
| 29 | `controller/InternalVerificationController.java` | 버그 수정 |

---

## 미구현 기능 (버그는 아니지만 알아야 할 사항)

### 토큰 재발급 엔드포인트 없음
- `RefreshToken` 엔티티와 `RefreshTokenRepository.findByTokenHash()`는 존재하지만
- `/api/auth/refresh` 엔드포인트가 없음
- 로그인/회원가입 시 refresh token이 발급은 되지만, 사용할 방법이 없음
- access token 만료(기본 1시간) 후 재로그인 필요

### 주요 서비스 스텁 상태
`AdminService`, `RecordService`, `SubmissionService`, `ConsentService`, `PointService`, `VerificationService`, `InternalVerificationService`는  
모두 `throw new UnsupportedOperationException("Not implemented yet")`만 있는 빈 구현체.  
해당 API 호출 시 500 오류 반환 (현재 의도된 미완성 상태).
