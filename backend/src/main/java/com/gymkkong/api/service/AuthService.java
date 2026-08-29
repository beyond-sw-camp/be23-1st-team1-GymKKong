package com.gymkkong.api.service;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.config.JwtTokenProvider;
import com.gymkkong.api.domain.*;
import com.gymkkong.api.dto.AuthDtos.*;
import com.gymkkong.api.repository.AppUserRepository;
import com.gymkkong.api.repository.Repositories.*;
import com.gymkkong.api.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    /** 인증코드 유효 시간. */
    private static final int CODE_TTL_MINUTES = 5;
    /** 인증 완료 후 이 시간 안에 가입/재설정을 마쳐야 한다. */
    private static final int VERIFIED_WINDOW_MINUTES = 30;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppUserRepository userRepository;
    private final MemberProfileRepository memberProfileRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    // ---------------------------------------------------------------- 가입

    @Transactional
    public TokenResponse signUpMember(SignUpRequest req) {
        assertEmailAvailable(req.email());

        AppUser user = userRepository.save(AppUser.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .name(req.name())
                .phoneNum(normalizePhone(req.phoneNum()))
                .role(Enums.Role.MEMBER)
                .build());

        memberProfileRepository.save(MemberProfile.builder()
                .user(user)
                .birthDate(req.birthDate())
                .gender(req.gender())
                .grade(Enums.MemberGrade.BRONZE)
                .build());

        return issueTokens(user, null);
    }

    @Transactional
    public TokenResponse signUpTrainer(TrainerSignUpRequest req) {
        assertEmailAvailable(req.email());

        AppUser user = userRepository.save(AppUser.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .name(req.name())
                .phoneNum(normalizePhone(req.phoneNum()))
                .role(Enums.Role.TRAINER)
                .build());

        trainerProfileRepository.save(TrainerProfile.builder()
                .user(user)
                .bio(req.bio())
                .specialty(req.specialty())
                .careerYears(req.careerYears() == null ? 0 : req.careerYears())
                .build());

        return issueTokens(user, null);
    }

    private void assertEmailAvailable(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
    }

    // ---------------------------------------------------------------- 로그인

    @Transactional
    public TokenResponse login(LoginRequest req) {
        AppUser user = userRepository.findByEmailAndDeletedAtIsNull(req.email())
                .orElseThrow(() -> new ApiException(ErrorCode.LOGIN_FAILED));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ApiException(ErrorCode.LOGIN_FAILED);
        }
        if (!user.isActive()) {
            throw new ApiException(ErrorCode.ACCOUNT_INACTIVE);
        }

        user.markLoggedIn();
        return issueTokens(user, req.deviceId());
    }

    /** 리프레시 토큰은 1회용이다. 사용 즉시 폐기하고 새로 발급한다(rotation). */
    @Transactional
    public TokenResponse refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenProvider.hash(rawRefreshToken))
                .orElseThrow(() -> new ApiException(ErrorCode.TOKEN_INVALID));

        if (!stored.isUsable()) {
            throw new ApiException(ErrorCode.TOKEN_EXPIRED);
        }
        AppUser user = stored.getUser();
        if (!user.isActive()) {
            throw new ApiException(ErrorCode.ACCOUNT_INACTIVE);
        }

        stored.revoke();
        return issueTokens(user, stored.getDeviceId());
    }

    @Transactional
    public void logout(Long userId, String rawRefreshToken, String pushToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            refreshTokenRepository.findByTokenHash(tokenProvider.hash(rawRefreshToken))
                    .ifPresent(RefreshToken::revoke);
        } else {
            refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId)
                    .forEach(RefreshToken::revoke);
        }
        // 로그아웃한 기기로 더는 푸시를 보내지 않는다.
        if (pushToken != null && !pushToken.isBlank()) {
            deviceTokenRepository.findByToken(pushToken).ifPresent(DeviceToken::deactivate);
        }
    }

    private TokenResponse issueTokens(AppUser user, String deviceId) {
        String access = tokenProvider.createAccessToken(user);
        String refreshRaw = tokenProvider.createRefreshTokenValue();

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .tokenHash(tokenProvider.hash(refreshRaw))
                .deviceId(deviceId)
                .expiresAt(LocalDateTime.ofInstant(tokenProvider.refreshTokenExpiry(), ZoneId.systemDefault()))
                .build());

        return new TokenResponse(access, refreshRaw, tokenProvider.accessTokenSeconds(),
                UserResponse.from(user));
    }

    // ---------------------------------------------------------------- 인증코드

    /**
     * 인증코드 발송. 현재는 실제 SMS/메일 발송기가 없어 로그로만 남긴다.
     * 발송 채널을 붙일 때 이 메서드만 교체하면 된다.
     */
    @Transactional
    public void sendVerificationCode(SendCodeRequest req) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        verificationCodeRepository.save(VerificationCode.builder()
                .channel(req.channel())
                .target(req.target())
                .purpose(req.purpose())
                .codeHash(passwordEncoder.encode(code))
                .expiresAt(LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES))
                .build());

        log.info("[인증코드] channel={} target={} purpose={} code={}",
                req.channel(), req.target(), req.purpose(), code);
    }

    @Transactional
    public void confirmVerificationCode(ConfirmCodeRequest req) {
        VerificationCode vc = verificationCodeRepository
                .findLatest(req.channel(), req.target(), req.purpose())
                .orElseThrow(() -> new ApiException(ErrorCode.VERIFICATION_FAILED));

        if (!vc.isVerifiable()) {
            throw new ApiException(ErrorCode.VERIFICATION_FAILED);
        }
        vc.increaseAttempt();

        if (!passwordEncoder.matches(req.code(), vc.getCodeHash())) {
            throw new ApiException(ErrorCode.VERIFICATION_FAILED);
        }
        vc.markVerified();
    }

    /** 휴대폰 인증 후 가입된 이메일을 마스킹해서 알려준다. */
    @Transactional(readOnly = true)
    public FindAccountResponse findAccount(String phoneNum) {
        List<AppUser> users = userRepository.findByPhoneNumAndDeletedAtIsNull(normalizePhone(phoneNum));
        if (users.isEmpty()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "해당 번호로 가입된 계정이 없습니다.");
        }
        return new FindAccountResponse(maskEmail(users.get(0).getEmail()));
    }

    /**
     * 비밀번호 재설정. 인증코드 확인을 먼저 통과해야 한다.
     * v1은 임시 비밀번호를 평문으로 UPDATE했다.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        VerificationCode vc = verificationCodeRepository
                .findLatest(req.channel(), req.target(), Enums.VerificationPurpose.RESET_PASSWORD)
                .orElseThrow(() -> new ApiException(ErrorCode.VERIFICATION_FAILED));

        if (!vc.isFreshlyVerified(VERIFIED_WINDOW_MINUTES)) {
            throw new ApiException(ErrorCode.VERIFICATION_FAILED, "본인 확인을 다시 진행해주세요.");
        }

        AppUser user = (req.channel() == Enums.VerificationChannel.EMAIL)
                ? userRepository.findByEmailAndDeletedAtIsNull(req.target())
                        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND))
                : userRepository.findByPhoneNumAndDeletedAtIsNull(normalizePhone(req.target()))
                        .stream().findFirst()
                        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        user.changePassword(passwordEncoder.encode(req.newPassword()));

        // 재설정 후 모든 기기의 세션을 끊는다.
        refreshTokenRepository.findByUserIdAndRevokedAtIsNull(user.getId())
                .forEach(RefreshToken::revoke);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(ErrorCode.LOGIN_FAILED, "현재 비밀번호가 올바르지 않습니다.");
        }
        user.changePassword(passwordEncoder.encode(req.newPassword()));
    }

    // ---------------------------------------------------------------- 프로필

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return UserResponse.from(userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND)));
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest req) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        user.updateProfile(req.name(), normalizePhone(req.phoneNum()));

        if (user.getRole() == Enums.Role.MEMBER) {
            memberProfileRepository.findById(userId).ifPresent(p ->
                    p.update(req.birthDate(), req.gender(), null, null, req.profileImageUrl()));
        } else if (user.getRole() == Enums.Role.TRAINER) {
            trainerProfileRepository.findById(userId).ifPresent(p ->
                    p.update(req.bio(), req.specialty(), req.careerYears(), req.profileImageUrl()));
        }
        return UserResponse.from(user);
    }

    @Transactional
    public void withdraw(Long userId) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        user.withdraw();
        refreshTokenRepository.findByUserIdAndRevokedAtIsNull(userId).forEach(RefreshToken::revoke);
        deviceTokenRepository.findByUserIdAndIsActiveTrue(userId).forEach(DeviceToken::deactivate);
    }

    // ---------------------------------------------------------------- 유틸

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.length() == 11) {
            return digits.substring(0, 3) + "-" + digits.substring(3, 7) + "-" + digits.substring(7);
        }
        if (digits.length() == 10) {
            return digits.substring(0, 3) + "-" + digits.substring(3, 6) + "-" + digits.substring(6);
        }
        return phone;
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "*".repeat(Math.max(email.length(), 1));
        String local = email.substring(0, at);
        String visible = local.substring(0, Math.min(2, local.length()));
        return visible + "*".repeat(Math.max(local.length() - visible.length(), 1)) + email.substring(at);
    }
}
