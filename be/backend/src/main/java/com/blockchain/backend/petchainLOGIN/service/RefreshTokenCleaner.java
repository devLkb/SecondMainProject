package com.blockchain.backend.petchainLOGIN.service;

import com.blockchain.backend.petchainDB.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 만료된 refresh token을 주기적으로 삭제해 테이블이 무한히 커지는 것을 막는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RefreshTokenCleaner {

    private final RefreshTokenRepository refreshTokenRepository;

    // 매일 새벽 4시에 만료된 토큰을 일괄 삭제한다.
    @Scheduled(cron = "0 0 4 * * *")
    public void purgeExpiredTokens() {
        int deleted = refreshTokenRepository.deleteExpiredBefore(LocalDateTime.now());
        if (deleted > 0) {
            log.info("만료된 refresh token {}건을 삭제했습니다.", deleted);
        }
    }
}
