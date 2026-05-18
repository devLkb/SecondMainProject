package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_images", indexes = {
    // 게시물별 이미지 조회 + 표시 순서 정렬
    @Index(name = "idx_post_images_post", columnList = "post_id, display_order")
})
@Getter @Setter @NoArgsConstructor
public class PostImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    // S3 사용 시 객체 키. 인라인 base64 저장 시에는 null.
    @Column(name = "s3_key", length = 500)
    private String s3Key;

    // 인라인 이미지(base64 data URL) — S3 미사용 환경에서 이미지 본문을 DB에 직접 보관.
    @Column(name = "image_data", columnDefinition = "LONGTEXT")
    private String imageData;

    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    // 게시물 내 이미지 표시 순서 (0부터, 첨부 순서대로 증가)
    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
