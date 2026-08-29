package com.gymkkong.api.controller;

import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.dto.ClassDtos.*;
import com.gymkkong.api.dto.PlaceDtos.MyPlaceResponse;
import com.gymkkong.api.dto.PlaceDtos.TrainerJoinRequest;
import com.gymkkong.api.service.ClassService;
import com.gymkkong.api.service.PlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Tag(name = "트레이너", description = "소속 신청 / 강습 개설 / 출석 관리")
@RestController
@RequestMapping("/api/trainer")
@PreAuthorize("hasRole('TRAINER')")
@RequiredArgsConstructor
public class TrainerController {

    private final ClassService classService;
    private final PlaceService placeService;

    // ------------------------------------------------------------ 소속

    @Operation(summary = "지점 소속 신청", description = "관리자 승인 전까지 PENDING 상태다.")
    @PostMapping("/places")
    public ResponseEntity<Void> requestJoin(@AuthenticationPrincipal AuthUser user,
                                            @Valid @RequestBody TrainerJoinRequest req) {
        placeService.requestJoin(user.id(), req.placeId());
        return ResponseEntity.accepted().build();
    }

    @Operation(summary = "내 소속 지점 목록", description = "승인 대기 중인 신청도 함께 보여준다.")
    @GetMapping("/places")
    public ResponseEntity<List<MyPlaceResponse>> myPlaces(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(placeService.myPlaces(user.id()));
    }

    // ------------------------------------------------------------ 강습 프로그램

    @Operation(summary = "내 강습 프로그램 목록")
    @GetMapping("/programs")
    public ResponseEntity<List<ProgramResponse>> myPrograms(@AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(classService.myPrograms(user.id()));
    }

    @Operation(summary = "강습 개설", description = "해당 지점에 ACTIVE 상태로 승인된 트레이너만 가능하다.")
    @PostMapping("/programs")
    public ResponseEntity<ProgramResponse> createProgram(@AuthenticationPrincipal AuthUser user,
                                                         @Valid @RequestBody ProgramCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classService.createProgram(user.id(), req));
    }

    @Operation(summary = "강습 수정")
    @PatchMapping("/programs/{programId}")
    public ResponseEntity<ProgramResponse> updateProgram(@AuthenticationPrincipal AuthUser user,
                                                         @PathVariable Long programId,
                                                         @Valid @RequestBody ProgramUpdateRequest req) {
        return ResponseEntity.ok(classService.updateProgram(user.id(), programId, req));
    }

    @Operation(summary = "강습 삭제")
    @DeleteMapping("/programs/{programId}")
    public ResponseEntity<Void> deleteProgram(@AuthenticationPrincipal AuthUser user,
                                              @PathVariable Long programId) {
        classService.deleteProgram(user.id(), programId);
        return ResponseEntity.noContent().build();
    }

    // ------------------------------------------------------------ 회차

    @Operation(summary = "회차 개설",
            description = "종료시각은 강습의 durationMin으로 계산되며, 같은 강습실의 겹치는 시간대는 거부된다.")
    @PostMapping("/programs/{programId}/sessions")
    public ResponseEntity<SessionResponse> createSession(@AuthenticationPrincipal AuthUser user,
                                                         @PathVariable Long programId,
                                                         @Valid @RequestBody SessionCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classService.createSession(user.id(), programId, req));
    }

    @Operation(summary = "회차 반복 개설",
            description = "매주 같은 요일·시간으로 개설한다. 충돌하는 주는 건너뛴다.")
    @PostMapping("/programs/{programId}/sessions/weekly")
    public ResponseEntity<List<SessionResponse>> createWeekly(@AuthenticationPrincipal AuthUser user,
                                                              @PathVariable Long programId,
                                                              @Valid @RequestBody SessionBulkCreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classService.createSessionsWeekly(user.id(), programId, req));
    }

    @Operation(summary = "내 수업 일정")
    @GetMapping("/sessions")
    public ResponseEntity<List<SessionResponse>> mySessions(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(defaultValue = "7") Integer days) {
        return ResponseEntity.ok(classService.mySessions(user.id(), from, days));
    }

    @Operation(summary = "수업 취소",
            description = "예약자 전원의 이용권을 복원하고 알림을 보낸다.")
    @PostMapping("/sessions/{sessionId}/cancel")
    public ResponseEntity<Map<String, Integer>> cancelSession(@AuthenticationPrincipal AuthUser user,
                                                              @PathVariable Long sessionId,
                                                              @RequestBody(required = false) SessionCancelRequest req) {
        String reason = req != null ? req.reason() : null;
        int restored = classService.cancelSession(user.id(), sessionId, reason);
        return ResponseEntity.ok(Map.of("canceledReservations", restored));
    }

    // ------------------------------------------------------------ 출석

    @Operation(summary = "예약자 명단", description = "출석 체크 화면용.")
    @GetMapping("/sessions/{sessionId}/roster")
    public ResponseEntity<List<RosterRow>> roster(@AuthenticationPrincipal AuthUser user,
                                                  @PathVariable Long sessionId) {
        return ResponseEntity.ok(classService.roster(user.id(), sessionId));
    }

    @Operation(summary = "출석 처리",
            description = "이용권은 예약 시점에 이미 차감되므로 여기서는 상태만 바꾼다(이중 차감 없음).")
    @PostMapping("/sessions/{sessionId}/attendance")
    public ResponseEntity<Void> checkAttendance(@AuthenticationPrincipal AuthUser user,
                                                @PathVariable Long sessionId,
                                                @Valid @RequestBody BulkAttendanceRequest req) {
        classService.checkAttendance(user.id(), sessionId, req.items());
        return ResponseEntity.noContent().build();
    }
}
