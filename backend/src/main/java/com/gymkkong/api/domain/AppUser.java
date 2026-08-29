package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "app_user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class AppUser extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 190)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "phone_num", length = 20)
    private String phoneNum;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.UserStatus status = Enums.UserStatus.ACTIVE;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    @Column(name = "phone_verified_at")
    private LocalDateTime phoneVerifiedAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public boolean isActive() {
        return status == Enums.UserStatus.ACTIVE && deletedAt == null;
    }

    public void changePassword(String newHash) {
        this.passwordHash = newHash;
    }

    public void updateProfile(String name, String phoneNum) {
        if (name != null && !name.isBlank()) this.name = name;
        if (phoneNum != null && !phoneNum.isBlank()) this.phoneNum = phoneNum;
    }

    public void markLoggedIn() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void markEmailVerified() {
        this.emailVerifiedAt = LocalDateTime.now();
    }

    /** 소프트 삭제. 이메일 UNIQUE 제약이 있어 재가입 시 별도 정책이 필요하다. */
    public void withdraw() {
        this.status = Enums.UserStatus.INACTIVE;
        this.deletedAt = LocalDateTime.now();
    }
}
