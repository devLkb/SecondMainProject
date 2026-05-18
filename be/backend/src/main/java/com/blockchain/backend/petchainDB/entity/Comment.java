package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "post_comments", indexes = {
    // 루트 댓글 + 게시물별 댓글 수 집계
    @Index(name = "idx_comments_post_root", columnList = "post_id, parent_comment_id, is_deleted, created_at"),
    // 대댓글 조회: WHERE parent_comment_id=? AND is_deleted=false ORDER BY created_at ASC
    @Index(name = "idx_comments_parent", columnList = "parent_comment_id, is_deleted, created_at")
})
@Getter @Setter @NoArgsConstructor
public class Comment extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // null이면 최상위 댓글, 값이 있으면 대댓글
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}
