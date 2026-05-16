package com.blockchain.backend.petchainDB.entity;

import com.blockchain.backend.petchainLOGIN.util.MemberNumberGenerator;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_records")
@Getter @Setter @NoArgsConstructor
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_id", nullable = false, unique = true, length = 30)
    private String recordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(name = "total_cost", nullable = false)
    private Integer totalCost;

    @Column(name = "treatment_date", nullable = false)
    private LocalDate treatmentDate;

    @Column(name = "detail_data_hash", nullable = false, length = 64)
    private String detailDataHash;

    @Column(name = "findings_encrypted", columnDefinition = "MEDIUMTEXT")
    private String findingsEncrypted;

    @Column(name = "prescription_encrypted", columnDefinition = "MEDIUMTEXT")
    private String prescriptionEncrypted;

    @Column(name = "test_results_encrypted", columnDefinition = "MEDIUMTEXT")
    private String testResultsEncrypted;

    @Column(name = "fabric_tx_id", length = 64)
    private String fabricTxId;

    @Column(name = "on_chain_status", nullable = false, length = 20)
    private String onChainStatus = "pending"; // pending | confirmed | failed

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (recordId == null) {
            recordId = MemberNumberGenerator.generateRecordId();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
