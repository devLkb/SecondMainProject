package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medical_record_treatments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"medical_record_id", "treatment_code"}))
@Getter @Setter @NoArgsConstructor
public class MedicalRecordTreatment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecord medicalRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "treatment_code", nullable = false)
    private TreatmentCode treatmentCode;

    @Column(name = "unit_cost")
    private Integer unitCost;
}
