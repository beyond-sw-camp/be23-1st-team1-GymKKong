package com.gymkkong.api.dto;

import com.gymkkong.api.domain.ClassSession;
import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Reservation;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public final class ReservationDtos {

    private ReservationDtos() {}

    /**
     * membershipId는 선택. 지정하지 않으면 만료가 가장 임박한 사용 가능 이용권을
     * 서버가 자동으로 고른다.
     */
    public record CreateRequest(
            @NotNull Long sessionId,
            Long membershipId
    ) {}

    public record ReservationResponse(
            Long id,
            Enums.ReservationStatus status,
            LocalDateTime reservedAt,
            LocalDateTime canceledAt,
            LocalDateTime checkedAt,
            Long sessionId,
            String programName,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String placeName,
            String roomNum,
            String trainerName,
            Long membershipId,
            Integer membershipRemainCount,
            boolean cancelable
    ) {
        public static ReservationResponse from(Reservation r) {
            ClassSession s = r.getSession();
            boolean cancelable = r.getStatus() == Enums.ReservationStatus.RESERVED
                    && LocalDateTime.now().isBefore(
                            s.getStartAt().minusHours(Reservation.CANCEL_DEADLINE_HOURS));
            return new ReservationResponse(
                    r.getId(), r.getStatus(), r.getReservedAt(), r.getCanceledAt(), r.getCheckedAt(),
                    s.getId(), s.getProgram().getName(), s.getStartAt(), s.getEndAt(),
                    s.getProgram().getPlace().getName(), s.getRoom().getRoomNum(),
                    s.getProgram().getTrainer().getName(),
                    r.getMembership().getId(), r.getMembership().getRemainCount(),
                    cancelable);
        }
    }
}
