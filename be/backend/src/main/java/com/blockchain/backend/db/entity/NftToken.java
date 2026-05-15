package com.blockchain.backend.db.entity;

import com.blockchain.backend.util.MemberNumberGenerator;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "nft_tokens")
@Getter @Setter @NoArgsConstructor
public class NftToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_id", nullable = false, unique = true, length = 100)
    private String tokenId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_package_id", nullable = false, unique = true)
    private ClaimPackage claimPackage;

    @Column(name = "record_id", nullable = false, length = 30)
    private String recordId;

    @Column(name = "claim_id", nullable = false, length = 30)
    private String claimId;

    @Column(name = "detail_hash", nullable = false, length = 64)
    private String detailHash;

    @Column(name = "issued_by", nullable = false, length = 100)
    private String issuedBy;

    @Column(name = "fabric_tx_id", length = 64)
    private String fabricTxId;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private LocalDateTime issuedAt;

    @PrePersist
    protected void onCreate() {
        if (tokenId == null) {
            tokenId = MemberNumberGenerator.generateNftTokenId();
        }
        issuedAt = LocalDateTime.now();
    }
}
