package com.gymkkong.api.dto;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Membership;
import com.gymkkong.api.domain.Payment;
import com.gymkkong.api.domain.Refund;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class MembershipDtos {

    private MembershipDtos() {}

    public record PurchaseRequest(
            @NotNull Long planId,
            Enums.PaymentMethod method,
            /** PG 연동 전이므로 선택. 실제 결제 연동 시 필수로 승격한다. */
            String pgTid
    ) {}

    public record MembershipResponse(
            Long id,
            Long planId,
            String planName,
            Long placeId,
            String placeName,
            Enums.PlanScope classType,
            Integer totalCount,
            Integer remainCount,
            LocalDate startDate,
            LocalDate expireDate,
            Enums.MembershipStatus status,
            /** 앱의 환불 버튼 노출 조건. v1은 이 판정을 SELECT의 CASE 식으로 흩어놨었다. */
            boolean refundable,
            Integer expectedRefundAmount
    ) {
        public static MembershipResponse from(Membership m, Integer paidAmount) {
            boolean refundable = m.getStatus() == Enums.MembershipStatus.ACTIVE
                    && !m.isExpired()
                    && m.getRemainCount() > 0;
            Integer expected = (refundable && paidAmount != null)
                    ? m.calculateRefundAmount(paidAmount) : null;
            return new MembershipResponse(
                    m.getId(), m.getPlan().getId(), m.getPlan().getName(),
                    m.getPlace().getId(), m.getPlace().getName(), m.getPlan().getClassType(),
                    m.getTotalCount(), m.getRemainCount(), m.getStartDate(), m.getExpireDate(),
                    m.getStatus(), refundable, expected);
        }
    }

    public record PaymentResponse(
            Long id,
            Long membershipId,
            String planName,
            Integer amount,
            Enums.PaymentMethod method,
            Enums.PaymentStatus status,
            LocalDateTime paidAt
    ) {
        public static PaymentResponse from(Payment p) {
            return new PaymentResponse(p.getId(), p.getMembership().getId(),
                    p.getMembership().getPlan().getName(), p.getAmount(),
                    p.getMethod(), p.getStatus(), p.getPaidAt());
        }
    }

    public record RefundRequest(@Size(max = 255) String reason) {}

    public record RefundResponse(
            Long id,
            Long paymentId,
            Long membershipId,
            String memberName,
            String planName,
            Integer amount,
            String reason,
            Enums.RefundStatus status,
            LocalDateTime requestedAt,
            LocalDateTime processedAt
    ) {
        public static RefundResponse from(Refund r) {
            Payment p = r.getPayment();
            return new RefundResponse(
                    r.getId(), p.getId(), p.getMembership().getId(),
                    p.getMember().getName(), p.getMembership().getPlan().getName(),
                    r.getAmount(), r.getReason(), r.getStatus(),
                    r.getRequestedAt(), r.getProcessedAt());
        }
    }

    public record RefundDecisionRequest(
            @NotNull Boolean approve,
            @Size(max = 255) String reason
    ) {}
}
