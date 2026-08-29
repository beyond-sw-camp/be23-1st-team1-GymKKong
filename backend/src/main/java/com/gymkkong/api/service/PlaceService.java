package com.gymkkong.api.service;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.domain.*;
import com.gymkkong.api.dto.PlaceDtos.*;
import com.gymkkong.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlaceService {

    /** 위도 1도는 약 111km. 반경(km)을 위경도 박스로 환산할 때 쓴다. */
    private static final double KM_PER_LAT_DEGREE = 111.0;

    private final PlaceRepository placeRepository;
    private final PlaceTrainerRepository placeTrainerRepository;
    private final RoomRepository roomRepository;
    private final MembershipPlanRepository planRepository;
    private final FavoritePlaceRepository favoriteRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final AppUserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<PlaceSummary> search(String keyword, Long viewerId, Pageable pageable) {
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        Set<Long> favorites = favoriteIds(viewerId);
        return PageResponse.of(
                placeRepository.search(kw, Enums.PlaceStatus.ACTIVE, pageable),
                p -> PlaceSummary.from(p, favorites.contains(p.getId())));
    }

    /**
     * 좌표 기준 가까운 지점.
     * 위경도 박스로 후보를 좁힌 뒤 거리순으로 정렬한다.
     * v1 스키마에는 좌표가 없어 이 화면 자체가 불가능했다.
     */
    @Transactional(readOnly = true)
    public List<PlaceSummary> nearby(double lat, double lng, double radiusKm, int limit, Long viewerId) {
        double latDelta = radiusKm / KM_PER_LAT_DEGREE;
        double lngDelta = radiusKm / (KM_PER_LAT_DEGREE * Math.cos(Math.toRadians(lat)));

        Set<Long> favorites = favoriteIds(viewerId);
        return placeRepository.findNearby(lat, lng,
                        lat - latDelta, lat + latDelta,
                        lng - lngDelta, lng + lngDelta,
                        Math.min(Math.max(limit, 1), 50))
                .stream()
                .map(p -> PlaceSummary.from(p, favorites.contains(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public PlaceDetail detail(Long placeId, Long viewerId) {
        Place place = placeRepository.findByIdAndDeletedAtIsNull(placeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "지점을 찾을 수 없습니다."));
        boolean fav = viewerId != null
                && favoriteRepository.findByUserIdAndPlaceId(viewerId, placeId).isPresent();
        return PlaceDetail.from(place, fav);
    }

    @Transactional(readOnly = true)
    public List<TrainerSummary> trainers(Long placeId) {
        return placeTrainerRepository
                .findByPlaceAndStatus(placeId, Enums.PlaceTrainerStatus.ACTIVE)
                .stream()
                .map(pt -> {
                    AppUser t = pt.getTrainer();
                    var profile = trainerProfileRepository.findById(t.getId()).orElse(null);
                    return new TrainerSummary(
                            t.getId(), t.getName(),
                            profile != null ? profile.getSpecialty() : null,
                            profile != null ? profile.getCareerYears() : null,
                            profile != null ? profile.getProfileImageUrl() : null,
                            pt.getStatus());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> rooms(Long placeId) {
        return roomRepository.findByPlaceIdAndStatus(placeId, Enums.PlaceStatus.ACTIVE)
                .stream().map(RoomResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> plans(Long placeId) {
        return planRepository.findByPlaceIdAndStatus(placeId, Enums.PlaceStatus.ACTIVE)
                .stream().map(PlanResponse::from).toList();
    }

    // ------------------------------------------------------------ 즐겨찾기

    /** 이미 등록돼 있으면 해제한다(토글). 반환값은 등록 여부. */
    @Transactional
    public boolean toggleFavorite(Long userId, Long placeId) {
        var existing = favoriteRepository.findByUserIdAndPlaceId(userId, placeId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            return false;
        }
        Place place = placeRepository.findByIdAndDeletedAtIsNull(placeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        favoriteRepository.save(FavoritePlace.builder().user(user).place(place).build());
        return true;
    }

    @Transactional(readOnly = true)
    public List<PlaceSummary> myFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(f -> PlaceSummary.from(f.getPlace(), true))
                .toList();
    }

    private Set<Long> favoriteIds(Long viewerId) {
        if (viewerId == null) return Set.of();
        return favoriteRepository.findByUserId(viewerId).stream()
                .map(f -> f.getPlace().getId())
                .collect(Collectors.toSet());
    }

    // ------------------------------------------------------------ 트레이너 소속

    /** 트레이너가 지점 소속을 신청한다. 관리자 승인 전까지 PENDING. */
    @Transactional
    public void requestJoin(Long trainerId, Long placeId) {
        placeTrainerRepository.findByPlaceIdAndTrainerId(placeId, trainerId).ifPresent(pt -> {
            if (pt.getStatus() == Enums.PlaceTrainerStatus.ACTIVE
                    || pt.getStatus() == Enums.PlaceTrainerStatus.PENDING) {
                throw new ApiException(ErrorCode.INVALID_INPUT, "이미 신청했거나 소속된 지점입니다.");
            }
        });

        Place place = placeRepository.findByIdAndDeletedAtIsNull(placeId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "지점을 찾을 수 없습니다."));
        AppUser trainer = userRepository.findById(trainerId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        placeTrainerRepository.save(PlaceTrainer.builder()
                .place(place)
                .trainer(trainer)
                .status(Enums.PlaceTrainerStatus.PENDING)
                .build());
    }

    @Transactional(readOnly = true)
    public List<MyPlaceResponse> myPlaces(Long trainerId) {
        return placeTrainerRepository.findByTrainer(trainerId).stream()
                .map(pt -> new MyPlaceResponse(pt.getPlace().getId(), pt.getPlace().getName(),
                        pt.getPlace().getAddress(), pt.getStatus()))
                .toList();
    }
}
