package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

/** 지점이 판매하는 이용권 상품. v1은 이 상품이 수업 1개(class_id)에 묶여 있었다. */
@Entity
@Table(name = "membership_plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class MembershipPlan extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id")
    private Place place;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "valid_days", nullable = false)
    @Builder.Default
    private Integer validDays = 90;

    @Enumerated(EnumType.STRING)
    @Column(name = "class_type", nullable = false)
    @Builder.Default
    private Enums.PlanScope classType = Enums.PlanScope.ALL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.PlaceStatus status = Enums.PlaceStatus.ACTIVE;

    /** 이 상품으로 해당 종류의 수업을 예약할 수 있는지. */
    public boolean covers(Enums.ClassType type) {
        return classType == Enums.PlanScope.ALL || classType.name().equals(type.name());
    }

    public void update(String name, Integer totalCount, Integer price, Integer validDays,
                       Enums.PlanScope classType, Enums.PlaceStatus status) {
        if (name != null) this.name = name;
        if (totalCount != null) this.totalCount = totalCount;
        if (price != null) this.price = price;
        if (validDays != null) this.validDays = validDays;
        if (classType != null) this.classType = classType;
        if (status != null) this.status = status;
    }
}
