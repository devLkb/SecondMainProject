package com.blockchain.backend.petchainAPI.controller;

import com.blockchain.backend.petchainAPI.dto.common.ApiResponse;
import com.blockchain.backend.petchainAPI.dto.post.PostDtos;
import com.blockchain.backend.petchainAPI.port.PostApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/posts", "/api/posts"})
@RequiredArgsConstructor
public class PostController {

    private final PostApiPort postApiPort;

    @PostMapping
    public ResponseEntity<ApiResponse<PostDtos.PostResponse>> createPost(
            ApiActor actor,
            @Valid @RequestBody PostDtos.CreatePostRequest createPostRequest,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(postApiPort.createPost(actor, createPostRequest), request));
    }

    @GetMapping
    public ApiResponse<Page<PostDtos.PostSummaryResponse>> listPosts(
            ApiActor actor,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {
        return ApiResponse.of(postApiPort.listPosts(actor, region, page, size), request);
    }

    @GetMapping("/popular")
    public ApiResponse<List<PostDtos.PostSummaryResponse>> listPopularPosts(
            ApiActor actor,
            @RequestParam(required = false) String region,
            HttpServletRequest request) {
        return ApiResponse.of(postApiPort.listPopularPosts(actor, region), request);
    }

    @GetMapping("/popular/by-region")
    public ApiResponse<List<PostDtos.RegionTopPostResponse>> listTopPostByRegion(
            ApiActor actor,
            HttpServletRequest request) {
        return ApiResponse.of(postApiPort.listTopPostByRegion(actor), request);
    }

    @GetMapping("/{postId}")
    public ApiResponse<PostDtos.PostDetailResponse> getPost(
            ApiActor actor,
            @PathVariable Long postId,
            HttpServletRequest request) {
        return ApiResponse.of(postApiPort.getPost(actor, postId), request);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            ApiActor actor,
            @PathVariable Long postId) {
        postApiPort.deletePost(actor, postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/likes")
    public ApiResponse<PostDtos.LikeResponse> toggleLike(
            ApiActor actor,
            @PathVariable Long postId,
            HttpServletRequest request) {
        return ApiResponse.of(postApiPort.toggleLike(actor, postId), request);
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<PostDtos.CommentResponse>> addComment(
            ApiActor actor,
            @PathVariable Long postId,
            @Valid @RequestBody PostDtos.CreateCommentRequest createCommentRequest,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(postApiPort.addComment(actor, postId, createCommentRequest), request));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            ApiActor actor,
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        postApiPort.deleteComment(actor, postId, commentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/images")
    public ResponseEntity<ApiResponse<PostDtos.PostImageResponse>> savePostImage(
            ApiActor actor,
            @PathVariable Long postId,
            @Valid @RequestBody PostDtos.SaveImageRequest saveImageRequest,
            HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.of(postApiPort.savePostImage(actor, postId, saveImageRequest), request));
    }
}
