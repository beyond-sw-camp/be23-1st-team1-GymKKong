package com.gymkkong.api.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "room")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Room extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "place_id")
    private Place place;

    @Column(name = "room_num", nullable = false, length = 20)
    private String roomNum;

    @Column(length = 100)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private Integer capacity = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Enums.PlaceStatus status = Enums.PlaceStatus.ACTIVE;
}
