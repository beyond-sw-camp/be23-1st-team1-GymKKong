package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 댓글.
 * v1은 comment.member_id가 NOT NULL이라 트레이너가 댓글을 달 수 없었고,
 * 이를 우회하려던 sp_댓글_작성은 존재하지 않는 'coment' 테이블을 참조해 항상 실패했다.
 */
@Entity
@Table(name = "comment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Comment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id")
    private AppUser author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void update(String content) {
        if (content != null && !content.isBlank()) {
            this.content = content;
        }
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isAuthor(Long userId) {
        return author.getId().equals(userId);
    }
}
