package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostImageRepository extends JpaRepository<PostImage, Long> {
    List<PostImage> findByPost_IdOrderByDisplayOrderAsc(Long postId);
    int countByPost_Id(Long postId);
}
