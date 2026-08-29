package com.gymkkong.api.domain;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 예약과 출석의 단일 소스.
 * v1은 class_reservation과 attendance가 FK 없이 분리돼 있었고,
 * 강습 생성 시 전체 회원을 attendance에 INSERT한 뒤 그 COUNT를 예약 인원으로 표시해
 * 예약 인원이 항상 전체 회원 수로 나왔다.
 */
@Entity
@Table(name = "reservation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Reservation extends BaseTimeEntity {

    /** 수업 시작 이 시간 전까지만 취소할 수 있다. */
    public static final int CANCEL_DEADLINE_HOURS = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id")
    private ClassSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_user_id")
    private AppUser member;

    /** 어느 이용권에서 차감했는지. 취소 시 같은 이용권으로 복원한다. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membership_id")
    private Membership membership;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.ReservationStatus status = Enums.ReservationStatus.RESERVED;

    @Column(name = "reserved_at", nullable = false)
    @Builder.Default
    private LocalDateTime reservedAt = LocalDateTime.now();

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Column(name = "checked_at")
    private LocalDateTime checkedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checked_by")
    private AppUser checkedBy;

    public boolean isActive() {
        return status == Enums.ReservationStatus.RESERVED;
    }

    /** 회원 본인 취소. 마감 시간을 넘겼으면 거절한다. */
    public void cancelByMember() {
        if (status != Enums.ReservationStatus.RESERVED) {
            throw new ApiException(ErrorCode.RESERVATION_NOT_CANCELABLE);
        }
        LocalDateTime deadline = session.getStartAt().minusHours(CANCEL_DEADLINE_HOURS);
        if (LocalDateTime.now().isAfter(deadline)) {
            throw new ApiException(ErrorCode.CANCEL_DEADLINE_PASSED,
                    "수업 시작 " + CANCEL_DEADLINE_HOURS + "시간 전까지만 취소할 수 있습니다.");
        }
        this.status = Enums.ReservationStatus.CANCELED;
        this.canceledAt = LocalDateTime.now();
    }

    /**
     * 취소했던 예약을 같은 회차에 다시 살린다.
     * UNIQUE(session_id, member_user_id) 제약 때문에 새 행을 넣을 수 없어 재사용한다.
     */
    public void reactivate(Membership membership) {
        this.status = Enums.ReservationStatus.RESERVED;
        this.membership = membership;
        this.reservedAt = LocalDateTime.now();
        this.canceledAt = null;
        this.checkedAt = null;
        this.checkedBy = null;
    }

    /** 트레이너의 수업 취소로 인한 일괄 취소. 마감 시간 제약을 받지 않는다. */
    public void cancelBySession() {
        this.status = Enums.ReservationStatus.CANCELED;
        this.canceledAt = LocalDateTime.now();
    }

    public void markAttended(AppUser trainer) {
        this.status = Enums.ReservationStatus.ATTENDED;
        this.checkedAt = LocalDateTime.now();
        this.checkedBy = trainer;
    }

    /** 노쇼는 이용권을 복원하지 않는다. */
    public void markNoShow(AppUser trainer) {
        this.status = Enums.ReservationStatus.NOSHOW;
        this.checkedAt = LocalDateTime.now();
        this.checkedBy = trainer;
    }

    /** 출석을 다시 예약 상태로 되돌린다(트레이너 오처리 정정). */
    public void revertCheck() {
        this.status = Enums.ReservationStatus.RESERVED;
        this.checkedAt = null;
        this.checkedBy = null;
    }
}
