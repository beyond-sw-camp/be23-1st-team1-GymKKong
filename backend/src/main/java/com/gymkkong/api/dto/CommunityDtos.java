package com.gymkkong.api.dto;

import com.gymkkong.api.domain.Comment;
import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Notification;
import com.gymkkong.api.domain.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class CommunityDtos {

    private CommunityDtos() {}

    public record PostSummary(
            Long id,
            Enums.PostType postType,
            String title,
            String authorName,
            Enums.Role authorRole,
            Integer viewCount,
            Integer commentCount,
            Boolean isPinned,
            LocalDateTime createdAt
    ) {
        public static PostSummary from(Post p) {
            return new PostSummary(p.getId(), p.getPostType(), p.getTitle(),
                    p.getAuthor().getName(), p.getAuthor().getRole(),
                    p.getViewCount(), p.getCommentCount(), p.getIsPinned(), p.getCreatedAt());
        }
    }

    public record PostDetail(
            Long id,
            Long placeId,
            String placeName,
            Enums.PostType postType,
            String title,
            String content,
            Long authorUserId,
            String authorName,
            Enums.Role authorRole,
            Integer viewCount,
            Integer commentCount,
            Boolean isPinned,
            LocalDateTime createdAt,
            boolean mine
    ) {
        public static PostDetail from(Post p, Long viewerId) {
            return new PostDetail(p.getId(), p.getPlace().getId(), p.getPlace().getName(),
                    p.getPostType(), p.getTitle(), p.getContent(),
                    p.getAuthor().getId(), p.getAuthor().getName(), p.getAuthor().getRole(),
                    p.getViewCount(), p.getCommentCount(), p.getIsPinned(), p.getCreatedAt(),
                    viewerId != null && p.isAuthor(viewerId));
        }
    }

    public record CommentResponse(
            Long id,
            Long parentId,
            String content,
            Long authorUserId,
            String authorName,
            Enums.Role authorRole,
            LocalDateTime createdAt,
            boolean mine
    ) {
        public static CommentResponse from(Comment c, Long viewerId) {
            return new CommentResponse(c.getId(),
                    c.getParent() != null ? c.getParent().getId() : null,
                    c.getContent(), c.getAuthor().getId(), c.getAuthor().getName(),
                    c.getAuthor().getRole(), c.getCreatedAt(),
                    viewerId != null && c.isAuthor(viewerId));
        }
    }

    public record PostCreateRequest(
            @NotNull Enums.PostType postType,
            @NotBlank @Size(max = 200) String title,
            @NotBlank String content
    ) {}

    public record PostUpdateRequest(
            @Size(max = 200) String title,
            String content,
            Enums.PostType postType
    ) {}

    public record CommentCreateRequest(
            @NotBlank @Size(max = 1000) String content,
            Long parentId
    ) {}

    public record NotificationResponse(
            Long id,
            Enums.NotificationType type,
            String title,
            String body,
            String linkType,
            Long linkId,
            boolean read,
            LocalDateTime createdAt
    ) {
        public static NotificationResponse from(Notification n) {
            return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getBody(),
                    n.getLinkType(), n.getLinkId(), n.isRead(), n.getCreatedAt());
        }
    }

    public record DeviceTokenRequest(
            @NotBlank @Size(max = 500) String token,
            @NotNull Enums.DevicePlatform platform
    ) {}
}
