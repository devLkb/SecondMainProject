package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "posts", indexes = {
    // 목록 조회: WHERE is_deleted=false ORDER BY created_at DESC
    @Index(name = "idx_posts_active_created", columnList = "is_deleted, created_at"),
    // 지역별 조회: WHERE author_region=? AND is_deleted=false ORDER BY created_at DESC
    @Index(name = "idx_posts_region_created", columnList = "author_region, is_deleted, created_at")
})
@Getter @Setter @NoArgsConstructor
public class Post extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "author_region", length = 50)
    private String authorRegion;

    @Column(name = "pet_name", length = 100)
    private String petName;

    @Column(name = "pet_breed", length = 100)
    private String petBreed;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}
