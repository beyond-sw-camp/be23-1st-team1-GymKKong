package com.gymkkong.api.controller;

import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.dto.AuthDtos.UserResponse;
import com.gymkkong.api.dto.MembershipDtos.*;
import com.gymkkong.api.dto.PlaceDtos.*;
import com.gymkkong.api.service.AdminService;
import com.gymkkong.api.service.MembershipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 지점 운영. SecurityConfig에서 ADMIN/SUPER_ADMIN만 접근하도록 막아둔다. */
@Tag(name = "관리자", description = "지점 운영 / 트레이너 승인 / 환불 처리")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final MembershipService membershipService;

    // ------------------------------------------------------------ 지점

    @Operation(summary = "지점 생성", description = "최고 관리자만 가능.")
    @PostMapping("/places")
    public ResponseEntity<PlaceDetail> createPlace(@AuthenticationPrincipal AuthUser admin,
                                                   @Valid @RequestBody PlaceCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createPlace(admin, req));
    }

    @Operation(summary = "지점 수정")
    @PatchMapping("/places/{placeId}")
    public ResponseEntity<PlaceDetail> updatePlace(@AuthenticationPrincipal AuthUser admin,
                                                   @PathVariable Long placeId,
                                                   @Valid @RequestBody PlaceCreateRequest req) {
        return ResponseEntity.ok(adminService.updatePlace(admin, placeId, req));
    }

    @Operation(summary = "지점 폐점",
            description = "물리 삭제가 아니라 소프트 삭제. 예약·결제 이력이 보존된다.")
    @DeleteMapping("/places/{placeId}")
    public ResponseEntity<Void> closePlace(@AuthenticationPrincipal AuthUser admin,
                                           @PathVariable Long placeId) {
        adminService.closePlace(admin, placeId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "강습실 등록")
    @PostMapping("/places/{placeId}/rooms")
    public ResponseEntity<RoomResponse> createRoom(@AuthenticationPrincipal AuthUser admin,
                                                   @PathVariable Long placeId,
                                                   @Valid @RequestBody RoomCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createRoom(admin, placeId, req));
    }

    @Operation(summary = "이용권 상품 등록")
    @PostMapping("/places/{placeId}/plans")
    public ResponseEntity<PlanResponse> createPlan(@AuthenticationPrincipal AuthUser admin,
                                                   @PathVariable Long placeId,
                                                   @Valid @RequestBody PlanCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createPlan(admin, placeId, req));
    }

    @Operation(summary = "이용권 상품 수정")
    @PatchMapping("/plans/{planId}")
    public ResponseEntity<PlanResponse> updatePlan(@AuthenticationPrincipal AuthUser admin,
                                                   @PathVariable Long planId,
                                                   @Valid @RequestBody PlanCreateRequest req) {
        return ResponseEntity.ok(adminService.updatePlan(admin, planId, req));
    }

    // ------------------------------------------------------------ 트레이너

    @Operation(summary = "트레이너 소속 승인 대기 목록")
    @GetMapping("/places/{placeId}/trainers/pending")
    public ResponseEntity<List<PendingTrainer>> pendingTrainers(@AuthenticationPrincipal AuthUser admin,
                                                                @PathVariable Long placeId) {
        return ResponseEntity.ok(adminService.pendingTrainers(admin, placeId));
    }

    @Operation(summary = "트레이너 소속 승인/거절")
    @PostMapping("/place-trainers/{placeTrainerId}/decision")
    public ResponseEntity<Void> decideTrainer(@AuthenticationPrincipal AuthUser admin,
                                              @PathVariable Long placeTrainerId,
                                              @RequestParam boolean approve) {
        adminService.decideTrainer(admin, placeTrainerId, approve);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "트레이너 소속 해제")
    @DeleteMapping("/places/{placeId}/trainers/{trainerId}")
    public ResponseEntity<Void> removeTrainer(@AuthenticationPrincipal AuthUser admin,
                                              @PathVariable Long placeId,
                                              @PathVariable Long trainerId) {
        adminService.removeTrainer(admin, placeId, trainerId);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------ 회원 / 환불

    @Operation(summary = "회원 목록")
    @GetMapping("/members")
    public ResponseEntity<PageResponse<UserResponse>> members(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.members(keyword, pageable));
    }

    @Operation(summary = "트레이너 목록")
    @GetMapping("/trainers")
    public ResponseEntity<PageResponse<UserResponse>> trainers(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.trainers(keyword, pageable));
    }

    @Operation(summary = "환불 요청 목록")
    @GetMapping("/refunds")
    public ResponseEntity<PageResponse<RefundResponse>> refunds(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(membershipService.pendingRefunds(pageable));
    }

    @Operation(summary = "환불 승인/거절",
            description = "승인 시에만 이용권이 REFUNDED로 소멸한다. 이미 처리된 요청은 400.")
    @PostMapping("/refunds/{refundId}/decision")
    public ResponseEntity<RefundResponse> decideRefund(@AuthenticationPrincipal AuthUser admin,
                                                       @PathVariable Long refundId,
                                                       @Valid @RequestBody RefundDecisionRequest req) {
        return ResponseEntity.ok(membershipService.decideRefund(admin.id(), refundId, req));
    }
}
