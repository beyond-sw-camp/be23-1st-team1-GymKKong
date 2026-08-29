package com.gymkkong.api.repository;

/**
 * 별도 조건 없이 기본 CRUD만 필요한 리포지토리 모음.
 * 파일이 과도하게 늘어나는 것을 막기 위해 중첩 인터페이스로 선언한다.
 * Spring Data는 중첩 인터페이스도 정상적으로 스캔한다.
 */
public final class Repositories {

    private Repositories() {}

    public interface MemberProfileRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.MemberProfile, Long> {}

    public interface TrainerProfileRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.TrainerProfile, Long> {}

    public interface RoomRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.Room, Long> {

        java.util.List<com.gymkkong.api.domain.Room> findByPlaceIdAndStatus(
                Long placeId, com.gymkkong.api.domain.Enums.PlaceStatus status);
    }

    public interface PlaceAdminRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.PlaceAdmin, Long> {

        boolean existsByPlaceIdAndAdminId(Long placeId, Long adminId);

        java.util.List<com.gymkkong.api.domain.PlaceAdmin> findByAdminId(Long adminId);
    }

    public interface MembershipPlanRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.MembershipPlan, Long> {

        java.util.List<com.gymkkong.api.domain.MembershipPlan> findByPlaceIdAndStatus(
                Long placeId, com.gymkkong.api.domain.Enums.PlaceStatus status);
    }

    public interface PaymentRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.Payment, Long> {

        java.util.Optional<com.gymkkong.api.domain.Payment> findByMembershipId(Long membershipId);

        java.util.List<com.gymkkong.api.domain.Payment> findByMemberIdOrderByPaidAtDesc(Long memberId);
    }

    public interface RefundRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.Refund, Long> {

        boolean existsByPaymentIdAndStatusIn(
                Long paymentId, java.util.Collection<com.gymkkong.api.domain.Enums.RefundStatus> statuses);

        org.springframework.data.domain.Page<com.gymkkong.api.domain.Refund> findByStatus(
                com.gymkkong.api.domain.Enums.RefundStatus status,
                org.springframework.data.domain.Pageable pageable);
    }

    public interface RefreshTokenRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.RefreshToken, Long> {

        java.util.Optional<com.gymkkong.api.domain.RefreshToken> findByTokenHash(String tokenHash);

        java.util.List<com.gymkkong.api.domain.RefreshToken> findByUserIdAndRevokedAtIsNull(Long userId);
    }

    public interface DeviceTokenRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.DeviceToken, Long> {

        java.util.Optional<com.gymkkong.api.domain.DeviceToken> findByToken(String token);

        java.util.List<com.gymkkong.api.domain.DeviceToken> findByUserIdAndIsActiveTrue(Long userId);
    }

    public interface NotificationRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.Notification, Long> {

        org.springframework.data.domain.Page<com.gymkkong.api.domain.Notification>
        findByUserIdOrderByCreatedAtDesc(Long userId, org.springframework.data.domain.Pageable pageable);

        long countByUserIdAndReadAtIsNull(Long userId);
    }

    public interface FavoritePlaceRepository
            extends org.springframework.data.jpa.repository.JpaRepository<com.gymkkong.api.domain.FavoritePlace, Long> {

        java.util.Optional<com.gymkkong.api.domain.FavoritePlace> findByUserIdAndPlaceId(Long userId, Long placeId);

        java.util.List<com.gymkkong.api.domain.FavoritePlace> findByUserId(Long userId);
    }
}
