package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {

    List<MembershipPlan> findByPlaceIdAndStatus(Long placeId, Enums.PlaceStatus status);
}
