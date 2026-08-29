package com.gymkkong.api.dto;

import com.gymkkong.api.domain.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalTime;

public final class PlaceDtos {

    private PlaceDtos() {}

    public record PlaceSummary(
            Long id,
            String name,
            String address,
            String phoneNum,
            BigDecimal latitude,
            BigDecimal longitude,
            LocalTime openTime,
            LocalTime closeTime,
            String imageUrl,
            boolean favorite
    ) {
        public static PlaceSummary from(Place p, boolean favorite) {
            return new PlaceSummary(p.getId(), p.getName(), p.getAddress(), p.getPhoneNum(),
                    p.getLatitude(), p.getLongitude(), p.getOpenTime(), p.getCloseTime(),
                    p.getImageUrl(), favorite);
        }
    }

    public record PlaceDetail(
            Long id,
            String name,
            String address,
            String addressDetail,
            String phoneNum,
            String description,
            BigDecimal latitude,
            BigDecimal longitude,
            LocalTime openTime,
            LocalTime closeTime,
            String imageUrl,
            boolean favorite
    ) {
        public static PlaceDetail from(Place p, boolean favorite) {
            return new PlaceDetail(p.getId(), p.getName(), p.getAddress(), p.getAddressDetail(),
                    p.getPhoneNum(), p.getDescription(), p.getLatitude(), p.getLongitude(),
                    p.getOpenTime(), p.getCloseTime(), p.getImageUrl(), favorite);
        }
    }

    public record TrainerSummary(
            Long userId,
            String name,
            String specialty,
            Integer careerYears,
            String profileImageUrl,
            Enums.PlaceTrainerStatus status
    ) {}

    public record RoomResponse(Long id, String roomNum, String name, Integer capacity) {
        public static RoomResponse from(Room r) {
            return new RoomResponse(r.getId(), r.getRoomNum(), r.getName(), r.getCapacity());
        }
    }

    public record PlanResponse(
            Long id,
            Long placeId,
            String name,
            Integer totalCount,
            Integer price,
            Integer validDays,
            Enums.PlanScope classType
    ) {
        public static PlanResponse from(MembershipPlan p) {
            return new PlanResponse(p.getId(), p.getPlace().getId(), p.getName(),
                    p.getTotalCount(), p.getPrice(), p.getValidDays(), p.getClassType());
        }
    }

    public record PlaceCreateRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Size(max = 255) String address,
            String addressDetail,
            String phoneNum,
            String description,
            @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
            LocalTime openTime,
            LocalTime closeTime,
            String imageUrl
    ) {}

    public record PlanCreateRequest(
            @NotBlank @Size(max = 150) String name,
            @NotNull @Min(1) Integer totalCount,
            @NotNull @Min(0) Integer price,
            @NotNull @Min(1) Integer validDays,
            @NotNull Enums.PlanScope classType
    ) {}

    public record RoomCreateRequest(
            @NotBlank @Size(max = 20) String roomNum,
            @Size(max = 100) String name,
            @NotNull @Min(1) Integer capacity
    ) {}

    /** 트레이너가 지점 소속을 신청할 때 사용. */
    public record TrainerJoinRequest(@NotNull Long placeId) {}

    /**
     * 관리자 승인 대기 목록의 한 줄.
     * 승인/거절 API는 place_trainer의 PK를 받으므로 userId와 함께 내려준다.
     */
    public record PendingTrainer(
            Long placeTrainerId,
            Long userId,
            String name,
            String email,
            String phoneNum,
            String specialty,
            Integer careerYears,
            java.time.LocalDateTime requestedAt
    ) {}

    /** 트레이너 화면: 내가 신청/소속된 지점과 승인 상태. */
    public record MyPlaceResponse(
            Long placeId,
            String placeName,
            String address,
            Enums.PlaceTrainerStatus status
    ) {}
}
