package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 강습의 "정의". 실제 예약 대상은 ClassSession이다.
 * v1의 class는 start_time 하나만 가진 단일 회차여서 10회권 같은 상품과 모순이었다.
 */
@Entity
@Table(name = "class_program")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class ClassProgram extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id")
    private Place place;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trainer_user_id")
    private AppUser trainer;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "class_type", nullable = false)
    @Builder.Default
    private Enums.ClassType classType = Enums.ClassType.GROUP;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.ClassLevel level = Enums.ClassLevel.ALL;

    /** v1은 수업 길이 컬럼이 없어 진행중 판정을 2시간으로 하드코딩했다. */
    @Column(name = "duration_min", nullable = false)
    @Builder.Default
    private Integer durationMin = 60;

    @Column(name = "default_capacity", nullable = false)
    @Builder.Default
    private Integer defaultCapacity = 10;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.PlaceStatus status = Enums.PlaceStatus.ACTIVE;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void update(String name, String description, Enums.ClassLevel level,
                       Integer durationMin, Integer defaultCapacity, String imageUrl) {
        if (name != null) this.name = name;
        if (description != null) this.description = description;
        if (level != null) this.level = level;
        if (durationMin != null) this.durationMin = durationMin;
        if (defaultCapacity != null) this.defaultCapacity = defaultCapacity;
        if (imageUrl != null) this.imageUrl = imageUrl;
    }

    public void softDelete() {
        this.status = Enums.PlaceStatus.INACTIVE;
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isOwnedBy(Long trainerUserId) {
        return trainer.getId().equals(trainerUserId);
    }
}
