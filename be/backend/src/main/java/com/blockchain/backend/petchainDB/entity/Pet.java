package com.blockchain.backend.petchainDB.entity;

import com.blockchain.backend.petchainLOGIN.util.MemberNumberGenerator;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "pets")
@Getter @Setter @NoArgsConstructor
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guardian_id", nullable = false)
    private Guardian guardian;

    @Column(name = "pet_number", nullable = false, unique = true, length = 20)
    private String petNumber;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 30)
    private String species; // dog | cat | rabbit | other

    @Column(length = 100)
    private String breed;

    @Column(name = "birth_year")
    private Integer birthYear;

    @Column(length = 10)
    private String gender; // male | female | unknown

    @Column(name = "microchip_hash", length = 64, unique = true)
    private String microchipHash;

    @Column(name = "sbt_token_id", length = 100, unique = true)
    private String sbtTokenId;

    @Column(name = "sbt_status", nullable = false, length = 20)
    private String sbtStatus = "pending"; // pending | issued

    @Column(name = "is_neutered")
    private Boolean isNeutered;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (petNumber == null) {
            petNumber = MemberNumberGenerator.generatePetNumber();
        }
        registeredAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
