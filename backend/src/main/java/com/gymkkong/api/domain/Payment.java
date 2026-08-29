package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Payment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membership_id")
    private Membership membership;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_user_id")
    private AppUser member;

    @Column(nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.PaymentMethod method = Enums.PaymentMethod.CARD;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.PaymentStatus status = Enums.PaymentStatus.PAID;

    /** PG 거래 ID. UNIQUE 제약이 걸려 있어 중복 결제 콜백을 막는다. */
    @Column(name = "pg_tid", length = 190, unique = true)
    private String pgTid;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public void markPaid(String pgTid) {
        this.status = Enums.PaymentStatus.PAID;
        this.pgTid = pgTid;
        this.paidAt = LocalDateTime.now();
    }

    public void markCanceled() {
        this.status = Enums.PaymentStatus.CANCELED;
    }
}
