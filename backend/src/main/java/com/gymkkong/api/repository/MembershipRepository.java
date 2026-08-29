package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Membership;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.plan
            JOIN FETCH m.place
            WHERE m.member.id = :memberId
            ORDER BY m.status ASC, m.expireDate DESC
            """)
    List<Membership> findAllByMember(@Param("memberId") Long memberId);

    /**
     * 예약에 쓸 이용권 후보. 만료가 임박한 것부터 소진한다.
     * 잠금을 걸어 동시 예약 시 잔여 횟수가 음수가 되지 않게 한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT m FROM Membership m
            WHERE m.member.id = :memberId
              AND m.place.id = :placeId
              AND m.status = :status
              AND m.remainCount > 0
              AND m.startDate <= :sessionDate
              AND m.expireDate >= :sessionDate
            ORDER BY m.expireDate ASC, m.id ASC
            """)
    List<Membership> findUsableForUpdate(@Param("memberId") Long memberId,
                                         @Param("placeId") Long placeId,
                                         @Param("sessionDate") LocalDate sessionDate,
                                         @Param("status") Enums.MembershipStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Membership m WHERE m.id = :id")
    Optional<Membership> findByIdForUpdate(@Param("id") Long id);

    /** 만료 배치용. */
    List<Membership> findByStatusAndExpireDateBefore(Enums.MembershipStatus status, LocalDate date);
}
