package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /** 이용권 1건당 결제 1건을 전제로 한다. 분할 결제가 생기면 List로 바꿔야 한다. */
    Optional<Payment> findByMembershipId(Long membershipId);

    List<Payment> findByMemberIdOrderByPaidAtDesc(Long memberId);
}
