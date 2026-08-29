package com.gymkkong.api.service;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.domain.*;
import com.gymkkong.api.dto.MembershipDtos.*;
import com.gymkkong.api.repository.AppUserRepository;
import com.gymkkong.api.repository.MembershipRepository;
import com.gymkkong.api.repository.Repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 이용권 구매/조회/환불.
 *
 * v1 회고에 남아 있던 "이미 환불된 이용권을 다시 환불하면 에러가 난다"는 문제를
 * Membership.assertRefundable()로 명시적인 상태 검사로 바꿨다.
 */
@Service
@RequiredArgsConstructor
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final MembershipPlanRepository planRepository;
    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final AppUserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<MembershipResponse> myMemberships(Long memberId) {
        return membershipRepository.findAllByMember(memberId).stream()
                .map(m -> MembershipResponse.from(m, paidAmountOf(m)))
                .toList();
    }

    private Integer paidAmountOf(Membership m) {
        return paymentRepository.findByMembershipId(m.getId())
                .map(Payment::getAmount)
                .orElse(null);
    }

    /**
     * 이용권 구매. 결제 레코드를 함께 만든다.
     * PG 연동 전이라 결제는 즉시 PAID로 처리하며, 실제 연동 시
     * PENDING으로 만들고 콜백에서 markPaid를 호출하도록 바꾸면 된다.
     */
    @Transactional
    public MembershipResponse purchase(Long memberId, PurchaseRequest req) {
        MembershipPlan plan = planRepository.findById(req.planId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "이용권 상품을 찾을 수 없습니다."));

        if (plan.getStatus() != Enums.PlaceStatus.ACTIVE) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "판매 중인 상품이 아닙니다.");
        }

        AppUser member = userRepository.findById(memberId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        LocalDate today = LocalDate.now();
        Membership membership = membershipRepository.save(Membership.builder()
                .plan(plan)
                .member(member)
                .place(plan.getPlace())
                // 구매 시점 스냅샷. 이후 상품이 바뀌어도 이 이용권은 영향받지 않는다.
                .totalCount(plan.getTotalCount())
                .remainCount(plan.getTotalCount())
                .startDate(today)
                .expireDate(today.plusDays(plan.getValidDays()))
                .status(Enums.MembershipStatus.ACTIVE)
                .build());

        Payment payment = Payment.builder()
                .membership(membership)
                .member(member)
                .amount(plan.getPrice())
                .method(req.method() == null ? Enums.PaymentMethod.CARD : req.method())
                .status(Enums.PaymentStatus.PAID)
                .pgTid(req.pgTid())
                .paidAt(java.time.LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        notificationService.notifyPayment(member, plan.getName(), plan.getPrice());
        return MembershipResponse.from(membership, plan.getPrice());
    }

    /**
     * 환불 요청. 잔여 횟수 비율로 금액을 계산하고 관리자 승인 대기 상태로 만든다.
     * 승인 시점에 이용권이 REFUNDED로 바뀐다.
     */
    @Transactional
    public RefundResponse requestRefund(Long memberId, Long membershipId, RefundRequest req) {
        Membership membership = membershipRepository.findByIdForUpdate(membershipId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "이용권을 찾을 수 없습니다."));

        if (!membership.getMember().getId().equals(memberId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        membership.assertRefundable();

        Payment payment = paymentRepository.findByMembershipId(membershipId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "결제 내역이 없습니다."));

        boolean pending = refundRepository.existsByPaymentIdAndStatusIn(payment.getId(),
                List.of(Enums.RefundStatus.REQUESTED, Enums.RefundStatus.APPROVED,
                        Enums.RefundStatus.COMPLETED));
        if (pending) {
            throw new ApiException(ErrorCode.REFUND_ALREADY_REQUESTED);
        }

        Refund refund = refundRepository.save(Refund.builder()
                .payment(payment)
                .amount(membership.calculateRefundAmount(payment.getAmount()))
                .reason(req.reason())
                .status(Enums.RefundStatus.REQUESTED)
                .build());

        return RefundResponse.from(refund);
    }

    /** 관리자 승인/거절. 승인 시에만 이용권을 소멸시킨다. */
    @Transactional
    public RefundResponse decideRefund(Long adminId, Long refundId, RefundDecisionRequest req) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "환불 요청을 찾을 수 없습니다."));

        if (!refund.isPending()) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "이미 처리된 환불 요청입니다.");
        }

        AppUser admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (Boolean.TRUE.equals(req.approve())) {
            Membership membership = membershipRepository
                    .findByIdForUpdate(refund.getPayment().getMembership().getId())
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
            membership.markRefunded();
            refund.getPayment().markCanceled();
            refund.approve(admin);
        } else {
            refund.reject(admin, req.reason());
        }
        return RefundResponse.from(refund);
    }

    @Transactional(readOnly = true)
    public PageResponse<RefundResponse> pendingRefunds(Pageable pageable) {
        return PageResponse.of(
                refundRepository.findByStatus(Enums.RefundStatus.REQUESTED, pageable),
                RefundResponse::from);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> myPayments(Long memberId) {
        return paymentRepository.findByMemberIdOrderByPaidAtDesc(memberId).stream()
                .map(PaymentResponse::from).toList();
    }

    /** 만료 처리 배치. 스케줄러에서 하루 한 번 호출한다. */
    @Transactional
    public int expireOutdated() {
        List<Membership> expired = membershipRepository
                .findByStatusAndExpireDateBefore(Enums.MembershipStatus.ACTIVE, LocalDate.now());
        expired.forEach(Membership::markExpired);
        return expired.size();
    }
}
