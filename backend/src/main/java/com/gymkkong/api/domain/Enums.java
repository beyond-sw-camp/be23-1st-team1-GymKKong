package com.gymkkong.api.domain;

/** 스키마 v2의 ENUM 컬럼과 1:1 대응. 파일 분산을 줄이려 한 곳에 모았다. */
public final class Enums {

    private Enums() {}

    public enum Role { MEMBER, TRAINER, ADMIN, SUPER_ADMIN }

    public enum UserStatus { ACTIVE, INACTIVE, SUSPENDED }

    public enum Gender { M, F, OTHER }

    public enum MemberGrade { BRONZE, GOLD, DIAMOND }

    public enum PlaceStatus { ACTIVE, INACTIVE }

    /** v1은 승인 대기를 ENUM에 없는 'N'으로 넣어 INSERT가 실패했다. */
    public enum PlaceTrainerStatus { PENDING, ACTIVE, REJECTED, INACTIVE }

    public enum ClassType { GROUP, PERSONAL }

    public enum ClassLevel { BEGINNER, INTERMEDIATE, ADVANCED, ALL }

    public enum SessionStatus { SCHEDULED, IN_PROGRESS, COMPLETED, CANCELED }

    /** 이용권 상품이 커버하는 수업 종류. ALL은 GROUP/PERSONAL 모두 허용. */
    public enum PlanScope { GROUP, PERSONAL, ALL }

    public enum MembershipStatus { ACTIVE, EXPIRED, REFUNDED, SUSPENDED }

    public enum PaymentMethod { CARD, TRANSFER, KAKAOPAY, TOSS, ONSITE }

    public enum PaymentStatus { PENDING, PAID, FAILED, CANCELED }

    public enum RefundStatus { REQUESTED, APPROVED, REJECTED, COMPLETED }

    /** v1은 예약(class_reservation)과 출석(attendance)이 분리돼 정합성이 깨졌다. */
    public enum ReservationStatus { RESERVED, CANCELED, ATTENDED, NOSHOW }

    public enum PostType { NOTICE, FREE, QNA }

    public enum VerificationChannel { EMAIL, PHONE }

    public enum VerificationPurpose { SIGNUP, FIND_ACCOUNT, RESET_PASSWORD, CHANGE_PHONE }

    public enum DevicePlatform { IOS, ANDROID }

    public enum NotificationType {
        RESERVATION, CLASS_CANCELED, MEMBERSHIP_EXPIRING, PAYMENT, COMMENT, NOTICE
    }

    public enum AttachmentOwner { POST, COMMENT, PLACE, PROGRAM, USER }
}
