package com.gymkkong.api.repository;

import com.gymkkong.api.domain.Enums;
import com.gymkkong.api.domain.Refund;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    /** 같은 결제에 대한 중복 환불 요청을 막는다. */
    boolean existsByPaymentIdAndStatusIn(Long paymentId, Collection<Enums.RefundStatus> statuses);

    Page<Refund> findByStatus(Enums.RefundStatus status, Pageable pageable);
}
