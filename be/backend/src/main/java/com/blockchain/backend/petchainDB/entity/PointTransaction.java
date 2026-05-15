package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "point_transactions")
@Getter @Setter @NoArgsConstructor
public class PointTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tx_type", nullable = false, length = 20)
    private String txType; // issue | spend | reward | burn | transfer

    // 폴리모픽: platform | hospital | insurance
    @Column(name = "from_owner_type", length = 20)
    private String fromOwnerType;

    @Column(name = "from_owner_id")
    private Long fromOwnerId;

    @Column(name = "to_owner_type", length = 20)
    private String toOwnerType;

    @Column(name = "to_owner_id")
    private Long toOwnerId;

    @Column(nullable = false)
    private Integer amount;

    @Column(length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_claim_id")
    private ClaimPackage relatedClaim;

    @Column(name = "fabric_tx_id", length = 64)
    private String fabricTxId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
