package com.blockchain.backend.petchainLOGIN.oauth;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "oauth")
@Getter
@Setter
public class OAuthProperties {

    private ProviderConfig google = new ProviderConfig();
    private ProviderConfig naver  = new ProviderConfig();
    private ProviderConfig kakao  = new ProviderConfig();

    @Getter
    @Setter
    public static class ProviderConfig {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }
}
