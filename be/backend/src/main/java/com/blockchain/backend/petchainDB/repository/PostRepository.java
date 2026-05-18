package com.blockchain.backend.petchainDB.repository;

import com.blockchain.backend.petchainDB.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    // author를 JOIN FETCH해서 N+1 방지
    @Query(value = "SELECT p FROM Post p JOIN FETCH p.author WHERE p.isDeleted = false ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Post p WHERE p.isDeleted = false")
    Page<Post> findWithAuthor(Pageable pageable);

    @Query(value = "SELECT p FROM Post p JOIN FETCH p.author WHERE p.isDeleted = false AND p.authorRegion = :region ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Post p WHERE p.isDeleted = false AND p.authorRegion = :region")
    Page<Post> findWithAuthorByRegion(@Param("region") String region, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.id = :postId")
    java.util.Optional<Post> findWithAuthorById(@Param("postId") Long postId);

    /**
     * 인기글: since 이후 작성된 삭제되지 않은 게시물을 좋아요 수 내림차순으로 조회.
     * region이 null이면 전체 지역, 값이 있으면 해당 지역만.
     * 결과는 Object[]{Post, Long likeCount}. 상위 N개 제한은 Pageable로 전달.
     */
    @Query("SELECT p, COUNT(pl) AS likeCount " +
           "FROM Post p LEFT JOIN PostLike pl ON pl.post = p " +
           "WHERE p.isDeleted = false AND p.createdAt >= :since " +
           "AND (:region IS NULL OR p.authorRegion = :region) " +
           "GROUP BY p " +
           "ORDER BY COUNT(pl) DESC, p.createdAt DESC")
    List<Object[]> findPopular(@Param("since") LocalDateTime since,
                               @Param("region") String region,
                               Pageable pageable);
}
