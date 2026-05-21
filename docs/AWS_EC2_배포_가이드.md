# PetChain AWS EC2 배포 가이드

단일 EC2 인스턴스에서 `docker compose` 로 **frontend / backend / mysql** 3개 컨테이너를
띄우는 배포 방식을 다룬다. (관리형 RDS 가 아니라 **MySQL 컨테이너**를 EC2 위에서 운영하는 구성)

> 핵심: 이 프로젝트는 DB 접속이 전부 환경변수로 분리돼 있고, 백엔드는 기본 프로파일에서
> `ddl-auto=update` 로 빈 DB에 스키마를 자동 생성한다. 따라서 **DB "구조 변경"은 필요 없고**,
> 운영용 `.env` 작성과 EC2 셋업만 하면 된다.

---

## 1. 아키텍처

```text
인터넷
  │  http://<도메인 또는 EC2 퍼블릭 IP>:APP_PORT
  ▼
frontend (Nginx, React 정적 파일 + /api 리버스 프록시)
  ▼  내부 네트워크
backend (Spring Boot, 8080)
  ▼  내부 네트워크
mysql (MySQL 8.0, named volume: mysql_data)
```

- 외부에 열리는 포트는 frontend 의 `APP_PORT`(기본 80) 하나뿐이다.
- backend / mysql 은 Compose 내부 네트워크에서만 접근 → 보안그룹에서 3306/8080 을 열지 않는다.
- DB 데이터는 EC2 의 EBS 위 Docker named volume `mysql_data` 에 저장된다.

---

## 2. EC2 인스턴스 준비

| 항목 | 권장 |
| --- | --- |
| OS | Amazon Linux 2023 또는 Ubuntu 22.04 |
| 인스턴스 타입 | **t3.small (2GB) 이상** — 아래 빌드 메모리 주의 참고 |
| 스토리지 | gp3 20GB+ (DB 데이터 + Docker 이미지) |
| 보안그룹 인바운드 | 22(SSH, 내 IP만), 80(HTTP), 443(HTTPS, TLS 사용 시) |

> ⚠️ **빌드 메모리 주의**: `be/backend/Dockerfile` 이 컨테이너 빌드 단계에서
> `gradle bootJar` 를 실행한다. 1GB 인스턴스(t2.micro/t3.micro)에서는 빌드 중 OOM 으로
> 죽기 쉽다. 두 가지 해법 중 하나를 쓴다.
> - (간단) t3.small 이상 + **swap 2GB 추가** (아래 3-2)
> - (가벼운 운영) 빌드는 로컬/CI 에서 하고 EC2 엔 산출물 이미지만 배포

---

## 3. 호스트 셋업

### 3-1. Docker / Compose 설치

Amazon Linux 2023:
```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER        # 재로그인 후 sudo 없이 docker 사용
# Compose v2 플러그인
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
```

Ubuntu 22.04:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER        # 재로그인
docker compose version
```

### 3-2. (작은 인스턴스라면) swap 2GB 추가

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h    # Swap 확인
```

---

## 4. 코드 배치 + 환경변수

```bash
git clone <레포 URL> pointpro
cd pointpro
cp .env.example .env
```

`.env` 를 열어 운영값으로 교체한다. **반드시 바꿔야 하는 값:**

| 변수 | 설명 | 생성 예시 |
| --- | --- | --- |
| `DB_PASSWORD` | MySQL root 비밀번호 | `openssl rand -base64 24` |
| `ADMIN_PASSWORD` | 플랫폼 관리자 초기 비밀번호 | 강한 임의값 |
| `JWT_SECRET` | 32바이트 이상 랜덤 (HS256) | `openssl rand -base64 48` |
| `FRONTEND_URL` | 공개 프론트엔드 주소 | `https://petchain.example.com` |
| `CORS_ALLOWED_ORIGINS` | 위와 동일 origin | 동일 |
| `*_REDIRECT_URI` | OAuth 콜백, 공개 주소 기준 | 도메인/IP 일치 |

> 도메인이 아직 없으면 `http://<EC2_PUBLIC_IP>` 로 우선 띄우고, 같은 주소를
> `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` / 각 `*_REDIRECT_URI` 에 동일하게 넣는다.
> OAuth 제공자 콘솔(Google/Naver/Kakao)에도 **동일한 redirect URI 를 등록**해야 한다.

---

## 5. 빌드 및 기동

```bash
docker compose config --quiet     # .env 누락/문법 검증 (값 없으면 여기서 거부됨)
docker compose up -d --build      # 빌드 + 백그라운드 기동
docker compose ps                 # 상태 확인
docker compose logs -f backend    # 백엔드 로그(스키마 생성 로그 확인)
```

### 스키마 자동 생성 확인

첫 기동 시 `mysql_data` 볼륨이 비어 있으므로 backend(`ddl-auto=update`)가 25개 테이블을
자동 생성한다. 다음으로 생성 여부를 확인한다.

```bash
docker compose exec mysql mysql -uroot -p"$DB_PASSWORD" -e \
  "SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema='petchain';"
# 25 가 나오면 정상
```

> 빈 DB에 수동으로 스키마를 적재하고 싶다면 `db/schema.sql` 을 사용할 수 있다.
> 단 평소엔 Hibernate 자동 생성으로 충분하므로 별도 적재는 불필요하다.

---

## 6. 동작 확인

- 브라우저에서 `http://<주소>` (APP_PORT 가 80이 아니면 `:<APP_PORT>`)
- 관리자 로그인: `.env` 의 `ADMIN_LOGIN_ID` / `ADMIN_PASSWORD`
- OAuth 로그인 버튼으로 콜백 정상 동작 확인

---

## 7. 도메인 / HTTPS (선택)

현재 Compose 는 HTTP(80)만 처리한다. HTTPS 가 필요하면 둘 중 하나:

- **ALB(Application Load Balancer) + ACM 인증서**: ALB 가 443 을 종료하고 EC2 의 80(frontend)
  으로 전달. 가장 AWS-네이티브한 방식.
- **EC2 앞단 Nginx + certbot**: 인스턴스에서 직접 Let's Encrypt 인증서 발급/갱신.

어느 쪽이든 HTTPS 적용 후엔 `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` / `*_REDIRECT_URI` 를
`https://...` 로 바꾸고 `docker compose up -d` 로 재기동한다.

---

## 8. 백업

컨테이너 MySQL 데이터는 EC2 의 `mysql_data` 볼륨에만 있다. **인스턴스/EBS 가 삭제되면 유실된다.**
정기 백업을 권장한다 — 레포의 `scripts/db-backup.sh` 사용:

```bash
chmod +x scripts/db-backup.sh
./scripts/db-backup.sh                       # ./backups 에 타임스탬프 .sql.gz 생성
# cron 으로 매일 새벽 3시 백업 (예시)
( crontab -l 2>/dev/null; echo "0 3 * * * cd $(pwd) && ./scripts/db-backup.sh >> backups/backup.log 2>&1" ) | crontab -
```

복구:
```bash
gunzip -c backups/petchain-YYYYMMDD-HHMMSS.sql.gz | \
  docker compose exec -T mysql mysql -uroot -p"$DB_PASSWORD" petchain
```

> 더 안전하게 하려면 백업 파일을 S3 로 올리거나(`aws s3 cp`), EBS 스냅샷을 주기적으로 찍는다.

---

## 9. 배포 모드 선택 (중요)

`DataInitializer` 와 `ProductionConfigGuard` 가 활성 프로파일에 따라 다르게 동작한다. 이게
실서비스 배포 전 반드시 정해야 하는 부분이다.

| 항목 | 기본 프로파일 (`SPRING_PROFILES_ACTIVE` 비움) | `prod` |
| --- | --- | --- |
| admin 계정 | 시드 | 시드 (단 `ADMIN_PASSWORD` 기본값이면 기동 실패) |
| 질병/진료 코드(마스터) | 시드 | 시드 |
| 병원 4곳·보험사 2곳 기본 계정 (`hospital1234`/`insurance1234`) | **시드함** | **시드함** |
| `JWT_SECRET`/`DB_PASSWORD` 기본값 차단 | 안 함 | **차단(기동 실패)** |
| 스키마 | `ddl-auto=update`(자동 생성) | `ddl-auto=validate`(미리 있어야 함) |

병원/보험사/admin 기본 계정은 **어느 프로파일에서든 항상 시드**된다(loginId 로 멱등).
프로파일 선택은 시크릿 가드와 스키마 처리 방식만 바꾼다.

- **간단 시작(기본)**: `SPRING_PROFILES_ACTIVE` 를 비워둔다. 빈 DB에 스키마가 자동 생성되고
  기본 계정이 시드된다. AWS 첫 배포에 가장 단순하다.
- **prod 프로파일**: `SPRING_PROFILES_ACTIVE=prod` 로 두면 `JWT_SECRET`/`DB_PASSWORD` 가
  기본값일 때 기동을 거부한다. 이때 `ddl-auto=validate` 라 스키마가 미리 있어야 하므로,
  `docker-compose.yml` 의 mysql 볼륨에서 다음 줄의 주석을 해제해 빈 DB 첫 기동에 적재한다:

  ```yaml
  - ./db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
  ```

  mysql 이미지는 **볼륨이 빈 첫 초기화에서만** 이 스크립트를 실행한다. 이미 데이터가 있는
  볼륨이면 무시되므로, prod 전환은 새 볼륨(또는 새 인스턴스)에서 시작하는 게 깔끔하다.

> 엔티티를 변경하면 `db/schema.sql` 도 재생성해야 validate 가 통과한다 (생성법은 파일 상단 주석 참고).

## 10. 운영 주의사항

- **JWT_SECRET 필수**: prod 프로파일이면 기본값일 때 기동을 거부한다. 기본 프로파일이면 이 검사가
  없으므로 더더욱 `.env` 에 강한 값을 넣어야 한다. (`docker compose config` 가 누락 시도 거부)
- **mysql_data 영속성**: `docker compose down` 은 볼륨을 유지하지만 `docker compose down -v` 는
  **DB 데이터를 삭제**한다. 운영에서 `-v` 사용 금지.
- **재배포**: 코드 갱신 후 `git pull && docker compose up -d --build`.
- **시간대/문자셋**: 컨테이너가 Asia/Seoul, utf8mb4 로 구성돼 있어 별도 설정 불필요.
