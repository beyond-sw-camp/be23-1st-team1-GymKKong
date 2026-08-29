package com.gymkkong.api.controller;

import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.dto.AuthDtos.*;
import com.gymkkong.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "인증", description = "가입 / 로그인 / 토큰 / 계정")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "회원 가입")
    @PostMapping("/signup/member")
    public ResponseEntity<TokenResponse> signUpMember(@Valid @RequestBody SignUpRequest req) {
        return ResponseEntity.ok(authService.signUpMember(req));
    }

    @Operation(summary = "트레이너 가입")
    @PostMapping("/signup/trainer")
    public ResponseEntity<TokenResponse> signUpTrainer(@Valid @RequestBody TrainerSignUpRequest req) {
        return ResponseEntity.ok(authService.signUpTrainer(req));
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @Operation(summary = "액세스 토큰 재발급", description = "리프레시 토큰은 1회용이며 사용 즉시 교체된다.")
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req.refreshToken()));
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal AuthUser user,
                                       @RequestBody(required = false) Map<String, String> body) {
        String refreshToken = body != null ? body.get("refreshToken") : null;
        String pushToken = body != null ? body.get("pushToken") : null;
        authService.logout(user.id(), refreshToken, pushToken);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "인증번호 발송", description = "개발 환경에서는 서버 로그에 코드가 출력된다.")
    @PostMapping("/verification/send")
    public ResponseEntity<Void> sendCode(@Valid @RequestBody SendCodeRequest req) {
        authService.sendVerificationCode(req);
        return ResponseEntity.accepted().build();
    }

    @Operation(summary = "인증번호 확인")
    @PostMapping("/verification/confirm")
    public ResponseEntity<Void> confirmCode(@Valid @RequestBody ConfirmCodeRequest req) {
        authService.confirmVerificationCode(req);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "계정 찾기", description = "휴대폰 번호로 가입된 이메일을 마스킹해 반환한다.")
    @GetMapping("/find-account")
    public ResponseEntity<FindAccountResponse> findAccount(@RequestParam String phoneNum) {
        return ResponseEntity.ok(authService.findAccount(phoneNum));
    }

    @Operation(summary = "비밀번호 재설정", description = "인증번호 확인을 먼저 통과해야 한다.")
    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.noContent().build();
    }
}
