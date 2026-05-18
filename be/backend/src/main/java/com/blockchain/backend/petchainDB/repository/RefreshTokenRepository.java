package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken r SET r.isRevoked = true WHERE r.user.id = :userId")
    void revokeAllByUserId(@Param("userId") Long userId);

    // 만료된 refresh token을 일괄 삭제하고 삭제된 행 수를 반환한다.
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") LocalDateTime cutoff);
}
