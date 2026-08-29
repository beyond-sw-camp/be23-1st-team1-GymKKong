package com.gymkkong.api.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/** 앱이 코드로 분기할 수 있도록 도메인 예외마다 고유 코드를 부여한다. */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "대상을 찾을 수 없습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN, "탈퇴했거나 정지된 계정입니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    VERIFICATION_FAILED(HttpStatus.BAD_REQUEST, "인증번호가 올바르지 않거나 만료되었습니다."),

    // 예약
    SESSION_NOT_RESERVABLE(HttpStatus.BAD_REQUEST, "예약할 수 없는 수업입니다."),
    SESSION_FULL(HttpStatus.CONFLICT, "정원이 모두 찼습니다."),
    ALREADY_RESERVED(HttpStatus.CONFLICT, "이미 예약한 수업입니다."),
    RESERVATION_TIME_PASSED(HttpStatus.BAD_REQUEST, "이미 시작한 수업은 예약하거나 취소할 수 없습니다."),
    CANCEL_DEADLINE_PASSED(HttpStatus.BAD_REQUEST, "취소 가능 시간이 지났습니다."),
    RESERVATION_NOT_CANCELABLE(HttpStatus.BAD_REQUEST, "취소할 수 있는 예약이 아닙니다."),

    // 이용권 / 결제
    NO_USABLE_MEMBERSHIP(HttpStatus.BAD_REQUEST, "사용 가능한 이용권이 없습니다."),
    MEMBERSHIP_EXPIRED(HttpStatus.BAD_REQUEST, "이용권이 만료되었습니다."),
    MEMBERSHIP_EXHAUSTED(HttpStatus.BAD_REQUEST, "이용권 잔여 횟수가 없습니다."),
    MEMBERSHIP_NOT_REFUNDABLE(HttpStatus.BAD_REQUEST, "환불 가능한 이용권이 아닙니다."),
    REFUND_ALREADY_REQUESTED(HttpStatus.CONFLICT, "이미 환불 요청이 접수되었습니다."),

    // 강습
    ROOM_TIME_CONFLICT(HttpStatus.CONFLICT, "해당 강습실에 시간이 겹치는 수업이 있습니다."),
    TRAINER_NOT_IN_PLACE(HttpStatus.FORBIDDEN, "해당 지점에 승인된 트레이너가 아닙니다."),
    SESSION_ALREADY_STARTED(HttpStatus.BAD_REQUEST, "이미 시작한 수업입니다.");

    private final HttpStatus status;
    private final String message;
}
