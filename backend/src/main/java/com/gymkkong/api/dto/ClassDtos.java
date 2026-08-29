package com.gymkkong.api.dto;

import com.gymkkong.api.domain.ClassProgram;
import com.gymkkong.api.domain.ClassSession;
import com.gymkkong.api.domain.Enums;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public final class ClassDtos {

    private ClassDtos() {}

    public record ProgramResponse(
            Long id,
            Long placeId,
            String placeName,
            Long trainerUserId,
            String trainerName,
            String name,
            String description,
            Enums.ClassType classType,
            Enums.ClassLevel level,
            Integer durationMin,
            Integer defaultCapacity,
            String imageUrl
    ) {
        public static ProgramResponse from(ClassProgram p) {
            return new ProgramResponse(
                    p.getId(), p.getPlace().getId(), p.getPlace().getName(),
                    p.getTrainer().getId(), p.getTrainer().getName(),
                    p.getName(), p.getDescription(), p.getClassType(), p.getLevel(),
                    p.getDurationMin(), p.getDefaultCapacity(), p.getImageUrl());
        }
    }

    /** 앱 시간표 카드에 그대로 바인딩되는 형태. */
    public record SessionResponse(
            Long id,
            Long programId,
            String programName,
            Enums.ClassType classType,
            Enums.ClassLevel level,
            LocalDateTime startAt,
            LocalDateTime endAt,
            Integer capacity,
            Integer reservedCount,
            Integer remainSeat,
            Enums.SessionStatus status,
            Long placeId,
            String placeName,
            String roomNum,
            Long trainerUserId,
            String trainerName,
            /** 로그인한 회원의 예약 여부. 비로그인 시 항상 false. */
            boolean reservedByMe
    ) {
        public static SessionResponse from(ClassSession s, boolean reservedByMe) {
            ClassProgram p = s.getProgram();
            return new SessionResponse(
                    s.getId(), p.getId(), p.getName(), p.getClassType(), p.getLevel(),
                    s.getStartAt(), s.getEndAt(), s.getCapacity(), s.getReservedCount(),
                    s.remainSeat(), s.derivedStatus(),
                    p.getPlace().getId(), p.getPlace().getName(), s.getRoom().getRoomNum(),
                    p.getTrainer().getId(), p.getTrainer().getName(),
                    reservedByMe);
        }
    }

    public record ProgramCreateRequest(
            @NotNull Long placeId,
            @NotBlank @Size(max = 150) String name,
            String description,
            @NotNull Enums.ClassType classType,
            Enums.ClassLevel level,
            @NotNull @Min(10) @Max(300) Integer durationMin,
            @NotNull @Min(1) @Max(100) Integer defaultCapacity,
            String imageUrl
    ) {}

    public record ProgramUpdateRequest(
            @Size(max = 150) String name,
            String description,
            Enums.ClassLevel level,
            @Min(10) @Max(300) Integer durationMin,
            @Min(1) @Max(100) Integer defaultCapacity,
            String imageUrl
    ) {}

    /**
     * 회차 개설. endAt은 프로그램의 durationMin으로 계산하므로 받지 않는다.
     * v1은 종료시각 자체가 없어 충돌 검사를 1시간으로 고정했다.
     */
    public record SessionCreateRequest(
            @NotNull Long roomId,
            @NotNull @Future LocalDateTime startAt,
            @Min(1) @Max(100) Integer capacity
    ) {}

    /** 같은 시간대를 여러 날짜에 한 번에 개설한다. */
    public record SessionBulkCreateRequest(
            @NotNull Long roomId,
            @NotNull @Future LocalDateTime firstStartAt,
            @NotNull @Min(1) @Max(52) Integer weeks,
            @Min(1) @Max(100) Integer capacity
    ) {}

    public record SessionCancelRequest(@Size(max = 255) String reason) {}

    /** 트레이너 출석 화면의 한 줄. */
    public record RosterRow(
            Long reservationId,
            Long memberUserId,
            String memberName,
            String memberPhone,
            Enums.ReservationStatus status,
            LocalDateTime reservedAt,
            LocalDateTime checkedAt
    ) {}

    public record AttendanceRequest(
            @NotNull Long reservationId,
            @NotNull Enums.ReservationStatus status
    ) {}

    public record BulkAttendanceRequest(
            @NotEmpty java.util.List<@Valid AttendanceRequest> items
    ) {}
}
