//Go 프로젝트 의존성 파일입니다. Fabric contract API, chaincode shim 같은 라이브러리 버전을 관리합니다.
module petchain-chaincode

go 1.16

require (
	github.com/hyperledger/fabric-chaincode-go v0.0.0-20200424173110-d7076418f212
	github.com/hyperledger/fabric-contract-api-go v1.1.1
)
