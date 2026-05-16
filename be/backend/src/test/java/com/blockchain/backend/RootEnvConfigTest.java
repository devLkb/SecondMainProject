package com.blockchain.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

class RootEnvConfigTest {

    @TempDir
    Path tempDir;

    @Test
    void importsConfiguredDotenvFileForBackendProperties() throws IOException {
        Path dotenv = tempDir.resolve(".env");
        Files.writeString(dotenv, """
                DB_HOST=env-mysql
                DB_PORT=3307
                DB_NAME=env_petchain
                DB_USERNAME=env_user
                DB_PASSWORD=env_password
                JWT_SECRET=env-jwt-secret-key-must-be-at-least-32-characters
                JWT_ACCESS_TOKEN_EXPIRATION=12345 # access token ms
                JWT_REFRESH_TOKEN_EXPIRATION=67890 # refresh token ms
                SERVER_PORT=18080
                """);

        SpringApplication application = new SpringApplication(EnvironmentOnlyConfig.class);
        application.setWebApplicationType(WebApplicationType.NONE);

        try (ConfigurableApplicationContext context = application.run(
                "--PETCHAIN_ENV_FILE=" + dotenv.toAbsolutePath(),
                "--spring.main.banner-mode=off"
        )) {
            Environment environment = context.getEnvironment();

            assertThat(environment.getProperty("spring.datasource.url"))
                    .contains("env-mysql:3307/env_petchain");
            assertThat(environment.getProperty("spring.datasource.username")).isEqualTo("env_user");
            assertThat(environment.getProperty("spring.datasource.password")).isEqualTo("env_password");
            assertThat(environment.getProperty("jwt.secret"))
                    .isEqualTo("env-jwt-secret-key-must-be-at-least-32-characters");
            assertThat(environment.getProperty("jwt.access-token-expiration")).isEqualTo("12345");
            assertThat(environment.getProperty("jwt.refresh-token-expiration")).isEqualTo("67890");
            assertThat(environment.getProperty("server.port")).isEqualTo("18080");
        }
    }

    @Configuration(proxyBeanMethods = false)
    static class EnvironmentOnlyConfig {
    }
}
