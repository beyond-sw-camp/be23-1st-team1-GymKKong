package com.gymkkong.api.service;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.config.AuthUser;
import com.gymkkong.api.domain.*;
import com.gymkkong.api.dto.AuthDtos.UserResponse;
import com.gymkkong.api.dto.PlaceDtos.*;
import com.gymkkong.api.repository.*;
import com.gymkkong.api.repository.Repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 지점 운영. ADMIN은 자신이 담당하는 지점만, SUPER_ADMIN은 모든 지점을 다룬다.
 * v1의 admin 테이블에는 place_id가 없어 이 구분 자체가 불가능했다.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final PlaceRepository placeRepository;
    private final PlaceAdminRepository placeAdminRepository;
    private final PlaceTrainerRepository placeTrainerRepository;
    private final RoomRepository roomRepository;
    private final MembershipPlanRepository planRepository;
    private final AppUserRepository userRepository;

    // ------------------------------------------------------------ 권한

    /** 해당 지점을 운영할 권한이 있는지. SUPER_ADMIN은 전 지점 통과. */
    public void assertManages(AuthUser admin, Long placeId) {
        if (admin.role() == Enums.Role.SUPER_ADMIN) return;
        if (!placeAdminRepository.existsByPlaceIdAndAdminId(placeId, admin.id())) {
            throw new ApiException(ErrorCode.FORBIDDEN, "담당 지점이 아닙니다.");
        }
    }

    // ------------------------------------------------------------ 지점

    @Transactional
    public PlaceDetail createPlace(AuthUser admin, PlaceCreateRequest req) {
        if (admin.role() != Enums.Role.SUPER_ADMIN) {
            throw new ApiException(ErrorCode.FORBIDDEN, "지점 생성은 최고 관리자만 가능합니다.");
        }
        Place place = placeRepository.save(Place.builder()
                .name(req.name())
                .address(req.address())
                .addressDetail(req.addressDetail())
                .phoneNum(req.phoneNum())
                .description(req.description())
                .latitude(req.latitude())
                .longitude(req.longitude())
                .openTime(req.openTime())
                .closeTime(req.closeTime())
                .imageUrl(req.imageUrl())
                .build());
        return PlaceDetail.from(place, false);
    }

    @Transactional
    public PlaceDetail updatePlace(AuthUser admin, Long placeId, PlaceCreateRequest req) {
        assertManages(admin, placeId);
        Place place = placeRepository.findByIdAndDeletedAtIsNull(placeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        place.update(req.name(), req.address(), req.addressDetail(), req.phoneNum(),
                req.description(), req.latitude(), req.longitude(),
                req.openTime(), req.closeTime(), req.imageUrl());
        return PlaceDetail.from(place, false);
    }

    /**
     * 지점 폐점. v1은 물리 DELETE라 FK 참조가 남아 있으면 실패했다.
     * 결제/예약 이력을 보존해야 하므로 소프트 삭제로 처리한다.
     */
    @Transactional
    public void closePlace(AuthUser admin, Long placeId) {
        assertManages(admin, placeId);
        placeRepository.findByIdAndDeletedAtIsNull(placeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND))
                .softDelete();
    }

    // ------------------------------------------------------------ 강습실 / 상품

    @Transactional
    public RoomResponse createRoom(AuthUser admin, Long placeId, RoomCreateRequest req) {
        assertManages(admin, placeId);
        Place place = placeRepository.findByIdAndDeletedAtIsNull(placeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        return RoomResponse.from(roomRepository.save(Room.builder()
                .place(place)
                .roomNum(req.roomNum())
                .name(req.name())
                .capacity(req.capacity())
                .build()));
    }

    @Transactional
    public PlanResponse createPlan(AuthUser admin, Long placeId, PlanCreateRequest req) {
        assertManages(admin, placeId);
        Place place = placeRepository.findByIdAndDeletedAtIsNull(placeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        return PlanResponse.from(planRepository.save(MembershipPlan.builder()
                .place(place)
                .name(req.name())
                .totalCount(req.totalCount())
                .price(req.price())
                .validDays(req.validDays())
                .classType(req.classType())
                .build()));
    }

    @Transactional
    public PlanResponse updatePlan(AuthUser admin, Long planId, PlanCreateRequest req) {
        MembershipPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        assertManages(admin, plan.getPlace().getId());
        plan.update(req.name(), req.totalCount(), req.price(), req.validDays(), req.classType(), null);
        return PlanResponse.from(plan);
    }

    // ------------------------------------------------------------ 트레이너 승인

    @Transactional(readOnly = true)
    public List<TrainerSummary> pendingTrainers(AuthUser admin, Long placeId) {
        assertManages(admin, placeId);
        return placeTrainerRepository
                .findByPlaceAndStatus(placeId, Enums.PlaceTrainerStatus.PENDING)
                .stream()
                .map(pt -> new TrainerSummary(pt.getTrainer().getId(), pt.getTrainer().getName(),
                        null, null, null, pt.getStatus()))
                .toList();
    }

    @Transactional
    public void decideTrainer(AuthUser admin, Long placeTrainerId, boolean approve) {
        PlaceTrainer pt = placeTrainerRepository.findById(placeTrainerId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "소속 신청을 찾을 수 없습니다."));
        assertManages(admin, pt.getPlace().getId());

        AppUser adminUser = userRepository.findById(admin.id())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (approve) {
            pt.approve(adminUser);
        } else {
            pt.reject(adminUser);
        }
    }

    /** 소속 해제. 이력은 남기고 상태만 INACTIVE로 바꾼다. */
    @Transactional
    public void removeTrainer(AuthUser admin, Long placeId, Long trainerId) {
        assertManages(admin, placeId);
        PlaceTrainer pt = placeTrainerRepository.findByPlaceIdAndTrainerId(placeId, trainerId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "소속 정보를 찾을 수 없습니다."));
        pt.deactivate();
    }

    // ------------------------------------------------------------ 회원 조회

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> members(String keyword, Pageable pageable) {
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        return PageResponse.of(
                userRepository.search(Enums.Role.MEMBER, kw, pageable),
                UserResponse::from);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> trainers(String keyword, Pageable pageable) {
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        return PageResponse.of(
                userRepository.search(Enums.Role.TRAINER, kw, pageable),
                UserResponse::from);
    }
}
