package com.blockchain.backend.petchainDB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "comment_likes", uniqueConstraints = {
    @UniqueConstraint(name = "uk_comment_likes_comment_user", columnNames = {"comment_id", "user_id"})
})
@Getter @Setter @NoArgsConstructor
public class CommentLike extends TimestampedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
