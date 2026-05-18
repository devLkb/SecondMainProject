package com.blockchain.backend.petchainAPI.service;

import com.blockchain.backend.petchainAPI.dto.post.PostDtos;
import com.blockchain.backend.petchainAPI.port.PostApiPort;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import com.blockchain.backend.petchainDB.entity.Comment;
import com.blockchain.backend.petchainDB.entity.Guardian;
import com.blockchain.backend.petchainDB.entity.Post;
import com.blockchain.backend.petchainDB.entity.PostImage;
import com.blockchain.backend.petchainDB.entity.PostLike;
import com.blockchain.backend.petchainDB.entity.User;
import com.blockchain.backend.petchainDB.repository.CommentRepository;
import com.blockchain.backend.petchainDB.repository.GuardianRepository;
import com.blockchain.backend.petchainDB.repository.PostImageRepository;
import com.blockchain.backend.petchainDB.repository.PostLikeRepository;
import com.blockchain.backend.petchainDB.repository.PostRepository;
import com.blockchain.backend.petchainDB.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PostService implements PostApiPort {

    // 게시물당 이미지 첨부 상한
    private static final int MAX_IMAGES_PER_POST = 10;

    // 인기글: 최근 N일 내 작성글 중 상위 M개
    private static final int POPULAR_WINDOW_DAYS = 30;
    private static final int POPULAR_LIMIT = 10;

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final GuardianRepository guardianRepository;

    @Override
    @Transactional
    public PostDtos.PostResponse createPost(ApiActor actor, PostDtos.CreatePostRequest request) {
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("게시물 내용을 입력해주세요.");
        }
        User user = resolveUser(actor);

        Post post = new Post();
        post.setAuthor(user);
        post.setContent(request.getContent().trim());
        post.setAuthorRegion(request.getAuthorRegion());
        post.setPetName(request.getPetName());
        post.setPetBreed(request.getPetBreed());

        Post saved = postRepository.save(post);

        // 인라인 이미지(base64)가 있으면 post_images에 함께 저장
        List<String> imageKeys = List.of();
        if (request.getImageData() != null && !request.getImageData().isBlank()) {
            PostImage image = new PostImage();
            image.setPost(saved);
            image.setImageData(request.getImageData());
            image.setDisplayOrder(0);
            PostImage savedImage = postImageRepository.save(image);
            imageKeys = List.of(imageRef(savedImage));
        }

        return PostDtos.PostResponse.builder()
                .id(saved.getId())
                .authorName(resolveAuthorName(user))
                .authorRegion(saved.getAuthorRegion())
                .petName(saved.getPetName())
                .petBreed(saved.getPetBreed())
                .content(saved.getContent())
                .imageKeys(imageKeys)
                .likeCount(0)
                .liked(false)
                .commentCount(0)
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PostDtos.PostSummaryResponse> listPosts(ApiActor actor, String region, int page, int size) {
        if (page < 0) throw new IllegalArgumentException("페이지 번호는 0 이상이어야 합니다.");
        if (size < 1 || size > 100) throw new IllegalArgumentException("페이지 크기는 1~100 사이여야 합니다.");

        Long userId = parseUserId(actor);
        Pageable pageable = PageRequest.of(page, size);

        Page<Post> posts = (region != null && !region.isBlank())
                ? postRepository.findWithAuthorByRegion(region, pageable)
                : postRepository.findWithAuthor(pageable);

        return posts.map(p -> toSummary(p, userId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PostDtos.PostSummaryResponse> listPopularPosts(ApiActor actor, String region) {
        Long userId = parseUserId(actor);
        LocalDateTime since = LocalDateTime.now().minusDays(POPULAR_WINDOW_DAYS);
        String regionFilter = (region != null && !region.isBlank()) ? region.trim() : null;

        List<Object[]> rows = postRepository.findPopular(
                since, regionFilter, PageRequest.of(0, POPULAR_LIMIT));

        return rows.stream()
                .map(row -> {
                    Post post = (Post) row[0];
                    long likeCount = ((Number) row[1]).longValue();
                    return toSummary(post, likeCount, userId);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PostDtos.PostDetailResponse getPost(ApiActor actor, Long postId) {
        Long userId = parseUserId(actor);
        Post post = findActivePost(postId);

        List<PostImage> images = postImageRepository.findByPost_IdOrderByDisplayOrderAsc(postId);
        long likeCount = postLikeRepository.countByPost_Id(postId);
        boolean liked = userId != null && postLikeRepository.existsByPost_IdAndUser_Id(postId, userId);
        List<PostDtos.CommentResponse> comments = buildCommentTree(postId);

        return PostDtos.PostDetailResponse.builder()
                .id(post.getId())
                .authorName(resolveAuthorName(post.getAuthor()))
                .authorRegion(post.getAuthorRegion())
                .petName(post.getPetName())
                .petBreed(post.getPetBreed())
                .content(post.getContent())
                .imageKeys(images.stream().map(PostService::imageRef).toList())
                .likeCount(likeCount)
                .liked(liked)
                .comments(comments)
                .createdAt(post.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deletePost(ApiActor actor, Long postId) {
        User user = resolveUser(actor);
        Post post = postRepository.findWithAuthorById(postId)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시물입니다."));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new IllegalArgumentException("본인 게시물만 삭제할 수 있습니다.");
        }
        post.setIsDeleted(true);
    }

    @Override
    @Transactional
    public PostDtos.LikeResponse toggleLike(ApiActor actor, Long postId) {
        User user = resolveUser(actor);
        findActivePost(postId);

        Optional<PostLike> existing = postLikeRepository.findByPost_IdAndUser_Id(postId, user.getId());
        if (existing.isPresent()) {
            postLikeRepository.delete(existing.get());
        } else {
            PostLike like = new PostLike();
            like.setPost(postRepository.getReferenceById(postId));
            like.setUser(user);
            postLikeRepository.save(like);
        }

        long count = postLikeRepository.countByPost_Id(postId);
        return new PostDtos.LikeResponse(postId, existing.isEmpty(), count);
    }

    @Override
    @Transactional
    public PostDtos.CommentResponse addComment(ApiActor actor, Long postId, PostDtos.CreateCommentRequest request) {
        User user = resolveUser(actor);
        Post post = findActivePost(postId);

        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("댓글 내용을 입력해주세요.");
        }

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setAuthor(user);
        comment.setContent(request.getContent().trim());

        if (request.getParentCommentId() != null) {
            Comment parent = commentRepository.findById(request.getParentCommentId())
                    .filter(c -> !c.getIsDeleted() && c.getPost().getId().equals(postId))
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));
            // 댓글 트리는 2단계(루트 + 대댓글)만 렌더링하므로 대대댓글은 금지 — 고아 데이터 방지
            if (parent.getParentComment() != null) {
                throw new IllegalArgumentException("대댓글에는 답글을 달 수 없습니다.");
            }
            comment.setParentComment(parent);
        }

        Comment saved = commentRepository.save(comment);
        return toCommentResponse(saved, resolveAuthorName(user), List.of());
    }

    @Override
    @Transactional
    public void deleteComment(ApiActor actor, Long postId, Long commentId) {
        User user = resolveUser(actor);
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> !c.getIsDeleted() && c.getPost().getId().equals(postId))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new IllegalArgumentException("본인 댓글만 삭제할 수 있습니다.");
        }
        comment.setIsDeleted(true);
    }

    @Override
    @Transactional
    public PostDtos.PostImageResponse savePostImage(ApiActor actor, Long postId, PostDtos.SaveImageRequest request) {
        User user = resolveUser(actor);
        Post post = postRepository.findWithAuthorById(postId)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시물입니다."));

        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new IllegalArgumentException("본인 게시물에만 이미지를 추가할 수 있습니다.");
        }

        if (request.getS3Key() == null || request.getS3Key().isBlank()) {
            throw new IllegalArgumentException("s3Key는 필수입니다.");
        }
        if (request.getMimeType() != null && !request.getMimeType().startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다: " + request.getMimeType());
        }

        int currentCount = postImageRepository.countByPost_Id(postId);
        if (currentCount >= MAX_IMAGES_PER_POST) {
            throw new IllegalArgumentException("게시물당 이미지는 최대 " + MAX_IMAGES_PER_POST + "개까지 첨부할 수 있습니다.");
        }

        PostImage image = new PostImage();
        image.setPost(post);
        image.setS3Key(request.getS3Key());
        image.setOriginalFilename(request.getOriginalFilename());
        image.setMimeType(request.getMimeType());
        image.setFileSize(request.getFileSize());
        image.setDisplayOrder(currentCount); // 첨부 순서대로 0,1,2…

        PostImage saved = postImageRepository.save(image);
        return new PostDtos.PostImageResponse(saved.getId(), saved.getS3Key(), saved.getOriginalFilename(), saved.getUploadedAt());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private User resolveUser(ApiActor actor) {
        if (actor.actorId() == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }
        Long userId = Long.parseLong(actor.actorId());
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private Long parseUserId(ApiActor actor) {
        if (actor.actorId() == null) return null;
        try { return Long.parseLong(actor.actorId()); } catch (NumberFormatException e) { return null; }
    }

    // 표시용 이미지 참조 — 인라인 base64가 있으면 그것을, 없으면 S3 key를 반환
    private static String imageRef(PostImage img) {
        return (img.getImageData() != null && !img.getImageData().isBlank())
                ? img.getImageData() : img.getS3Key();
    }

    private Post findActivePost(Long postId) {
        return postRepository.findById(postId)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시물입니다."));
    }

    private String resolveAuthorName(User user) {
        return guardianRepository.findByUser_Id(user.getId())
                .map(Guardian::getName)
                .orElse(user.getLoginId());
    }

    private List<PostDtos.CommentResponse> buildCommentTree(Long postId) {
        // author가 JOIN FETCH된 쿼리로 N+1 방지
        List<Comment> roots = commentRepository.findRootCommentsWithAuthor(postId);

        return roots.stream().map(root -> {
            List<Comment> replies = commentRepository.findRepliesWithAuthor(root.getId());
            List<PostDtos.CommentResponse> replyResponses = replies.stream()
                    .map(r -> toCommentResponse(r, resolveAuthorName(r.getAuthor()), List.of()))
                    .toList();
            return toCommentResponse(root, resolveAuthorName(root.getAuthor()), replyResponses);
        }).toList();
    }

    private PostDtos.CommentResponse toCommentResponse(Comment c, String authorName, List<PostDtos.CommentResponse> replies) {
        return PostDtos.CommentResponse.builder()
                .id(c.getId())
                .authorName(authorName)
                .content(c.getContent())
                .replies(replies)
                .createdAt(c.getCreatedAt())
                .build();
    }

    private PostDtos.PostSummaryResponse toSummary(Post post, Long userId) {
        long likeCount = postLikeRepository.countByPost_Id(post.getId());
        return toSummary(post, likeCount, userId);
    }

    // 좋아요 수를 이미 알고 있을 때(인기글 집계 쿼리 결과 등) 중복 COUNT를 피하는 변형
    private PostDtos.PostSummaryResponse toSummary(Post post, long likeCount, Long userId) {
        boolean liked = userId != null && postLikeRepository.existsByPost_IdAndUser_Id(post.getId(), userId);
        long commentCount = commentRepository.countByPost_IdAndIsDeletedFalse(post.getId());
        List<PostImage> images = postImageRepository.findByPost_IdOrderByDisplayOrderAsc(post.getId());

        return PostDtos.PostSummaryResponse.builder()
                .id(post.getId())
                .authorName(resolveAuthorName(post.getAuthor()))
                .authorRegion(post.getAuthorRegion())
                .petName(post.getPetName())
                .petBreed(post.getPetBreed())
                .content(post.getContent())
                .imageKeys(images.stream().map(PostService::imageRef).toList())
                .likeCount(likeCount)
                .liked(liked)
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
