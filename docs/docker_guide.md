# PetChain AWS EC2 Docker Compose Guide

## 1. 배포 기준

이 가이드는 **AWS EC2 단일 인스턴스에서 Docker Compose로 PetChain을 배포**하는 방식을 기준으로 한다.

- 사용 AWS 서비스: EC2, Security Group, Elastic IP 또는 Route 53 도메인
- 선택 AWS 서비스: ALB, ACM, Route 53
- 이 구성은 ECS/Fargate, ECR, RDS 기반 배포가 아니다.
- MySQL은 현재 Compose 내부 컨테이너와 `mysql_data` Docker named volume을 사용한다.

```text
인터넷 사용자
  │  http://<EC2 Public IP 또는 도메인>:APP_PORT
  │  또는 ALB/HTTPS 종료 지점
  ▼
frontend (Nginx, React 정적 파일)
  ├─ /        → /usr/share/nginx/html 의 SPA 파일 서빙
  └─ /api/*   → backend:8080 으로 reverse proxy
        ▼
backend (Spring Boot, prod profile)
        ▼
mysql (MySQL 8.0, mysql_data 볼륨)
```

- 외부 공개 포트는 기본적으로 `frontend`의 `APP_PORT` 하나다.
- `backend`와 `mysql`은 Compose 내부 네트워크에서만 접근한다.
- 운영 기본값은 `SPRING_PROFILES_ACTIVE=prod`다.

## 2. 주요 파일

| 파일                     | 역할                                                      |
| ------------------------ | --------------------------------------------------------- |
| `docker-compose.yml`     | AWS EC2 Compose 기준 컨테이너, 포트, 볼륨, 환경 변수 구성 |
| `.env.example`           | 배포 환경 변수 템플릿                                     |
| `be/backend/Dockerfile`  | Spring Boot JAR 빌드 및 JRE 런타임 이미지 생성            |
| `fe/petchain/Dockerfile` | React 빌드 후 Nginx 이미지로 정적 파일 패키징             |
| `fe/petchain/nginx.conf` | SPA fallback 및 `/api` 프록시 설정                        |

## 3. AWS EC2 준비

EC2 인스턴스에는 Docker와 Docker Compose 플러그인을 설치하고, 저장소를 배포할 디렉터리에 clone 한다.

Security Group은 최소한 다음 원칙을 따른다.

| 포트               | 공개 대상                 | 용도                     |
| ------------------ | ------------------------- | ------------------------ |
| 22                 | 관리자 IP만               | SSH 접속                 |
| 80 또는 `APP_PORT` | 인터넷 또는 ALB           | 프론트엔드 HTTP 진입점   |
| 443                | ALB/프록시 사용 시 인터넷 | HTTPS 진입점             |
| 8080               | 공개 금지                 | Compose 내부 백엔드 전용 |
| 3306               | 공개 금지                 | Compose 내부 MySQL 전용  |

고정 접속 주소가 필요하면 Elastic IP나 Route 53 도메인을 EC2 또는 ALB에 연결한다.

## 4. 환경 변수 준비

최상위 `.env.example`을 `.env`로 복사한 뒤 AWS 운영 값으로 수정한다.

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

# 4-1 변경하는 이유

• AWS 운영 배포에서 기본값/로컬값 그대로 쓰면 보안·인증·접속 경로가 깨지기 때문
입니다.

- DB_PASSWORD
  - MySQL root 비밀번호입니다.
  - 기본값이나 약한 값이면 DB 전체가 위험합니다.
  - 특히 EC2 내부 컨테이너라도 서버 침해 시 바로 DB 접근이 가능합니다.
- ADMIN_PASSWORD
  - 플랫폼 관리자 초기 계정 비밀번호입니다.
  - 기본값이면 누구나 관리자 권한을 탈취할 수 있습니다.
  - 코드에도 prod 프로파일에서 기본 관리자 비밀번호 사용 시 부팅 실패하도록
    방어 로직이 있습니다.
- JWT_SECRET
  - 로그인 토큰 서명에 쓰입니다.
  - 짧거나 예측 가능한 값이면 공격자가 JWT를 위조할 수 있습니다.
  - 그래서 32바이트 이상 랜덤 문자열이 필요합니다.
- FRONTEND_URL
  - OAuth 로그인 성공 후 사용자를 돌려보낼 공개 프론트엔드 주소입니다.
  - localhost로 남아 있으면 AWS 배포 환경에서 사용자가 로그인 후 자기 PC의
    localhost로 이동해 실패합니다.
- CORS_ALLOWED_ORIGINS
  - 브라우저가 백엔드 API 호출을 허용할 프론트엔드 origin 목록입니다.
  - 운영 도메인으로 맞추지 않으면 프론트에서 API 호출이 CORS 오류로 막힐 수
    있습니다.
  - 너무 넓게 열면 보안 위험이 커집니다.
- \*\_REDIRECT_URI
  - Google/Naver/Kakao OAuth 제공자에 등록하는 콜백 주소입니다.
  - 실제 AWS 공개 도메인과 정확히 일치해야 OAuth 인증이 성공합니다.
  - localhost나 다른 주소로 남아 있으면 provider가 redirect를 거부하거나 로
    그인 흐름이 깨집니다.

즉, 앞의 3개는 보안상 필수, 뒤의 3개는 AWS 공개 주소에서 로그인/API가 정상 동
작하기 위해 필수입니다.

AWS 도메인이 `https://petchain.example.com`이면 다음 값들이 같은 공개 주소를 기준으로 맞아야 한다.

```dotenv
APP_PORT=80
SPRING_PROFILES_ACTIVE=prod
FRONTEND_URL=https://petchain.example.com
CORS_ALLOWED_ORIGINS=https://petchain.example.com
GOOGLE_REDIRECT_URI=https://petchain.example.com/api/auth/oauth/google/callback
NAVER_REDIRECT_URI=https://petchain.example.com/api/auth/oauth/naver/callback
KAKAO_REDIRECT_URI=https://petchain.example.com/api/auth/oauth/kakao/callback
```

`SPRING_PROFILES_ACTIVE`는 `docker-compose.yml`에서 기본값이 `prod`이므로 생략해도 AWS 배포에서는 운영 프로파일로 실행된다.

## 5. 배포 명령

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

## 6. 포트와 접근 경로

| 대상       | 기본 접근                                                                             |
| ---------- | ------------------------------------------------------------------------------------- |
| 프론트엔드 | `http://<EC2 Public IP 또는 도메인>` (`APP_PORT`가 80이 아닐 경우 `:<APP_PORT>` 포함) |
| 백엔드 API | 브라우저 기준 `/api/...`                                                              |
| MySQL      | Compose 내부 `mysql:3306`                                                             |

백엔드와 MySQL은 호스트 포트로 공개하지 않는다. 운영 중 DB를 직접 확인해야 하면 SSH로 EC2에 접속한 뒤 다음처럼 Compose 내부에서 실행한다.

```bash
docker compose exec mysql mysql -uroot -p petchain
```

## 7. HTTPS와 로드밸런서

현재 Compose 구성은 컨테이너 내부에서 TLS 인증서를 관리하지 않는다.

운영 HTTPS가 필요하면 다음 중 하나로 TLS를 종료하고 Compose `frontend`로 전달한다.

- 권장: AWS ALB + ACM 인증서 + Route 53 도메인
- 대안: EC2 호스트의 별도 Nginx/Traefik 리버스 프록시

ALB를 사용할 경우 대상 그룹은 EC2의 `APP_PORT`로 전달하고, Security Group은 ALB에서 EC2 `APP_PORT`로 들어오는 트래픽만 허용하도록 제한한다.

## 8. 운영 주의사항

- `docker-compose.yml`은 AWS EC2 Compose 배포 기준이며 ECS/Fargate 태스크 정의를 대체하지 않는다.
- 백엔드는 AWS 배포 기본값으로 `SPRING_PROFILES_ACTIVE=prod`를 사용한다.
- `application-prod.properties`는 `spring.jpa.hibernate.ddl-auto=validate`로 동작한다.
- 별도 마이그레이션 도구가 없으므로 빈 DB에서 바로 `prod`로 기동하면 스키마 검증 실패가 날 수 있다.
- 운영 전에는 DB 스키마 생성/마이그레이션 방식과 백업 정책을 별도로 확정해야 한다.
- `.env`는 비밀값을 포함하므로 Git에 커밋하지 않는다.
- OAuth redirect URI는 외부 사용자가 접근하는 공개 주소와 정확히 일치해야 한다.
