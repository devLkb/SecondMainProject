package com.blockchain.backend.petchainAPI.port;

import com.blockchain.backend.petchainAPI.dto.post.PostDtos;
import com.blockchain.backend.petchainAPI.security.ApiActor;
import org.springframework.data.domain.Page;

import java.util.List;

public interface PostApiPort {
    PostDtos.PostResponse createPost(ApiActor actor, PostDtos.CreatePostRequest request);
    Page<PostDtos.PostSummaryResponse> listPosts(ApiActor actor, String region, int page, int size);
    List<PostDtos.PostSummaryResponse> listPopularPosts(ApiActor actor, String region);
    List<PostDtos.RegionTopPostResponse> listTopPostByRegion(ApiActor actor);
    PostDtos.PostDetailResponse getPost(ApiActor actor, Long postId);
    void deletePost(ApiActor actor, Long postId);
    PostDtos.LikeResponse toggleLike(ApiActor actor, Long postId);
    PostDtos.CommentResponse addComment(ApiActor actor, Long postId, PostDtos.CreateCommentRequest request);
    void deleteComment(ApiActor actor, Long postId, Long commentId);
    PostDtos.PostImageResponse savePostImage(ApiActor actor, Long postId, PostDtos.SaveImageRequest request);
    PostDtos.PostResponse updatePost(ApiActor actor, Long postId, PostDtos.UpdatePostRequest request);
    PostDtos.CommentResponse updateComment(ApiActor actor, Long postId, Long commentId, PostDtos.UpdateCommentRequest request);
    PostDtos.CommentLikeResponse toggleCommentLike(ApiActor actor, Long postId, Long commentId);
}
