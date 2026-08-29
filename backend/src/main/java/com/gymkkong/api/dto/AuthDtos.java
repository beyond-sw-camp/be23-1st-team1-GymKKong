package com.gymkkong.api.dto;

import com.gymkkong.api.domain.AppUser;
import com.gymkkong.api.domain.Enums;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public final class AuthDtos {

    private AuthDtos() {}

    public record SignUpRequest(
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 64) String password,
            @NotBlank @Size(max = 100) String name,
            @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다.")
            String phoneNum,
            LocalDate birthDate,
            Enums.Gender gender
    ) {}

    public record TrainerSignUpRequest(
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 64) String password,
            @NotBlank @Size(max = 100) String name,
            @Pattern(regexp = "^01[0-9]-?\\d{3,4}-?\\d{4}$", message = "휴대폰 번호 형식이 올바르지 않습니다.")
            String phoneNum,
            @Size(max = 255) String specialty,
            String bio,
            @Min(0) @Max(70) Integer careerYears
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password,
            /** 기기별 세션 관리를 위한 식별자. 없으면 단일 세션으로 취급한다. */
            String deviceId
    ) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record TokenResponse(
            String accessToken,
            String refreshToken,
            long expiresIn,
            UserResponse user
    ) {}

    public record UserResponse(
            Long id,
            String email,
            String name,
            String phoneNum,
            Enums.Role role,
            Enums.UserStatus status
    ) {
        public static UserResponse from(AppUser u) {
            return new UserResponse(u.getId(), u.getEmail(), u.getName(),
                    u.getPhoneNum(), u.getRole(), u.getStatus());
        }
    }

    public record SendCodeRequest(
            @NotNull Enums.VerificationChannel channel,
            @NotBlank String target,
            @NotNull Enums.VerificationPurpose purpose
    ) {}

    public record ConfirmCodeRequest(
            @NotNull Enums.VerificationChannel channel,
            @NotBlank String target,
            @NotNull Enums.VerificationPurpose purpose,
            @NotBlank @Size(min = 6, max = 6) String code
    ) {}

    public record ResetPasswordRequest(
            @NotNull Enums.VerificationChannel channel,
            @NotBlank String target,
            @NotBlank @Size(min = 8, max = 64) String newPassword
    ) {}

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 64) String newPassword
    ) {}

    public record UpdateProfileRequest(
            @Size(max = 100) String name,
            String phoneNum,
            LocalDate birthDate,
            Enums.Gender gender,
            String profileImageUrl,
            String bio,
            String specialty,
            Integer careerYears
    ) {}

    public record FindAccountResponse(String maskedEmail) {}
}
