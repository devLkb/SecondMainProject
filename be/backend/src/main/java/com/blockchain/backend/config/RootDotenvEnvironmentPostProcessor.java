package com.blockchain.backend.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

public class RootDotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String PROPERTY_SOURCE_NAME = "petchainRootDotenv";
    private static final String ENV_FILE_PROPERTY = "PETCHAIN_ENV_FILE";
    private static final String DEFAULT_ENV_FILE_NAME = ".env";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path envFile = resolveEnvFile(environment);
        if (!Files.isRegularFile(envFile) || !Files.isReadable(envFile)) {
            return;
        }

        Map<String, Object> properties = readDotenv(envFile, environment);
        if (!properties.isEmpty()) {
            environment.getPropertySources().addLast(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        }
    }

    private Path resolveEnvFile(ConfigurableEnvironment environment) {
        String configuredEnvFile = environment.getProperty(ENV_FILE_PROPERTY);
        if (StringUtils.hasText(configuredEnvFile)) {
            return Path.of(configuredEnvFile.trim());
        }
        return findNearestDotenv(Path.of("").toAbsolutePath())
                .orElse(Path.of(DEFAULT_ENV_FILE_NAME));
    }

    private Optional<Path> findNearestDotenv(Path start) {
        Path current = start;
        while (current != null) {
            Path candidate = current.resolve(DEFAULT_ENV_FILE_NAME);
            if (Files.isRegularFile(candidate)) {
                return Optional.of(candidate);
            }
            current = current.getParent();
        }
        return Optional.empty();
    }

    private Map<String, Object> readDotenv(Path envFile, ConfigurableEnvironment environment) {
        Map<String, Object> properties = new LinkedHashMap<>();
        try {
            for (String line : Files.readAllLines(envFile, StandardCharsets.UTF_8)) {
                DotenvEntry entry = parseLine(line);
                if (entry == null || environment.containsProperty(entry.key())) {
                    continue;
                }
                properties.put(entry.key(), entry.value());
            }
        } catch (IOException ignored) {
            return Map.of();
        }
        return properties;
    }

    private DotenvEntry parseLine(String line) {
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
            return null;
        }
        if (trimmed.startsWith("export ")) {
            trimmed = trimmed.substring("export ".length()).trim();
        }

        int separator = trimmed.indexOf('=');
        if (separator <= 0) {
            return null;
        }

        String key = trimmed.substring(0, separator).trim();
        if (!key.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            return null;
        }

        String value = trimmed.substring(separator + 1).trim();
        return new DotenvEntry(key, normalizeValue(value));
    }

    private String normalizeValue(String value) {
        if (value.length() >= 2) {
            char quote = value.charAt(0);
            if ((quote == '"' || quote == '\'') && value.charAt(value.length() - 1) == quote) {
                return value.substring(1, value.length() - 1);
            }
        }

        int inlineCommentStart = findInlineCommentStart(value);
        if (inlineCommentStart >= 0) {
            value = value.substring(0, inlineCommentStart).trim();
        }

        if (value.length() >= 2) {
            char quote = value.charAt(0);
            if ((quote == '"' || quote == '\'') && value.charAt(value.length() - 1) == quote) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }

    private int findInlineCommentStart(String value) {
        boolean inSingleQuote = false;
        boolean inDoubleQuote = false;

        for (int index = 0; index < value.length(); index++) {
            char current = value.charAt(index);
            if (current == '\'' && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
                continue;
            }
            if (current == '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
                continue;
            }
            if (current == '#' && !inSingleQuote && !inDoubleQuote && index > 0
                    && Character.isWhitespace(value.charAt(index - 1))) {
                return index;
            }
        }
        return -1;
    }

    private record DotenvEntry(String key, String value) {
    }
}
