package com.gymkkong.api.domain;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * 회원이 실제로 보유한 이용권.
 * v1은 출석 시점에만 차감해서 잔여 0회여도 예약이 무한히 가능했다.
 * v2는 예약 시점에 차감하고 취소 시 복원한다(노쇼는 차감 유지).
 */
@Entity
@Table(name = "membership")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Membership extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id")
    private MembershipPlan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_user_id")
    private AppUser member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id")
    private Place place;

    /** 구매 시점 스냅샷. 상품 가격/횟수가 바뀌어도 보유 이용권은 영향받지 않는다. */
    @Column(name = "total_count", nullable = false)
    private Integer totalCount;

    @Column(name = "remain_count", nullable = false)
    private Integer remainCount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "expire_date", nullable = false)
    private LocalDate expireDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.MembershipStatus status = Enums.MembershipStatus.ACTIVE;

    public boolean isExpired() {
        return expireDate.isBefore(LocalDate.now());
    }

    /** 특정 날짜의 수업을 이 이용권으로 예약할 수 있는지. */
    public boolean isUsableOn(LocalDate sessionDate) {
        return status == Enums.MembershipStatus.ACTIVE
                && remainCount > 0
                && !sessionDate.isBefore(startDate)
                && !sessionDate.isAfter(expireDate);
    }

    public void use() {
        if (status != Enums.MembershipStatus.ACTIVE) {
            throw new ApiException(ErrorCode.NO_USABLE_MEMBERSHIP);
        }
        if (isExpired()) {
            throw new ApiException(ErrorCode.MEMBERSHIP_EXPIRED);
        }
        if (remainCount <= 0) {
            throw new ApiException(ErrorCode.MEMBERSHIP_EXHAUSTED);
        }
        this.remainCount--;
    }

    /** 예약 취소 또는 트레이너의 수업 취소 시 되돌린다. */
    public void restore() {
        if (this.remainCount < this.totalCount) {
            this.remainCount++;
        }
    }

    public void markRefunded() {
        this.status = Enums.MembershipStatus.REFUNDED;
        this.remainCount = 0;
    }

    public void markExpired() {
        this.status = Enums.MembershipStatus.EXPIRED;
    }

    /**
     * 환불 가능 여부.
     * v1 회고에서 "이미 환불된 이용권 재환불 시 에러"가 미해결로 남았던 부분을
     * 상태 검사로 명시적으로 처리한다.
     */
    public void assertRefundable() {
        if (status == Enums.MembershipStatus.REFUNDED) {
            throw new ApiException(ErrorCode.MEMBERSHIP_NOT_REFUNDABLE, "이미 환불된 이용권입니다.");
        }
        if (status == Enums.MembershipStatus.EXPIRED || isExpired()) {
            throw new ApiException(ErrorCode.MEMBERSHIP_NOT_REFUNDABLE, "만료된 이용권은 환불할 수 없습니다.");
        }
        if (remainCount <= 0) {
            throw new ApiException(ErrorCode.MEMBERSHIP_NOT_REFUNDABLE, "잔여 횟수가 없어 환불할 수 없습니다.");
        }
    }

    /** 잔여 횟수 비율만큼 환불한다(사용분은 차감). */
    public int calculateRefundAmount(int paidAmount) {
        if (totalCount == 0) return 0;
        return (int) Math.floor((double) paidAmount * remainCount / totalCount);
    }
}
