package com.blockchain.backend.petchainDB.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * 운영(prod) 프로파일로 부팅할 때 보안에 민감한 설정이 기본값 그대로인지 검사한다.
 * 기본값이 감지되면 즉시 부팅을 실패시켜 위험한 상태로 서비스가 뜨는 것을 막는다.
 */
@Component
@RequiredArgsConstructor
public class ProductionConfigGuard implements ApplicationRunner {

    private static final String DEFAULT_JWT_SECRET =
            "petchain-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256-algo";
    private static final String DEFAULT_DB_PASSWORD = "1234";

    private final Environment environment;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!environment.matchesProfiles("prod")) {
            return;
        }
        if (DEFAULT_JWT_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException(
                    "운영 환경에서는 JWT_SECRET 환경변수를 기본값이 아닌 값으로 반드시 설정해야 합니다.");
        }
        if (DEFAULT_DB_PASSWORD.equals(dbPassword)) {
            throw new IllegalStateException(
                    "운영 환경에서는 DB_PASSWORD 환경변수를 기본값이 아닌 값으로 반드시 설정해야 합니다.");
        }
    }
}
