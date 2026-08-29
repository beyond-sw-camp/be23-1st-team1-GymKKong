package com.gymkkong.api.repository;

import com.gymkkong.api.domain.AppUser;
import com.gymkkong.api.domain.Enums;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailAndDeletedAtIsNull(String email);

    boolean existsByEmail(String email);

    List<AppUser> findByPhoneNumAndDeletedAtIsNull(String phoneNum);

    Page<AppUser> findByRoleAndDeletedAtIsNull(Enums.Role role, Pageable pageable);

    @Query("""
            SELECT u FROM AppUser u
            WHERE u.role = :role
              AND u.deletedAt IS NULL
              AND (:keyword IS NULL OR u.name LIKE %:keyword% OR u.email LIKE %:keyword%)
            """)
    Page<AppUser> search(@Param("role") Enums.Role role,
                         @Param("keyword") String keyword,
                         Pageable pageable);
}
