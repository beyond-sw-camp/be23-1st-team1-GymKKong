package com.gymkkong.api.controller;

import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.dto.ClassDtos.ProgramResponse;
import com.gymkkong.api.dto.ClassDtos.SessionResponse;
import com.gymkkong.api.dto.CommunityDtos.*;
import com.gymkkong.api.dto.PlaceDtos.*;
import com.gymkkong.api.service.ClassService;
import com.gymkkong.api.service.CommunityService;
import com.gymkkong.api.service.PlaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** 지점 탐색과 지점 게시판. GET은 비로그인도 허용한다. */
@Tag(name = "지점", description = "지점 검색 / 상세 / 시간표 / 게시판")
@RestController
@RequestMapping("/api/places")
@RequiredArgsConstructor
public class PlaceController {

    private final PlaceService placeService;
    private final ClassService classService;
    private final CommunityService communityService;

    @Operation(summary = "지점 검색", description = "이름 또는 주소 부분 일치.")
    @GetMapping
    public ResponseEntity<PageResponse<PlaceSummary>> search(
            @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal AuthUser user,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(placeService.search(keyword, viewerId(user), pageable));
    }

    @Operation(summary = "내 주변 지점", description = "좌표 기준 반경 내 지점을 가까운 순으로 반환한다.")
    @GetMapping("/nearby")
    public ResponseEntity<List<PlaceSummary>> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radiusKm,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(placeService.nearby(lat, lng, radiusKm, limit, viewerId(user)));
    }

    @Operation(summary = "지점 상세")
    @GetMapping("/{placeId}")
    public ResponseEntity<PlaceDetail> detail(@PathVariable Long placeId,
                                              @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(placeService.detail(placeId, viewerId(user)));
    }

    @Operation(summary = "지점 소속 트레이너")
    @GetMapping("/{placeId}/trainers")
    public ResponseEntity<List<TrainerSummary>> trainers(@PathVariable Long placeId) {
        return ResponseEntity.ok(placeService.trainers(placeId));
    }

    @Operation(summary = "지점 강습실")
    @GetMapping("/{placeId}/rooms")
    public ResponseEntity<List<RoomResponse>> rooms(@PathVariable Long placeId) {
        return ResponseEntity.ok(placeService.rooms(placeId));
    }

    @Operation(summary = "지점 이용권 상품")
    @GetMapping("/{placeId}/plans")
    public ResponseEntity<List<PlanResponse>> plans(@PathVariable Long placeId) {
        return ResponseEntity.ok(placeService.plans(placeId));
    }

    @Operation(summary = "지점 강습 프로그램")
    @GetMapping("/{placeId}/programs")
    public ResponseEntity<List<ProgramResponse>> programs(@PathVariable Long placeId) {
        return ResponseEntity.ok(classService.programsOfPlace(placeId));
    }

    @Operation(summary = "지점 시간표",
            description = "date부터 days일치 회차를 반환한다. 로그인 시 내 예약 여부(reservedByMe)가 채워진다.")
    @GetMapping("/{placeId}/sessions")
    public ResponseEntity<List<SessionResponse>> timetable(
            @PathVariable Long placeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "1") Integer days,
            @RequestParam(required = false) Enums.ClassType classType,
            @AuthenticationPrincipal AuthUser user) {
        return ResponseEntity.ok(classService.timetable(placeId, date, days, classType, viewerId(user)));
    }

    // ------------------------------------------------------------ 게시판

    @Operation(summary = "지점 게시글 목록")
    @GetMapping("/{placeId}/posts")
    public ResponseEntity<PageResponse<PostSummary>> posts(
            @PathVariable Long placeId,
            @RequestParam(required = false) Enums.PostType type,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(communityService.list(placeId, type, pageable));
    }

    @Operation(summary = "게시글 작성", description = "회원/트레이너/관리자 모두 가능. 공지는 트레이너 이상만.")
    @PostMapping("/{placeId}/posts")
    public ResponseEntity<PostDetail> createPost(@AuthenticationPrincipal AuthUser user,
                                                 @PathVariable Long placeId,
                                                 @Valid @RequestBody PostCreateRequest req) {
        return ResponseEntity.ok(communityService.create(user, placeId, req));
    }

    private Long viewerId(AuthUser user) {
        return user != null ? user.id() : null;
    }
}
