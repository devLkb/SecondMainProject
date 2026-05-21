package com.blockchain.backend.chain;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "chain")
public class ChainProperties {
    private boolean enabled = false;
    private String mspId = "Org1MSP";
    private String channel = "petchannel";
    private String chaincode = "petchain";
    private String peerEndpoint = "localhost:7051";
    private String peerHostOverride = "peer0.org1.example.com";
    private String tlsCertPath = "";
    private String certPath = "";
    private String keyDir = "";
}
