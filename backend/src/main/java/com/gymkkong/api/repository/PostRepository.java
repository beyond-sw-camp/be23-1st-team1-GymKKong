package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author
            WHERE p.place.id = :placeId
              AND p.deletedAt IS NULL
              AND (:postType IS NULL OR p.postType = :postType)
            ORDER BY p.isPinned DESC, p.createdAt DESC
            """)
    Page<Post> findByPlace(@Param("placeId") Long placeId,
                           @Param("postType") Enums.PostType postType,
                           Pageable pageable);

    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author
            JOIN FETCH p.place
            WHERE p.id = :id AND p.deletedAt IS NULL
            """)
    Optional<Post> findDetailById(@Param("id") Long id);

}
