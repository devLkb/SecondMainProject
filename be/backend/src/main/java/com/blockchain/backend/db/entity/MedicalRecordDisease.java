package com.blockchain.backend.db.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medical_record_diseases",
        uniqueConstraints = @UniqueConstraint(columnNames = {"medical_record_id", "disease_code"}))
@Getter @Setter @NoArgsConstructor
public class MedicalRecordDisease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_code", nullable = false)
    private DiseaseCode diseaseCode;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;
}
