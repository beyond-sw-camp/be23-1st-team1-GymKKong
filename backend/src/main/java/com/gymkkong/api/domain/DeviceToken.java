package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

/** Expo push token. 로그아웃 시 비활성화한다. */
@Entity
@Table(name = "device_token")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class DeviceToken extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(nullable = false, length = 500)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.DevicePlatform platform;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /** 같은 토큰이 다른 계정으로 재등록되는 기기 공유 상황을 처리한다. */
    public void reassign(AppUser user, Enums.DevicePlatform platform) {
        this.user = user;
        this.platform = platform;
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }
}
