package com.gymkkong.api.repository;

import com.gymkkong.api.domain.ClassProgram;
import com.gymkkong.api.domain.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassProgramRepository extends JpaRepository<ClassProgram, Long> {

    @Query("""
            SELECT p FROM ClassProgram p
            JOIN FETCH p.trainer
            JOIN FETCH p.place
            WHERE p.place.id = :placeId
              AND p.deletedAt IS NULL
              AND p.status = :status
            ORDER BY p.name ASC
            """)
    List<ClassProgram> findActiveByPlace(@Param("placeId") Long placeId,
                                         @Param("status") Enums.PlaceStatus status);

    @Query("""
            SELECT p FROM ClassProgram p
            JOIN FETCH p.trainer
            JOIN FETCH p.place
            WHERE p.trainer.id = :trainerId
              AND p.deletedAt IS NULL
            ORDER BY p.createdAt DESC
            """)
    List<ClassProgram> findByTrainer(@Param("trainerId") Long trainerId);

    @Query("""
            SELECT p FROM ClassProgram p
            JOIN FETCH p.trainer
            JOIN FETCH p.place
            WHERE p.id = :id AND p.deletedAt IS NULL
            """)
    Optional<ClassProgram> findDetailById(@Param("id") Long id);
}
