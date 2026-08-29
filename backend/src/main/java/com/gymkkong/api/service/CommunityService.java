package com.gymkkong.api.service;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.domain.*;
import com.gymkkong.api.dto.CommunityDtos.*;
import com.gymkkong.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 지점 게시판.
 * v1은 post가 트레이너 전용(place_trainer_id NOT NULL), comment가 회원 전용이었고
 * 트레이너 댓글을 넣으려던 프로시저는 존재하지 않는 테이블을 참조해 항상 실패했다.
 * v2는 작성자를 app_user로 통일해 세 역할 모두 글과 댓글을 쓸 수 있다.
 */
@Service
@RequiredArgsConstructor
public class CommunityService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PlaceRepository placeRepository;
    private final AppUserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<PostSummary> list(Long placeId, Enums.PostType type, Pageable pageable) {
        return PageResponse.of(postRepository.findByPlace(placeId, type, pageable), PostSummary::from);
    }

    @Transactional
    public PostDetail detail(Long postId, Long viewerId) {
        Post post = postRepository.findDetailById(postId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        post.increaseView();
        return PostDetail.from(post, viewerId);
    }

    @Transactional
    public PostDetail create(AuthUser author, Long placeId, PostCreateRequest req) {
        // 공지는 트레이너/관리자만 올릴 수 있다.
        if (req.postType() == Enums.PostType.NOTICE && author.isMember()) {
            throw new ApiException(ErrorCode.FORBIDDEN, "공지는 트레이너 또는 관리자만 작성할 수 있습니다.");
        }

        Place place = placeRepository.findByIdAndDeletedAtIsNull(placeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "지점을 찾을 수 없습니다."));
        AppUser user = userRepository.findById(author.id())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        Post post = postRepository.save(Post.builder()
                .place(place)
                .author(user)
                .postType(req.postType())
                .title(req.title())
                .content(req.content())
                .build());

        return PostDetail.from(post, author.id());
    }

    @Transactional
    public PostDetail update(AuthUser editor, Long postId, PostUpdateRequest req) {
        Post post = mutablePost(editor, postId);
        post.update(req.title(), req.content(), req.postType());
        return PostDetail.from(post, editor.id());
    }

    @Transactional
    public void delete(AuthUser editor, Long postId) {
        mutablePost(editor, postId).softDelete();
    }

    /** 작성자 본인 또는 관리자만 수정/삭제할 수 있다. */
    private Post mutablePost(AuthUser editor, Long postId) {
        Post post = postRepository.findDetailById(postId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (!post.isAuthor(editor.id()) && !editor.isAdmin()) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return post;
    }

    // ------------------------------------------------------------ 댓글

    @Transactional(readOnly = true)
    public List<CommentResponse> comments(Long postId, Long viewerId) {
        return commentRepository.findByPost(postId).stream()
                .map(c -> CommentResponse.from(c, viewerId))
                .toList();
    }

    @Transactional
    public CommentResponse addComment(AuthUser author, Long postId, CommentCreateRequest req) {
        Post post = postRepository.findDetailById(postId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        AppUser user = userRepository.findById(author.id())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        Comment parent = null;
        if (req.parentId() != null) {
            parent = commentRepository.findById(req.parentId())
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "부모 댓글을 찾을 수 없습니다."));
            if (!parent.getPost().getId().equals(postId)) {
                throw new ApiException(ErrorCode.INVALID_INPUT, "다른 게시글의 댓글에는 답글을 달 수 없습니다.");
            }
            if (parent.getParent() != null) {
                throw new ApiException(ErrorCode.INVALID_INPUT, "답글에는 다시 답글을 달 수 없습니다.");
            }
        }

        Comment comment = commentRepository.save(Comment.builder()
                .post(post)
                .author(user)
                .parent(parent)
                .content(req.content())
                .build());

        post.increaseComment();
        notificationService.notifyComment(post.getAuthor(), post, user.getName());

        return CommentResponse.from(comment, author.id());
    }

    @Transactional
    public void deleteComment(AuthUser editor, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!comment.isAuthor(editor.id()) && !editor.isAdmin()) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        comment.softDelete();
        comment.getPost().decreaseComment();
    }
}
