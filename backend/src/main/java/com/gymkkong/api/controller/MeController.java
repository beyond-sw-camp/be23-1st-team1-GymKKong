package com.gymkkong.api.controller;

import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.domain.AppUser;
import com.gymkkong.api.dto.AuthDtos.*;
import com.gymkkong.api.dto.CommunityDtos.*;
import com.gymkkong.api.dto.MembershipDtos.*;
import com.gymkkong.api.dto.PlaceDtos.*;
import com.gymkkong.api.repository.AppUserRepository;
import com.gymkkong.api.service.AuthService;
import com.gymkkong.api.service.MembershipService;
import com.gymkkong.api.service.NotificationService;
import com.gymkkong.api.service.PlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** 로그인한 사용자 본인에 관한 모든 조회/변경. */
@Tag(name = "내 정보", description = "프로필 / 이용권 / 결제 / 알림 / 즐겨찾기")
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class MeController {

    private final AuthService authService;
    private final MembershipService membershipService;
    private final NotificationService notificationService;
    private final PlaceService placeService;
    private final AppUserRepository userRepository;

    @Operation(summary = "내 정보")
    @GetMapping
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(authService.me(user.id()));
    }

    @Operation(summary = "프로필 수정")
    @PatchMapping
    public ResponseEntity<UserResponse> update(@AuthenticationPrincipal AuthUser user,
                                               @Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(authService.updateProfile(user.id(), req));
    }

    @Operation(summary = "비밀번호 변경")
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal AuthUser user,
                                               @Valid @RequestBody ChangePasswordRequest req) {
        authService.changePassword(user.id(), req);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "회원 탈퇴", description = "소프트 삭제. 예약/결제 이력은 보존된다.")
    @DeleteMapping
    public ResponseEntity<Void> withdraw(@AuthenticationPrincipal AuthUser user) {
        authService.withdraw(user.id());
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------ 이용권 / 결제

    @Operation(summary = "내 이용권 목록", description = "환불 가능 여부와 예상 환불액을 함께 내려준다.")
    @GetMapping("/memberships")
    public ResponseEntity<List<MembershipResponse>> memberships(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(membershipService.myMemberships(user.id()));
    }

    @Operation(summary = "이용권 구매")
    @PostMapping("/memberships")
    public ResponseEntity<MembershipResponse> purchase(@AuthenticationPrincipal AuthUser user,
                                                       @Valid @RequestBody PurchaseRequest req) {
        return ResponseEntity.ok(membershipService.purchase(user.id(), req));
    }

    @Operation(summary = "이용권 환불 요청", description = "잔여 횟수 비율로 금액이 계산되며 관리자 승인이 필요하다.")
    @PostMapping("/memberships/{membershipId}/refund")
    public ResponseEntity<RefundResponse> refund(@AuthenticationPrincipal AuthUser user,
                                                 @PathVariable Long membershipId,
                                                 @RequestBody(required = false) RefundRequest req) {
        RefundRequest body = req != null ? req : new RefundRequest(null);
        return ResponseEntity.ok(membershipService.requestRefund(user.id(), membershipId, body));
    }

    @Operation(summary = "내 결제 내역")
    @GetMapping("/payments")
    public ResponseEntity<List<PaymentResponse>> payments(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(membershipService.myPayments(user.id()));
    }

    // ------------------------------------------------------------ 알림 / 기기

    @Operation(summary = "알림 목록")
    @GetMapping("/notifications")
    public ResponseEntity<PageResponse<NotificationResponse>> notifications(
            @AuthenticationPrincipal AuthUser user,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(notificationService.list(user.id(), pageable));
    }

    @Operation(summary = "읽지 않은 알림 수", description = "앱 탭 뱃지용.")
    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(user.id())));
    }

    @Operation(summary = "알림 읽음 처리")
    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markRead(@AuthenticationPrincipal AuthUser user,
                                         @PathVariable Long id) {
        notificationService.markRead(user.id(), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "푸시 토큰 등록", description = "Expo push token을 저장한다.")
    @PostMapping("/devices")
    public ResponseEntity<Void> registerDevice(@AuthenticationPrincipal AuthUser user,
                                               @Valid @RequestBody DeviceTokenRequest req) {
        AppUser appUser = userRepository.getReferenceById(user.id());
        notificationService.registerDevice(appUser, req);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------ 즐겨찾기

    @Operation(summary = "즐겨찾기 지점 목록")
    @GetMapping("/favorites")
    public ResponseEntity<List<PlaceSummary>> favorites(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(placeService.myFavorites(user.id()));
    }

    @Operation(summary = "지점 즐겨찾기 토글")
    @PostMapping("/favorites/{placeId}")
    public ResponseEntity<Map<String, Boolean>> toggleFavorite(@AuthenticationPrincipal AuthUser user,
                                                               @PathVariable Long placeId) {
        return ResponseEntity.ok(Map.of("favorite", placeService.toggleFavorite(user.id(), placeId)));
    }
}
