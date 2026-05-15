package com.blockchain.backend.db.entity;

import com.blockchain.backend.util.MemberNumberGenerator;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "claim_packages",
        uniqueConstraints = @UniqueConstraint(columnNames = {"medical_record_id", "insurance_company_id"}))
@Getter @Setter @NoArgsConstructor
public class ClaimPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_id", nullable = false, unique = true, length = 30)
    private String claimId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_insurance_id", nullable = false)
    private PetInsurance petInsurance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insurance_company_id", nullable = false)
    private InsuranceCompany insuranceCompany;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guardian_id", nullable = false)
    private Guardian guardian;

    @Column(name = "consent_status", nullable = false, length = 20)
    private String consentStatus = "pending"; // pending | active | revoked

    @Column(name = "claim_status", nullable = false, length = 20)
    private String claimStatus = "pending"; // pending | requested | verified | approved | rejected

    @Column(name = "fabric_tx_id", length = 64)
    private String fabricTxId;

    @Column(name = "verify_tx_id", length = 64)
    private String verifyTxId;

    @Column(name = "review_result", length = 20)
    private String reviewResult; // approved | rejected

    @Column(name = "review_note", columnDefinition = "MEDIUMTEXT")
    private String reviewNote;

    @Column(name = "consented_at")
    private LocalDateTime consentedAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (claimId == null) {
            claimId = MemberNumberGenerator.generateClaimId();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
