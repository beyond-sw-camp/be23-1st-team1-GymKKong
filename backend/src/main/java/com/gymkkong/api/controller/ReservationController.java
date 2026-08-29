package com.gymkkong.api.controller;

import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.dto.ClassDtos.SessionResponse;
import com.gymkkong.api.dto.ReservationDtos.*;
import com.gymkkong.api.service.ClassService;
import com.gymkkong.api.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "예약", description = "수업 예약 / 취소 / 내 예약")
@RestController
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final ClassService classService;

    @Operation(summary = "수업 상세", description = "비로그인도 조회 가능.")
    @GetMapping("/api/sessions/{sessionId}")
    public ResponseEntity<SessionResponse> session(@PathVariable Long sessionId,
                                                   @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(classService.session(sessionId, user != null ? user.id() : null));
    }

    @Operation(summary = "수업 예약",
            description = "정원/중복/이용권을 한 트랜잭션에서 검증하고 이용권을 즉시 차감한다. "
                    + "membershipId를 생략하면 만료가 임박한 이용권부터 자동 선택한다.")
    @PreAuthorize("hasRole('MEMBER')")
    @PostMapping("/api/reservations")
    public ResponseEntity<ReservationResponse> reserve(@AuthenticationPrincipal AuthUser user,
                                                       @Valid @RequestBody CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservationService.reserve(user.id(), req));
    }

    @Operation(summary = "내 예약 목록", description = "status를 여러 개 넘겨 필터링할 수 있다.")
    @PreAuthorize("hasRole('MEMBER')")
    @GetMapping("/api/reservations/me")
    public ResponseEntity<PageResponse<ReservationResponse>> myReservations(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam(required = false) List<Enums.ReservationStatus> status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(reservationService.myReservations(user.id(), status, pageable));
    }

    @Operation(summary = "예약 취소",
            description = "수업 시작 2시간 전까지만 가능하며, 취소 시 이용권이 복원된다.")
    @PreAuthorize("hasRole('MEMBER')")
    @DeleteMapping("/api/reservations/{reservationId}")
    public ResponseEntity<Void> cancel(@AuthenticationPrincipal AuthUser user,
                                       @PathVariable Long reservationId) {
        reservationService.cancel(user.id(), reservationId);
        return ResponseEntity.noContent().build();
    }
}
