package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Reservation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /** 중복 예약 검사. DB에도 UNIQUE(session_id, member_user_id) 제약이 있다. */
    Optional<Reservation> findBySessionIdAndMemberId(Long sessionId, Long memberId);

    boolean existsBySessionIdAndMemberIdAndStatus(Long sessionId, Long memberId, Enums.ReservationStatus status);

    /** 내 예약 목록. 상태 필터 없이 호출하면 전체를 반환한다. */
    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.session s
            JOIN FETCH s.program p
            JOIN FETCH p.trainer
            JOIN FETCH s.room rm
            JOIN FETCH rm.place
            WHERE r.member.id = :memberId
              AND (:statuses IS NULL OR r.status IN :statuses)
            ORDER BY s.startAt DESC
            """)
    Page<Reservation> findMyReservations(@Param("memberId") Long memberId,
                                         @Param("statuses") Collection<Enums.ReservationStatus> statuses,
                                         Pageable pageable);

    /** 트레이너 출석 화면: 해당 회차의 예약자 명단. */
    @Query("""
            SELECT r FROM Reservation r
            JOIN FETCH r.member m
            LEFT JOIN FETCH r.membership
            WHERE r.session.id = :sessionId
              AND r.status <> :canceled
            ORDER BY m.name ASC
            """)
    List<Reservation> findRosterBySession(@Param("sessionId") Long sessionId,
                                          @Param("canceled") Enums.ReservationStatus canceled);

    /** 시간표 화면에서 "내가 예약한 회차"를 한 번의 쿼리로 표시하기 위한 조회. */
    @Query("""
            SELECT r.session.id FROM Reservation r
            WHERE r.member.id = :memberId
              AND r.status = :status
              AND r.session.id IN :sessionIds
            """)
    List<Long> findReservedSessionIds(@Param("memberId") Long memberId,
                                      @Param("sessionIds") Collection<Long> sessionIds,
                                      @Param("status") Enums.ReservationStatus status);

    /** 수업이 취소될 때 되돌려야 할 예약들. */
    List<Reservation> findBySessionIdAndStatus(Long sessionId, Enums.ReservationStatus status);

    long countBySessionIdAndStatusIn(Long sessionId, Collection<Enums.ReservationStatus> statuses);
}
