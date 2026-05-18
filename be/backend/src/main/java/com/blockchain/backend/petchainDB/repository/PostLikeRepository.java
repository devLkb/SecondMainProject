package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByPost_IdAndUser_Id(Long postId, Long userId);
    long countByPost_Id(Long postId);
    boolean existsByPost_IdAndUser_Id(Long postId, Long userId);
}
