package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** 트레이너의 지점 소속 신청/승인. */
@Entity
@Table(name = "place_trainer")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class PlaceTrainer extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id")
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser trainer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.PlaceTrainerStatus status = Enums.PlaceTrainerStatus.PENDING;

    @Column(name = "requested_at", nullable = false)
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private AppUser approvedBy;

    public void approve(AppUser admin) {
        this.status = Enums.PlaceTrainerStatus.ACTIVE;
        this.approvedAt = LocalDateTime.now();
        this.approvedBy = admin;
    }

    public void reject(AppUser admin) {
        this.status = Enums.PlaceTrainerStatus.REJECTED;
        this.approvedAt = LocalDateTime.now();
        this.approvedBy = admin;
    }

    public void deactivate() {
        this.status = Enums.PlaceTrainerStatus.INACTIVE;
    }
}
