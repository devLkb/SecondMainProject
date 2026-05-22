#!/bin/bash
# PetChain 전체 스택 자동 시작 스크립트
# 1. Fabric 네트워크 기동 + 체인코드 배포
# 2. application.properties 인증서 경로 설정
# 3. Spring Boot 백엔드 실행

set -e

NETWORK_DIR="/home/ubuntu/go/src/fabric-samples/test-network"
CHAINCODE_DIR="/home/ubuntu/pointpro/chaincode/petchain"
BACKEND_DIR="/home/ubuntu/pointpro/be/backend"
APP_PROPS="$BACKEND_DIR/src/main/resources/application.properties"
CHANNEL="petchannel"
CC_NAME="petchain"

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

# ── 3. 인증서 경로 추출 → application.properties 갱신 ───────────
echo ""
echo "[3/4] 인증서 경로 설정 중..."

ORG1_DIR="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com"
ORDERER_DIR="$NETWORK_DIR/organizations/ordererOrganizations/example.com"

TLS_CERT="$NETWORK_DIR/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
CERT_PATH=$(find "$ORG1_DIR/users/User1@org1.example.com/msp/signcerts" -name "*.pem" | head -1)
KEY_DIR="$ORG1_DIR/users/User1@org1.example.com/msp/keystore/"

if [ ! -f "$TLS_CERT" ]; then
  echo "❌ TLS 인증서를 찾을 수 없습니다: $TLS_CERT"
  exit 1
fi

# application.properties 인증서/키 경로 업데이트
sed -i "s|chain.tls-cert-path=.*|chain.tls-cert-path=$TLS_CERT|" "$APP_PROPS"
sed -i "s|chain.cert-path=.*|chain.cert-path=$CERT_PATH|" "$APP_PROPS"
sed -i "s|chain.key-dir=.*|chain.key-dir=$KEY_DIR|" "$APP_PROPS"
sed -i "s|chain.enabled=.*|chain.enabled=true|" "$APP_PROPS"
sed -i "s|chain.msp-id=.*|chain.msp-id=Org1MSP|" "$APP_PROPS"
sed -i "s|chain.channel=.*|chain.channel=$CHANNEL|" "$APP_PROPS"
sed -i "s|chain.chaincode=.*|chain.chaincode=$CC_NAME|" "$APP_PROPS"
sed -i "s|chain.peer-endpoint=.*|chain.peer-endpoint=localhost:7051|" "$APP_PROPS"
sed -i "s|chain.peer-host-override=.*|chain.peer-host-override=peer0.org1.example.com|" "$APP_PROPS"

echo "✅ application.properties 업데이트 완료"
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
FRONTEND_DIR="/home/ubuntu/pointpro/fe/petchain"
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
