package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Check;

import java.time.LocalDateTime;

@Entity
@Table(name = "point_balances",
        uniqueConstraints = @UniqueConstraint(columnNames = {"owner_type", "owner_id"}))
// 잔액이 음수가 되는 것을 DB 레벨에서 차단한다.
@Check(constraints = "balance >= 0")
@Getter @Setter @NoArgsConstructor
public class PointBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 동시 갱신 충돌을 감지하는 낙관적 락 버전
    @Version
    @Column(name = "version")
    private Long version;

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
