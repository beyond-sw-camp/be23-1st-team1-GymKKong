package com.gymkkong.api.repository;

import com.gymkkong.api.domain.PlaceAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** 지점 담당 관리자. v1의 admin 테이블에는 place_id가 없어 이 개념이 없었다. */
public interface PlaceAdminRepository extends JpaRepository<PlaceAdmin, Long> {

    boolean existsByPlaceIdAndAdminId(Long placeId, Long adminId);

    List<PlaceAdmin> findByAdminId(Long adminId);
}
