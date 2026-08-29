package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    /** 같은 대상/목적으로 여러 건이 쌓일 수 있으므로 가장 최근 것만 본다. */
    @Query("""
            SELECT v FROM VerificationCode v
            WHERE v.channel = :channel
              AND v.target = :target
              AND v.purpose = :purpose
            ORDER BY v.id DESC
            LIMIT 1
            """)
    Optional<VerificationCode> findLatest(@Param("channel") Enums.VerificationChannel channel,
                                          @Param("target") String target,
                                          @Param("purpose") Enums.VerificationPurpose purpose);
}
