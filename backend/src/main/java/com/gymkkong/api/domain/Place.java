package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "place")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Place extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(name = "address_detail", length = 255)
    private String addressDetail;

    @Column(name = "phone_num", length = 20)
    private String phoneNum;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** 앱의 '내 주변 지점' 정렬에 사용. v1 스키마에는 좌표가 없었다. */
    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.PlaceStatus status = Enums.PlaceStatus.ACTIVE;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public void update(String name, String address, String addressDetail, String phoneNum,
                       String description, BigDecimal latitude, BigDecimal longitude,
                       LocalTime openTime, LocalTime closeTime, String imageUrl) {
        if (name != null) this.name = name;
        if (address != null) this.address = address;
        if (addressDetail != null) this.addressDetail = addressDetail;
        if (phoneNum != null) this.phoneNum = phoneNum;
        if (description != null) this.description = description;
        if (latitude != null) this.latitude = latitude;
        if (longitude != null) this.longitude = longitude;
        if (openTime != null) this.openTime = openTime;
        if (closeTime != null) this.closeTime = closeTime;
        if (imageUrl != null) this.imageUrl = imageUrl;
    }

    /** v1의 관리자 지점 삭제는 물리 DELETE라 FK 참조가 있으면 실패했다. */
    public void softDelete() {
        this.status = Enums.PlaceStatus.INACTIVE;
        this.deletedAt = LocalDateTime.now();
    }
}
