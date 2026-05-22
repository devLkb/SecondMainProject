#!/usr/bin/env bash
# =====================================================================
# PetChain DB 백업 스크립트 (EC2 + docker compose MySQL 컨테이너 대상)
#
# - 레포 루트의 .env 에서 DB_NAME / DB_PASSWORD 를 읽어
#   docker compose 의 mysql 컨테이너를 mysqldump 로 덤프하고 gzip 압축한다.
# - 결과: <레포루트>/backups/<DB_NAME>-YYYYMMDD-HHMMSS.sql.gz
# - 오래된 백업은 RETENTION_DAYS 보다 오래되면 삭제한다.
#
# 사용법:
#   chmod +x scripts/db-backup.sh
#   ./scripts/db-backup.sh
#
# cron 예시 (매일 03:00):
#   0 3 * * * cd /path/to/pointpro && ./scripts/db-backup.sh >> backups/backup.log 2>&1
# =====================================================================
set -euo pipefail

# 레포 루트로 이동 (scripts/ 의 부모)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

ENV_FILE="$REPO_ROOT/.env"
BACKUP_DIR="$REPO_ROOT/backups"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env 를 찾을 수 없습니다: $ENV_FILE" >&2
  exit 1
fi

# .env 에서 값만 안전하게 추출 (source 하지 않음: 인라인 주석/특수문자 방지)
read_env() {
  # KEY=VALUE 의 VALUE 만 추출, 양끝 따옴표/공백 제거
  grep -E "^$1=" "$ENV_FILE" | head -n1 | cut -d= -f2- \
    | sed -e 's/[[:space:]]*#.*$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
          -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

DB_NAME="$(read_env DB_NAME)"; DB_NAME="${DB_NAME:-petchain}"
DB_PASSWORD="$(read_env DB_PASSWORD)"

if [[ -z "$DB_PASSWORD" ]]; then
  echo "ERROR: .env 에 DB_PASSWORD 가 비어 있습니다." >&2
  exit 1
fi

# docker compose 명령 결정 (v2 플러그인 우선)
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "ERROR: docker compose 를 찾을 수 없습니다." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TS="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/${DB_NAME}-${TS}.sql.gz"

echo "[$(date '+%F %T')] 백업 시작 → $OUT"

# -T: TTY 비할당(cron/비대화 환경). 비밀번호는 환경변수로 전달해 ps 노출 최소화.
$DC exec -T -e MYSQL_PWD="$DB_PASSWORD" mysql \
  mysqldump -uroot --single-transaction --quick --no-tablespaces \
  --default-character-set=utf8mb4 "$DB_NAME" | gzip > "$OUT"

# 빈/실패 파일 가드
if [[ ! -s "$OUT" ]]; then
  echo "ERROR: 백업 파일이 비어 있습니다. 덤프 실패로 간주하고 삭제합니다." >&2
  rm -f "$OUT"
  exit 1
fi

echo "[$(date '+%F %T')] 백업 완료: $(du -h "$OUT" | cut -f1)"

# 보존기간 초과 백업 정리
find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -print -delete

echo "[$(date '+%F %T')] 완료. 보존: 최근 ${RETENTION_DAYS}일"
