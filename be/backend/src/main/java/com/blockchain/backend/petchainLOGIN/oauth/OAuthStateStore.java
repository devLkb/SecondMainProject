package com.blockchain.backend.petchainLOGIN.oauth;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OAuth CSRF 방지용 state 파라미터를 인메모리로 관리한다.
 * state는 10분 TTL을 가지며, 검증 시 즉시 제거(1회용)된다.
 */
@Component
public class OAuthStateStore {

    private static final long TTL_SECONDS = 600L;

    private final Map<String, Instant> store = new ConcurrentHashMap<>();

    public String generate() {
        String state = UUID.randomUUID().toString();
        store.put(state, Instant.now().plusSeconds(TTL_SECONDS));
        evictExpired();
        return state;
    }

    public void validate(String state) {
        Instant expiry = store.remove(state);
        if (expiry == null || Instant.now().isAfter(expiry)) {
            throw new IllegalArgumentException("유효하지 않은 OAuth 요청입니다. 다시 시도해주세요.");
        }
    }

    private void evictExpired() {
        Instant now = Instant.now();
        store.entrySet().removeIf(e -> now.isAfter(e.getValue()));
    }
}
