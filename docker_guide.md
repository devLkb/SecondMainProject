# PetChain Docker Guide

## 1. 전체 구조

이 저장소의 Docker Compose 배포 단위는 `frontend`, `backend`, `mysql` 3개 컨테이너다.

```text
브라우저
  │  http://<서버>:APP_PORT
  ▼
frontend (Nginx, React 정적 파일)
  ├─ /        → /usr/share/nginx/html 의 SPA 파일 서빙
  └─ /api/*   → backend:8080 으로 reverse proxy
        ▼
backend (Spring Boot)
        ▼
mysql (MySQL 8.0, mysql_data 볼륨)
```

- 외부 공개 포트는 기본적으로 `frontend`의 `APP_PORT` 하나다.
- `backend`와 `mysql`은 Compose 내부 네트워크에서만 접근한다.
- MySQL 데이터는 Docker named volume `mysql_data`에 유지된다.

## 2. 주요 파일

| 파일 | 역할 |
| --- | --- |
| `docker-compose.yml` | 전체 컨테이너 구성, 네트워크, 볼륨, 환경 변수 연결 |
| `.env.example` | 배포 환경 변수 템플릿 |
| `be/backend/Dockerfile` | Spring Boot JAR 빌드 및 JRE 런타임 이미지 생성 |
| `be/backend/.dockerignore` | 백엔드 빌드 컨텍스트에서 Gradle 산출물 제외 |
| `fe/petchain/Dockerfile` | React 빌드 후 Nginx 이미지로 정적 파일 패키징 |
| `fe/petchain/nginx.conf` | SPA fallback 및 `/api` 프록시 설정 |
| `fe/petchain/.dockerignore` | 프론트엔드 빌드 컨텍스트에서 `node_modules`, `dist` 제외 |

## 3. 환경 변수 준비

최상위 `.env.example`을 `.env`로 복사한 뒤 운영 값으로 수정한다.

```bash
cp .env.example .env
```

필수로 바꿔야 하는 값은 다음과 같다.

- `DB_PASSWORD`: MySQL root 비밀번호
- `ADMIN_PASSWORD`: 플랫폼 관리자 초기 비밀번호
- `JWT_SECRET`: 32바이트 이상 엔트로피를 가진 긴 랜덤 문자열
- `FRONTEND_URL`: OAuth 성공 후 돌아갈 공개 프론트엔드 URL
- `CORS_ALLOWED_ORIGINS`: 공개 프론트엔드 origin 목록
- `*_REDIRECT_URI`: OAuth 제공자 콘솔에 등록한 callback URL

예를 들어 도메인이 `https://petchain.example.com`이면 다음 값들이 같은 공개 주소를 기준으로 맞아야 한다.

```dotenv
FRONTEND_URL=https://petchain.example.com
CORS_ALLOWED_ORIGINS=https://petchain.example.com
GOOGLE_REDIRECT_URI=https://petchain.example.com/api/auth/oauth/google/callback
NAVER_REDIRECT_URI=https://petchain.example.com/api/auth/oauth/naver/callback
KAKAO_REDIRECT_URI=https://petchain.example.com/api/auth/oauth/kakao/callback
```

TLS 인증서와 HTTPS 종료는 현재 Compose 범위 밖이다. 운영에서 HTTPS가 필요하면 서버 앞단의 Nginx, Traefik, 로드밸런서 등에서 TLS를 종료하고 이 Compose의 `frontend`로 전달한다.

## 4. 실행 명령

구성 검증:

```bash
docker compose config --quiet
```

빌드 및 백그라운드 실행:

```bash
docker compose up -d --build
```

상태 확인:

```bash
docker compose ps
```

로그 확인:

```bash
docker compose logs -f frontend backend mysql
```

재빌드 배포:

```bash
docker compose up -d --build
```

중지:

```bash
docker compose down
```

데이터까지 삭제해야 하는 초기화 작업은 `mysql_data` 볼륨을 제거해야 하므로 운영 데이터 유실에 주의한다.

```bash
docker compose down -v
```

## 5. 포트와 접근 경로

| 대상 | 기본 접근 |
| --- | --- |
| 프론트엔드 | `http://localhost` (`APP_PORT`가 80이 아닐 경우 `http://localhost:<APP_PORT>`) |
| 백엔드 API | 브라우저 기준 `/api/...` |
| MySQL | Compose 내부 `mysql:3306` |

백엔드와 MySQL은 호스트 포트로 공개하지 않는다. 로컬에서 DB를 직접 확인해야 하면 임시 override compose 파일을 따로 두거나 `docker compose exec mysql mysql -uroot -p petchain` 방식으로 접속한다.

## 6. 운영 주의사항

- 현재 백엔드는 기본 프로파일에서 `spring.jpa.hibernate.ddl-auto=update`를 사용한다.
- `application-prod.properties`는 `ddl-auto=validate`로 동작하지만, 별도 마이그레이션 도구가 없으므로 빈 DB에서 바로 `SPRING_PROFILES_ACTIVE=prod`를 켜면 스키마 검증 실패가 날 수 있다.
- 운영 전에는 DB 백업 정책과 스키마 마이그레이션 방식을 별도로 확정해야 한다.
- `.env`는 비밀값을 포함하므로 Git에 커밋하지 않는다.
- OAuth redirect URI는 외부 사용자가 접근하는 공개 주소와 정확히 일치해야 한다.
