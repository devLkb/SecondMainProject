package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// member_type='user' 인 회원의 프로필 테이블 (보호자)
@Entity
@Table(name = "guardians")
@Getter @Setter @NoArgsConstructor
public class Guardian {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 255)
    private String name;  // AES-256 암호화 예정

    @Column(length = 255)
    private String phone;  // AES-256 암호화 예정

    @Column(length = 255)
    private String email;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String address;  // AES-256 암호화 예정

    // none | pending | verified
    @Column(name = "member_number", nullable = false, unique = true, length = 20)
    private String memberNumber;

    @Column(name = "identity_verified", nullable = false, length = 20)
    private String identityVerified = "none";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
