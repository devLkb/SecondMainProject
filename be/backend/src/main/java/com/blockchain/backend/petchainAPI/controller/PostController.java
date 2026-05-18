package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.post.PostDtos;
import com.blockchain.backend.petchainAPI.port.PostApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostApiPort postApiPort;

    @PostMapping
    public ResponseEntity<PostDtos.PostResponse> createPost(
            ApiActor actor,
            @Valid @RequestBody PostDtos.CreatePostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postApiPort.createPost(actor, request));
    }

    @GetMapping
    public ResponseEntity<Page<PostDtos.PostSummaryResponse>> listPosts(
            ApiActor actor,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(postApiPort.listPosts(actor, region, page, size));
    }

    // 지역별 인기글: 최근 30일 내 작성글 중 좋아요 상위 10개
    // region 생략 시 전체 지역 대상. {postId} 보다 먼저 매칭되도록 리터럴 경로 사용
    @GetMapping("/popular")
    public ResponseEntity<List<PostDtos.PostSummaryResponse>> listPopularPosts(
            ApiActor actor,
            @RequestParam(required = false) String region) {
        return ResponseEntity.ok(postApiPort.listPopularPosts(actor, region));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostDtos.PostDetailResponse> getPost(
            ApiActor actor,
            @PathVariable Long postId) {
        return ResponseEntity.ok(postApiPort.getPost(actor, postId));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            ApiActor actor,
            @PathVariable Long postId) {
        postApiPort.deletePost(actor, postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/likes")
    public ResponseEntity<PostDtos.LikeResponse> toggleLike(
            ApiActor actor,
            @PathVariable Long postId) {
        return ResponseEntity.ok(postApiPort.toggleLike(actor, postId));
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<PostDtos.CommentResponse> addComment(
            ApiActor actor,
            @PathVariable Long postId,
            @Valid @RequestBody PostDtos.CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postApiPort.addComment(actor, postId, request));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            ApiActor actor,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        postApiPort.deleteComment(actor, postId, commentId);
        return ResponseEntity.noContent().build();
    }

    // S3 업로드 완료 후 프론트에서 s3Key를 받아 DB에 메타데이터 저장
    @PostMapping("/{postId}/images")
    public ResponseEntity<PostDtos.PostImageResponse> savePostImage(
            ApiActor actor,
            @PathVariable Long postId,
            @Valid @RequestBody PostDtos.SaveImageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postApiPort.savePostImage(actor, postId, request));
    }
}
