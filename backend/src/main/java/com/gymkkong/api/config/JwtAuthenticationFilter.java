package com.gymkkong.api.config;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.common.ErrorResponse;
import com.gymkkong.api.domain.Enums;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final JwtTokenProvider tokenProvider;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String token = resolveToken(request);
        if (token == null) {
            chain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = tokenProvider.parse(token);
            Enums.Role role = Enums.Role.valueOf(claims.get("role", String.class));
            AuthUser principal = new AuthUser(
                    Long.valueOf(claims.getSubject()),
                    claims.get("email", String.class),
                    role,
                    claims.get("name", String.class)
            );

            var auth = new UsernamePasswordAuthenticationToken(
                    principal, null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (ApiException e) {
            // 만료/위조는 401로 즉시 끊는다. 앱은 code로 재발급 여부를 판단한다.
            SecurityContextHolder.clearContext();
            writeError(response, e.getErrorCode());
            return;
        }

        chain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER)) {
            String value = header.substring(BEARER.length()).trim();
            return value.isEmpty() ? null : value;
        }
        return null;
    }

    private void writeError(HttpServletResponse response, ErrorCode code) throws IOException {
        response.setStatus(code.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(response.getWriter(), ErrorResponse.of(code, code.getMessage()));
    }
}
