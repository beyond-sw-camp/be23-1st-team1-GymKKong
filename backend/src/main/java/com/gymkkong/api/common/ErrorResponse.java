package com.gymkkong.api.common;

import java.time.LocalDateTime;
import java.util.List;

/** 앱은 code로 분기하고 message를 그대로 노출한다. */
public record ErrorResponse(
        String code,
        String message,
        List<FieldError> errors,
        LocalDateTime timestamp
) {
    public record FieldError(String field, String reason) {}

    public static ErrorResponse of(ErrorCode code, String message) {
        return new ErrorResponse(code.name(), message, List.of(), LocalDateTime.now());
    }

    public static ErrorResponse of(ErrorCode code, String message, List<FieldError> errors) {
        return new ErrorResponse(code.name(), message, errors, LocalDateTime.now());
    }
}
