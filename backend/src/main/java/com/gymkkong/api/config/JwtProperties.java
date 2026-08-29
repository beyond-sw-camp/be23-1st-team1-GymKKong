package com.gymkkong.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT 설정. secret은 반드시 환경변수(JWT_SECRET)로 주입하고 저장소에 커밋하지 않는다.
 * HS256 기준 최소 256비트(32바이트) 이상이어야 한다.
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        long accessTokenMinutes,
        long refreshTokenDays
) {
    public JwtProperties {
        if (accessTokenMinutes <= 0) accessTokenMinutes = 30;
        if (refreshTokenDays <= 0) refreshTokenDays = 14;
    }
}
