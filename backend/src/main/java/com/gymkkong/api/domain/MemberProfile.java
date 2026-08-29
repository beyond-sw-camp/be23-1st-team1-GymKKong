package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "member_profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class MemberProfile extends BaseTimeEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    private Enums.Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.MemberGrade grade = Enums.MemberGrade.BRONZE;

    @Column(name = "height_cm", precision = 5, scale = 2)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    public void update(LocalDate birthDate, Enums.Gender gender,
                       BigDecimal heightCm, BigDecimal weightKg, String profileImageUrl) {
        if (birthDate != null) this.birthDate = birthDate;
        if (gender != null) this.gender = gender;
        if (heightCm != null) this.heightCm = heightCm;
        if (weightKg != null) this.weightKg = weightKg;
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
    }
}
