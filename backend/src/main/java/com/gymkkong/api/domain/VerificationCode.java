package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 이메일/휴대폰 인증코드.
 * v1 README는 "이메일·휴대폰 인증 기반"이라고 명시했지만 저장할 테이블이 없었다.
 */
@Entity
@Table(name = "verification_code")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class VerificationCode {

    /** 무차별 대입을 막기 위한 최대 시도 횟수. */
    public static final int MAX_ATTEMPTS = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.VerificationChannel channel;

    @Column(nullable = false, length = 190)
    private String target;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Enums.VerificationPurpose purpose;

    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isVerifiable() {
        return verifiedAt == null
                && attemptCount < MAX_ATTEMPTS
                && expiresAt.isAfter(LocalDateTime.now());
    }

    public void increaseAttempt() {
        this.attemptCount++;
    }

    public void markVerified() {
        this.verifiedAt = LocalDateTime.now();
    }

    /** 인증 완료 후 가입/비밀번호 재설정에 사용할 수 있는 유효 시간 내인지. */
    public boolean isFreshlyVerified(int withinMinutes) {
        return verifiedAt != null
                && verifiedAt.isAfter(LocalDateTime.now().minusMinutes(withinMinutes));
    }
}
