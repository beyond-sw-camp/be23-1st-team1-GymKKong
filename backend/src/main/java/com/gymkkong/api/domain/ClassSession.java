package com.gymkkong.api.domain;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 실제 예약 대상이 되는 1회분 수업.
 * reservedCount는 예약/취소 트랜잭션 안에서만 변경하며,
 * 동시성은 ReservationService의 비관적 락으로 보호한다.
 */
@Entity
@Table(name = "class_session")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ClassSession extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id")
    private ClassProgram program;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "reserved_count", nullable = false)
    @Builder.Default
    private Integer reservedCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.SessionStatus status = Enums.SessionStatus.SCHEDULED;

    @Column(name = "cancel_reason", length = 255)
    private String cancelReason;

    public int remainSeat() {
        return capacity - reservedCount;
    }

    public boolean isFull() {
        return reservedCount >= capacity;
    }

    public boolean hasStarted() {
        return !startAt.isAfter(LocalDateTime.now());
    }

    /** 예약 가능 여부. 정원 검사는 락을 잡은 뒤 increaseReserved에서 수행한다. */
    public void assertReservable() {
        if (status != Enums.SessionStatus.SCHEDULED) {
            throw new ApiException(ErrorCode.SESSION_NOT_RESERVABLE);
        }
        if (hasStarted()) {
            throw new ApiException(ErrorCode.RESERVATION_TIME_PASSED);
        }
    }

    public void increaseReserved() {
        if (isFull()) {
            throw new ApiException(ErrorCode.SESSION_FULL);
        }
        this.reservedCount++;
    }

    public void decreaseReserved() {
        if (this.reservedCount > 0) {
            this.reservedCount--;
        }
    }

    public void cancel(String reason) {
        if (status == Enums.SessionStatus.COMPLETED) {
            throw new ApiException(ErrorCode.SESSION_ALREADY_STARTED);
        }
        this.status = Enums.SessionStatus.CANCELED;
        this.cancelReason = reason;
    }

    public void complete() {
        this.status = Enums.SessionStatus.COMPLETED;
    }

    /** v1은 종료시각 컬럼이 없어 상태를 시간 상수로 추정해야 했다. */
    public Enums.SessionStatus derivedStatus() {
        if (status == Enums.SessionStatus.CANCELED) {
            return Enums.SessionStatus.CANCELED;
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startAt)) return Enums.SessionStatus.SCHEDULED;
        if (now.isBefore(endAt)) return Enums.SessionStatus.IN_PROGRESS;
        return Enums.SessionStatus.COMPLETED;
    }
}
