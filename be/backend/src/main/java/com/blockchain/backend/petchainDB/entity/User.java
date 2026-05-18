package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_oauth", columnList = "oauth_provider, oauth_provider_id")
})
@Getter @Setter @NoArgsConstructor
public class User extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_id", nullable = false, unique = true, length = 100)
    private String loginId;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    // user | hospital | insurance | admin  (보호자는 guardian 대신 user로 사용)
    @Column(name = "member_type", nullable = false, length = 20)
    private String memberType;

    // active | suspended | withdrawn
    @Column(name = "status", nullable = false, length = 20)
    private String status = "active";

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // OAuth 로그인 제공자: google | naver | kakao | null (이메일 가입자)
    @Column(name = "oauth_provider", length = 20)
    private String oauthProvider;

    // OAuth 제공자의 고유 사용자 ID
    @Column(name = "oauth_provider_id", length = 255)
    private String oauthProviderId;
}
