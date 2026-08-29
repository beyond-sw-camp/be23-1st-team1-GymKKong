package com.gymkkong.api.repository;

import com.gymkkong.api.domain.FavoritePlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FavoritePlaceRepository extends JpaRepository<FavoritePlace, Long> {

    Optional<FavoritePlace> findByUserIdAndPlaceId(Long userId, Long placeId);

    @Query("""
            SELECT f FROM FavoritePlace f
            JOIN FETCH f.place
            WHERE f.user.id = :userId
            """)
    List<FavoritePlace> findByUserId(@Param("userId") Long userId);
}
