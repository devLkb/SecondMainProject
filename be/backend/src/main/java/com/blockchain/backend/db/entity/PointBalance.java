package com.blockchain.backend.db.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "point_balances",
        uniqueConstraints = @UniqueConstraint(columnNames = {"owner_type", "owner_id"}))
@Getter @Setter @NoArgsConstructor
public class PointBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // hospital | insurance  (폴리모픽: DB FK 없음, 앱 레벨 보장)
    @Column(name = "owner_type", nullable = false, length = 20)
    private String ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(nullable = false)
    private Integer balance = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
