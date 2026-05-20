package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

// 보험사가 검증 후 플랫폼에 전달하는 이상 신고. 플랫폼 관리자가 검토·처리한다.
// 진료기록이 삭제되어도 신고 내역이 남도록 펫/병원/질병/진료비를 스냅샷으로 보관한다.
@Entity
@Table(name = "record_flags")
@Getter @Setter @NoArgsConstructor
public class RecordFlag extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_id", nullable = false, length = 40)
    private String recordId;

    @Column(name = "verification_id", length = 40)
    private String verificationId;

    @Column(name = "reason_code", nullable = false, length = 40)
    private String reasonCode;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String note;

    // PENDING | REVIEWING | RESOLVED
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "reported_by_insurer_id")
    private Long reportedByInsurerId;

    @Column(name = "pet_name", length = 100)
    private String petName;

    @Column(name = "hospital_name", length = 200)
    private String hospitalName;

    @Column(length = 100)
    private String disease;

    private Integer cost;

    @Column(name = "resolve_code", length = 40)
    private String resolveCode;

    @Column(name = "resolve_note", columnDefinition = "MEDIUMTEXT")
    private String resolveNote;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
}
