package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** 환불은 요청 -> 관리자 승인/거절 -> 완료의 상태 머신으로 다룬다. */
@Entity
@Table(name = "refund")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Refund extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(nullable = false)
    private Integer amount;

    @Column(length = 255)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.RefundStatus status = Enums.RefundStatus.REQUESTED;

    @Column(name = "requested_at", nullable = false)
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private AppUser processedBy;

    public void approve(AppUser admin) {
        this.status = Enums.RefundStatus.COMPLETED;
        this.processedAt = LocalDateTime.now();
        this.processedBy = admin;
    }

    public void reject(AppUser admin, String reason) {
        this.status = Enums.RefundStatus.REJECTED;
        this.reason = reason;
        this.processedAt = LocalDateTime.now();
        this.processedBy = admin;
    }

    public boolean isPending() {
        return status == Enums.RefundStatus.REQUESTED || status == Enums.RefundStatus.APPROVED;
    }
}
