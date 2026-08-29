package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    /** 원댓글 다음에 그 답글들이 오도록 정렬한다. */
    @Query("""
            SELECT c FROM Comment c
            JOIN FETCH c.author
            WHERE c.post.id = :postId
              AND c.deletedAt IS NULL
            ORDER BY COALESCE(c.parent.id, c.id) ASC, c.id ASC
            """)
    List<Comment> findByPost(@Param("postId") Long postId);
}
