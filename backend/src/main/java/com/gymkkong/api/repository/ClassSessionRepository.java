package com.gymkkong.api.repository;

import com.gymkkong.api.domain.ClassSession;
import com.gymkkong.api.domain.Enums;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {

    /**
     * 예약 트랜잭션에서만 사용한다. 행 잠금으로 정원 초과를 막는다.
     * v1에는 예약 생성 로직 자체가 없어 정원 검증이 존재하지 않았다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ClassSession s WHERE s.id = :id")
    Optional<ClassSession> findByIdForUpdate(@Param("id") Long id);

    /** 앱 시간표 화면. 지점 + 날짜 범위로 조회한다. */
    @Query("""
            SELECT s FROM ClassSession s
            JOIN FETCH s.program p
            JOIN FETCH p.trainer
            JOIN FETCH s.room r
            JOIN FETCH r.place
            WHERE p.place.id = :placeId
              AND s.startAt >= :from
              AND s.startAt < :to
              AND (:classType IS NULL OR p.classType = :classType)
            ORDER BY s.startAt ASC
            """)
    List<ClassSession> findByPlaceAndPeriod(@Param("placeId") Long placeId,
                                            @Param("from") LocalDateTime from,
                                            @Param("to") LocalDateTime to,
                                            @Param("classType") Enums.ClassType classType);

    @Query("""
            SELECT s FROM ClassSession s
            JOIN FETCH s.program p
            JOIN FETCH p.trainer
            JOIN FETCH s.room r
            JOIN FETCH r.place
            WHERE s.id = :id
            """)
    Optional<ClassSession> findDetailById(@Param("id") Long id);

    /** 트레이너 화면: 내가 맡은 수업 목록. */
    @Query("""
            SELECT s FROM ClassSession s
            JOIN FETCH s.program p
            JOIN FETCH s.room r
            JOIN FETCH r.place
            WHERE p.trainer.id = :trainerId
              AND s.startAt >= :from
              AND s.startAt < :to
            ORDER BY s.startAt ASC
            """)
    List<ClassSession> findByTrainerAndPeriod(@Param("trainerId") Long trainerId,
                                              @Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    /**
     * 강습실 시간 충돌 검사.
     * v1은 '1시간'을 하드코딩해 실제 수업 길이와 무관하게 판정했다.
     */
    @Query("""
            SELECT COUNT(s) > 0 FROM ClassSession s
            WHERE s.room.id = :roomId
              AND s.status <> :canceled
              AND (:excludeId IS NULL OR s.id <> :excludeId)
              AND s.startAt < :endAt
              AND s.endAt > :startAt
            """)
    boolean existsOverlapping(@Param("roomId") Long roomId,
                              @Param("startAt") LocalDateTime startAt,
                              @Param("endAt") LocalDateTime endAt,
                              @Param("canceled") Enums.SessionStatus canceled,
                              @Param("excludeId") Long excludeId);
}
