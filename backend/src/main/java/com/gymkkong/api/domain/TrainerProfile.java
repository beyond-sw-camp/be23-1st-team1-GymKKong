package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trainer_profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class TrainerProfile extends BaseTimeEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private AppUser user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 255)
    private String specialty;

    @Column(name = "career_years", nullable = false)
    @Builder.Default
    private Integer careerYears = 0;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    public void update(String bio, String specialty, Integer careerYears, String profileImageUrl) {
        if (bio != null) this.bio = bio;
        if (specialty != null) this.specialty = specialty;
        if (careerYears != null) this.careerYears = careerYears;
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
    }
}
