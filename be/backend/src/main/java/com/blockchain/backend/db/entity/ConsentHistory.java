package com.blockchain.backend.db.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "consent_history")
@Getter @Setter @NoArgsConstructor
public class ConsentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_package_id", nullable = false)
    private ClaimPackage claimPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guardian_id", nullable = false)
    private Guardian guardian;

    @Column(nullable = false, length = 20)
    private String action; // consent | revoke

    @Column(name = "previous_status", length = 20)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 20)
    private String newStatus;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "fabric_tx_id", length = 64)
    private String fabricTxId;

    @Column(name = "acted_at", nullable = false, updatable = false)
    private LocalDateTime actedAt;

    @PrePersist
    protected void onCreate() {
        actedAt = LocalDateTime.now();
    }
}
