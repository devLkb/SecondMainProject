# DB & OAuth 점검 보고서

> 점검일: 2026-05-18
> 점검 범위: MySQL DB 저장 상태, 인증/OAuth 백엔드 흐름
> 점검 방법: 서버 기동 후 실제 API 호출 + DB 직접 조회

---

## 1. 점검 결과 요약

| 항목 | 결과 |
|------|------|
| MySQL `petchain` DB 및 24개 테이블 자동 생성 | 정상 |
| 회원가입 → `users` / `guardians` 저장 | 정상 |
| 로그인 → `last_login_at` 갱신, `refresh_tokens` 발급 | 정상 |
| 로그인 시 이전 refresh token revoke | 정상 |
| OAuth `find-or-create` 로직 | 정상 (코드 검증) |
| OAuth state(CSRF) 관리 | 정상 |
| 예외 처리 | **버그 3건 발견 → 수정 완료** |

---

## 2. 발견·수정한 버그

### 2-1. JSON 파싱 오류가 500으로 응답 — `GlobalExceptionHandler.java`

**문제**
잘못된 형식의 JSON 요청 시 `HttpMessageNotReadableException`이 발생하는데,
`GlobalExceptionHandler`에 전용 핸들러가 없어 `handleGeneral`(500)로 처리됨.
클라이언트 입력 오류(400)인데 서버 오류(500)로 응답되어 원인 파악이 어려움.

**수정**
```java
// 추가된 핸들러
@ExceptionHandler(HttpMessageNotReadableException.class)
public ResponseEntity<Map<String, String>> handleUnreadable(HttpMessageNotReadableException e) {
    return ResponseEntity.badRequest().body(Map.of("message", "요청 형식이 올바르지 않습니다."));
}
```
→ 잘못된 JSON 요청 시 `400 Bad Request` + 명확한 메시지 응답.

### 2-2. 예외가 로그에 기록되지 않음 — `GlobalExceptionHandler.java`

**문제**
`handleGeneral`이 모든 예외를 잡아 `"서버 오류가 발생했습니다."`만 반환하고
실제 예외(스택트레이스)를 **로그에 남기지 않음**.
서버 오류 발생 시 원인 추적이 불가능.

**수정**
```java
private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

@ExceptionHandler(Exception.class)
public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
    log.error("Unhandled exception: {}", e.getMessage(), e);   // 추가
    return ResponseEntity.internalServerError().body(Map.of("message", "서버 오류가 발생했습니다."));
}
```

### 2-3. OAuth 조회 컬럼에 인덱스 없음 — `User.java`

**문제**
`OAuthService.findOrCreate`는 매 로그인마다
`findByOauthProviderAndOauthProviderId(provider, providerId)`로 사용자를 조회하는데,
`users` 테이블의 `oauth_provider`, `oauth_provider_id` 컬럼에 인덱스가 없어
사용자 수 증가 시 풀 테이블 스캔 발생.

**수정**
```java
@Table(name = "users", indexes = {
    @Index(name = "idx_users_oauth", columnList = "oauth_provider, oauth_provider_id")
})
```
기존 DB에도 인덱스 직접 적용:
```sql
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_provider_id);
```

---

## 3. OAuth 환경변수 설정

OAuth 인가 URL 생성 시 `client_id=`가 비어 있어 실제 로그인이 불가능했음.
환경변수 미설정이 원인 — 아래 파일들에 OAuth 설정을 추가함.

### 3-1. `.env.example` / `.env`
`FRONTEND_URL` 및 Google/Naver/Kakao OAuth 변수 추가.
실제 키 값은 각 개발자 콘솔에서 발급받아 `.env`에 채워야 함.
(`.env`는 `.gitignore` 대상 — 커밋되지 않음)

```
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=        # https://console.cloud.google.com
GOOGLE_CLIENT_SECRET=
NAVER_CLIENT_ID=         # https://developers.naver.com/apps
NAVER_CLIENT_SECRET=
KAKAO_CLIENT_ID=         # https://developers.kakao.com
KAKAO_CLIENT_SECRET=
```

### 3-2. `docker-compose.yml`
백엔드 컨테이너에 OAuth/FRONTEND_URL 환경변수가 전달되지 않고 있었음.
`backend` 서비스 `environment` 섹션에 9개 변수 추가.

> 각 OAuth 제공자 콘솔에서 **Redirect URI**를 아래와 동일하게 등록해야 함:
> - Google: `http://localhost:8080/api/auth/oauth/google/callback`
> - Naver:  `http://localhost:8080/api/auth/oauth/naver/callback`
> - Kakao:  `http://localhost:8080/api/auth/oauth/kakao/callback`

---

## 4. 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `GlobalExceptionHandler.java` | `HttpMessageNotReadableException` 핸들러 추가, 예외 로깅 추가 |
| `User.java` | `oauth_provider`+`oauth_provider_id` 복합 인덱스 추가 |
| `.env.example` | `FRONTEND_URL` + OAuth 9개 변수 추가 |
| `.env` | 신규 생성 (OAuth 키는 비어 있음 — 발급 후 입력 필요) |
| `docker-compose.yml` | 백엔드 컨테이너에 OAuth/FRONTEND_URL 변수 전달 |
| `users` 테이블 (MySQL) | `idx_users_oauth` 인덱스 적용 |

---

## 5. 동작 검증 결과

서버 기동 후 실제 API 호출 테스트:

| 테스트 | 응답 |
|--------|------|
| 정상 회원가입 | `200` — `users`/`guardians`/`refresh_tokens` 저장 확인 |
| 정상 로그인 | `200` — `last_login_at` 갱신, 이전 토큰 revoke 확인 |
| 중복 이메일 가입 | `400` — `"이미 사용 중인 이메일입니다."` |
| 잘못된 비밀번호 로그인 | `400` — `"아이디 또는 비밀번호가 올바르지 않습니다."` |
| 잘못된 JSON 요청 | `400` — `"요청 형식이 올바르지 않습니다."` (수정 후) |
| 유효성 검사 실패 (짧은 비번) | `400` — 필드별 오류 메시지 |

---

## 6. 남은 작업 (To-Do)

- [ ] 각 OAuth 제공자 콘솔에서 앱 등록 후 `.env`에 실제 키 입력
- [ ] OAuth 제공자 콘솔에 Redirect URI 등록
- [ ] 실제 OAuth 로그인 e2e 테스트 (키 입력 후)
