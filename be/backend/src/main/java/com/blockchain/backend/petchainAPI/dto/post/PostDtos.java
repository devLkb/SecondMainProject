package com.blockchain.backend.petchainAPI.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PostDtos {

    /* ── 요청 ─────────────────────────────────────────────────────────── */

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreatePostRequest {
        @NotBlank(message = "게시물 내용을 입력해주세요.")
        @Size(max = 5000, message = "게시물 내용은 5000자 이내여야 합니다.")
        private String content;

        @Size(max = 100, message = "반려동물 이름은 100자 이내여야 합니다.")
        private String petName;

        @Size(max = 100, message = "품종은 100자 이내여야 합니다.")
        private String petBreed;

        @Size(max = 50, message = "지역은 50자 이내여야 합니다.")
        private String authorRegion;

        // 인라인 이미지(base64 data URL). 선택 항목 — 약 5MB(base64 기준) 상한.
        @Size(max = 5_000_000, message = "이미지 용량이 너무 큽니다. 더 작은 이미지를 사용해주세요.")
        private String imageData;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CreateCommentRequest {
        @NotBlank(message = "댓글 내용을 입력해주세요.")
        @Size(max = 1000, message = "댓글은 1000자 이내여야 합니다.")
        private String content;

        private Long parentCommentId; // null이면 최상위 댓글
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SaveImageRequest {
        @NotBlank(message = "s3Key는 필수입니다.")
        @Size(max = 500, message = "s3Key는 500자 이내여야 합니다.")
        private String s3Key;

        @Size(max = 255, message = "파일명은 255자 이내여야 합니다.")
        private String originalFilename;

        @Size(max = 100, message = "MIME 타입은 100자 이내여야 합니다.")
        private String mimeType;

        private Long fileSize;
    }

    /* ── 응답 ─────────────────────────────────────────────────────────── */

    @Getter @Builder
    public static class PostResponse {
        private Long id;
        private String authorName;
        private String authorRegion;
        private String petName;
        private String petBreed;
        private String content;
        private List<String> imageKeys;
        private long likeCount;
        private boolean liked;
        private long commentCount;
        private LocalDateTime createdAt;
    }

    @Getter @Builder
    public static class PostSummaryResponse {
        private Long id;
        private String authorName;
        private String authorRegion;
        private String petName;
        private String petBreed;
        private String content;
        private List<String> imageKeys;
        private long likeCount;
        private boolean liked;
        private long commentCount;
        private LocalDateTime createdAt;
    }

    @Getter @Builder
    public static class PostDetailResponse {
        private Long id;
        private String authorName;
        private String authorRegion;
        private String petName;
        private String petBreed;
        private String content;
        private List<String> imageKeys;
        private long likeCount;
        private boolean liked;
        private List<CommentResponse> comments;
        private LocalDateTime createdAt;
    }

    @Getter @Builder
    public static class CommentResponse {
        private Long id;
        private String authorName;
        private String content;
        private List<CommentResponse> replies;
        private LocalDateTime createdAt;
    }

    @Getter @AllArgsConstructor
    public static class LikeResponse {
        private Long postId;
        private boolean liked;
        private long likeCount;
    }

    @Getter @AllArgsConstructor
    public static class PostImageResponse {
        private Long id;
        private String s3Key;
        private String originalFilename;
        private LocalDateTime uploadedAt;
    }
}
