package com.gymkkong.api.config;

import com.gymkkong.api.domain.Enums;

/**
 * 인증된 호출자. 컨트롤러에서 @AuthenticationPrincipal AuthUser 로 받는다.
 * 매 요청마다 DB를 조회하지 않도록 토큰 클레임만 담는다.
 */
public record AuthUser(Long id, String email, Enums.Role role, String name) {

    public boolean isMember() {
        return role == Enums.Role.MEMBER;
    }

    public boolean isTrainer() {
        return role == Enums.Role.TRAINER;
    }

    public boolean isAdmin() {
        return role == Enums.Role.ADMIN || role == Enums.Role.SUPER_ADMIN;
    }
}
