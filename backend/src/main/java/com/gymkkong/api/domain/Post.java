package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 지점 게시판 글.
 * v1은 place_trainer_id가 NOT NULL이라 트레이너만 글을 쓸 수 있었다.
 * v2는 작성자를 app_user로 일반화해 회원 문의(QNA)도 가능하다.
 */
@Entity
@Table(name = "post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Post extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id")
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id")
    private AppUser author;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", nullable = false)
    @Builder.Default
    private Enums.PostType postType = Enums.PostType.FREE;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Integer viewCount = 0;

    @Column(name = "comment_count", nullable = false)
    @Builder.Default
    private Integer commentCount = 0;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void update(String title, String content, Enums.PostType postType) {
        if (title != null) this.title = title;
        if (content != null) this.content = content;
        if (postType != null) this.postType = postType;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void increaseView() {
        this.viewCount++;
    }

    public void increaseComment() {
        this.commentCount++;
    }

    public void decreaseComment() {
        if (this.commentCount > 0) this.commentCount--;
    }

    public void pin(boolean pinned) {
        this.isPinned = pinned;
    }

    public boolean isAuthor(Long userId) {
        return author.getId().equals(userId);
    }
}
