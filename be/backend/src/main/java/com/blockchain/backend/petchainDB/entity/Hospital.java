package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "hospitals")
@Getter @Setter @NoArgsConstructor
public class Hospital extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "member_number", nullable = false, unique = true, length = 20)
    private String memberNumber;

    @Column(name = "business_number", length = 20, unique = true)
    private String businessNumber;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String address;

    @Column(length = 30)
    private String phone;

    @Column(name = "fabric_org_id", length = 100, unique = true)
    private String fabricOrgId;

    @Column(name = "admin_email", length = 255)
    private String adminEmail;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;  // 관리자 승인 후 true
}
