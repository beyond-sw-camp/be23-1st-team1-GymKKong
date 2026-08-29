package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    List<Room> findByPlaceIdAndStatus(Long placeId, Enums.PlaceStatus status);
}
