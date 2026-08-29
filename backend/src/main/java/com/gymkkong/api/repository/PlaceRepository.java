package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Place;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    Optional<Place> findByIdAndDeletedAtIsNull(Long id);

    /** 중첩 enum을 JPQL 리터럴로 쓰면 파싱이 까다로워 상태를 파라미터로 넘긴다. */
    @Query("""
            SELECT p FROM Place p
            WHERE p.deletedAt IS NULL
              AND p.status = :status
              AND (:keyword IS NULL OR p.name LIKE %:keyword% OR p.address LIKE %:keyword%)
            """)
    Page<Place> search(@Param("keyword") String keyword,
                       @Param("status") Enums.PlaceStatus status,
                       Pageable pageable);

    /**
     * 좌표 기준 근처 지점. 하버사인을 그대로 쓰면 인덱스를 못 타므로
     * 위경도 박스로 1차 필터링한 뒤 거리순으로 정렬한다.
     */
    @Query(value = """
            SELECT * FROM place p
            WHERE p.deleted_at IS NULL
              AND p.status = 'ACTIVE'
              AND p.latitude BETWEEN :minLat AND :maxLat
              AND p.longitude BETWEEN :minLng AND :maxLng
            ORDER BY (POW(p.latitude - :lat, 2) + POW(p.longitude - :lng, 2)) ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Place> findNearby(@Param("lat") double lat,
                           @Param("lng") double lng,
                           @Param("minLat") double minLat,
                           @Param("maxLat") double maxLat,
                           @Param("minLng") double minLng,
                           @Param("maxLng") double maxLng,
                           @Param("limit") int limit);
}
