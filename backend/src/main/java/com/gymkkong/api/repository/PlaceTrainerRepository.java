package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.PlaceTrainer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlaceTrainerRepository extends JpaRepository<PlaceTrainer, Long> {

    Optional<PlaceTrainer> findByPlaceIdAndTrainerId(Long placeId, Long trainerId);

    boolean existsByPlaceIdAndTrainerIdAndStatus(Long placeId, Long trainerId, Enums.PlaceTrainerStatus status);

    @Query("""
            SELECT pt FROM PlaceTrainer pt
            JOIN FETCH pt.trainer t
            LEFT JOIN FETCH pt.place
            WHERE pt.place.id = :placeId
              AND pt.status = :status
            ORDER BY t.name ASC
            """)
    List<PlaceTrainer> findByPlaceAndStatus(@Param("placeId") Long placeId,
                                            @Param("status") Enums.PlaceTrainerStatus status);

    @Query("""
            SELECT pt FROM PlaceTrainer pt
            JOIN FETCH pt.place
            WHERE pt.trainer.id = :trainerId
            ORDER BY pt.status ASC, pt.requestedAt DESC
            """)
    List<PlaceTrainer> findByTrainer(@Param("trainerId") Long trainerId);
}
