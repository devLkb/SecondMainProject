#!/bin/bash
# PetChain 전체 스택 자동 시작 스크립트
# 1. Fabric 네트워크 기동 + 체인코드 배포
# 2. Spring Boot 체인 인증서 환경변수 설정
# 3. Spring Boot 백엔드 실행

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env}"

# .env 값을 선택적으로 읽는다. 이미 셸 환경변수로 넘긴 값이 있으면 그 값을 우선한다.
read_env() {
  local key="$1"
  [[ -f "$ENV_FILE" ]] || return 0
  grep -E "^${key}=" "$ENV_FILE" | head -n1 | cut -d= -f2- \
    | sed -e 's/[[:space:]]*#.*$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' \
          -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}

env_or_file() {
  local key="$1"
  local default_value="$2"
  local current_value="${!key:-}"
  local file_value=""

  if [[ -n "$current_value" ]]; then
    printf '%s' "$current_value"
    return
  fi

  file_value="$(read_env "$key")"
  if [[ -n "$file_value" ]]; then
    printf '%s' "$file_value"
  else
    printf '%s' "$default_value"
  fi
}

resolve_path() {
  local raw_path="$1"

  if [[ "$raw_path" == '~' ]]; then
    raw_path="$HOME"
  elif [[ "$raw_path" == '~/'* ]]; then
    raw_path="$HOME/${raw_path#~/}"
  elif [[ "$raw_path" == '$HOME'* ]]; then
    raw_path="$HOME${raw_path#\$HOME}"
  fi

  if [[ "$raw_path" != /* ]]; then
    raw_path="$REPO_ROOT/$raw_path"
  fi

  printf '%s' "$raw_path"
}

NETWORK_DIR="$(resolve_path "$(env_or_file FABRIC_NETWORK_DIR "$HOME/go/src/fabric-samples/test-network")")"
CHAINCODE_DIR="$(resolve_path "$(env_or_file CHAINCODE_DIR "$REPO_ROOT/chaincode/petchain")")"
BACKEND_DIR="$(resolve_path "$(env_or_file BACKEND_DIR "$REPO_ROOT/be/backend")")"
FRONTEND_DIR="$(resolve_path "$(env_or_file FRONTEND_DIR "$REPO_ROOT/fe/petchain")")"
CHANNEL="$(env_or_file CHAIN_CHANNEL "petchannel")"
CC_NAME="$(env_or_file CHAIN_CHAINCODE "petchain")"
CHAIN_MSP_ID="$(env_or_file CHAIN_MSP_ID "Org1MSP")"
CHAIN_PEER_ENDPOINT="$(env_or_file CHAIN_PEER_ENDPOINT "localhost:7051")"
CHAIN_PEER_HOST_OVERRIDE="$(env_or_file CHAIN_PEER_HOST_OVERRIDE "peer0.org1.example.com")"

echo "=============================="
echo " PetChain 스택 시작"
echo "=============================="

# ── 1. Fabric 네트워크 기동 ──────────────────────────────────────
echo ""
echo "[1/4] Fabric 네트워크 시작 중..."
cd "$NETWORK_DIR"

# 이미 실행 중인 컨테이너 정리
./network.sh down 2>/dev/null || true
docker rm -f orderer.example.com peer0.org1.example.com peer0.org2.example.com cli couchdb0 2>/dev/null || true

./network.sh up createChannel -ca -c "$CHANNEL"
echo "✅ 네트워크 + 채널 생성 완료"

# ── 2. 체인코드 배포 ─────────────────────────────────────────────
echo ""
echo "[2/4] 체인코드 배포 중..."
./network.sh deployCC \
  -c "$CHANNEL" \
  -ccn "$CC_NAME" \
  -ccp "$CHAINCODE_DIR" \
  -ccl go
echo "✅ 체인코드 배포 완료"

# ── 3. 인증서 경로 추출 → Spring Boot 환경변수 설정 ───────────
echo ""
echo "[3/4] 인증서 경로 설정 중..."

ORG1_DIR="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com"

TLS_CERT="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
CERT_PATH=$(find "$ORG1_DIR/users/User1@org1.example.com/msp/signcerts" -name "*.pem" | head -1)
KEY_DIR="$ORG1_DIR/users/User1@org1.example.com/msp/keystore/"

if [ ! -f "$TLS_CERT" ]; then
  echo "❌ TLS 인증서를 찾을 수 없습니다: $TLS_CERT"
  exit 1
fi

# Spring Boot 는 application.properties 의 ${ENV_VAR:default} placeholder 를 사용한다.
# 레포 파일을 팀원별 절대경로로 덮어쓰지 않고 현재 프로세스 환경변수로만 전달한다.
export CHAIN_ENABLED="$(env_or_file CHAIN_ENABLED "true")"
export CHAIN_MSP_ID
export CHAIN_CHANNEL="$CHANNEL"
export CHAIN_CHAINCODE="$CC_NAME"
export CHAIN_PEER_ENDPOINT
export CHAIN_PEER_HOST_OVERRIDE
export CHAIN_TLS_CERT_PATH="$TLS_CERT"
export CHAIN_CERT_PATH="$CERT_PATH"
export CHAIN_KEY_DIR="$KEY_DIR"

echo "✅ 체인 연결 환경변수 설정 완료"
echo "   TLS cert : $TLS_CERT"
echo "   cert     : $CERT_PATH"
echo "   keydir   : $KEY_DIR"

# ── 4. 백엔드 빌드 + 실행 ────────────────────────────────────────
echo ""
echo "[4/4] Spring Boot 백엔드 빌드 + 시작..."
cd "$BACKEND_DIR"

# MySQL 확인 (로컬 또는 Docker)
if ! mysqladmin -u root -p1234 status 2>/dev/null; then
  echo "⚠️  로컬 MySQL이 없습니다. Docker로 MySQL 시작..."
  docker start petchain-mysql 2>/dev/null || \
    docker run -d --name petchain-mysql \
      -e MYSQL_ROOT_PASSWORD=1234 \
      -e MYSQL_DATABASE=petchain \
      -p 3306:3306 mysql:8.0 \
      --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
  echo "MySQL 준비 대기..."
  until docker exec petchain-mysql mysqladmin ping -uroot -p1234 --silent 2>/dev/null; do sleep 2; done
fi

echo ""
echo "=============================="
echo " 모든 준비 완료! 백엔드 실행"
echo " http://localhost:8080"
echo "=============================="
./gradlew bootRun &
BACKEND_PID=$!

# ── 5. 프론트엔드 개발 서버 기동 ─────────────────────────────────
echo ""
echo "[5/5] 프론트엔드 개발 서버 시작..."
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  echo "node_modules 없음, npm install 실행..."
  npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=============================="
echo " ✅ PetChain 전체 스택 실행 중"
echo " 백엔드  : http://localhost:8080"
echo " 프론트  : http://localhost:5173"
echo "=============================="
echo " 종료하려면 Ctrl+C 를 누르세요"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ 종료 완료'" SIGINT SIGTERM
wait
