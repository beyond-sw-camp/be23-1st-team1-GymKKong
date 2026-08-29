package com.gymkkong.api.service;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.domain.*;
import com.gymkkong.api.dto.ReservationDtos.*;
import com.gymkkong.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

/**
 * 예약 도메인.
 *
 * v1에는 INSERT INTO class_reservation 이 한 줄도 없었다. 즉 예약 생성 자체가 구현되지
 * 않았고, 정원 검사/중복 예약 방지/이용권 차감도 존재하지 않았다.
 * 여기서 그 흐름을 하나의 트랜잭션으로 묶는다.
 *
 * 동시성:
 *   1) class_session 행을 비관적 락으로 잡아 정원 초과를 막는다.
 *   2) membership 행도 락을 잡아 잔여 횟수가 음수가 되지 않게 한다.
 *   3) 그래도 뚫리는 경우를 대비해 DB에 UNIQUE(session_id, member_user_id)를 두고
 *      제약 위반을 ALREADY_RESERVED로 변환한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final Collection<Enums.ReservationStatus> OCCUPYING_STATUSES =
            List.of(Enums.ReservationStatus.RESERVED,
                    Enums.ReservationStatus.ATTENDED,
                    Enums.ReservationStatus.NOSHOW);

    private final ReservationRepository reservationRepository;
    private final ClassSessionRepository sessionRepository;
    private final MembershipRepository membershipRepository;
    private final AppUserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public ReservationResponse reserve(Long memberId, CreateRequest req) {
        // 1) 회차를 잠근다. 이후 정원 계산은 이 트랜잭션이 독점한다.
        ClassSession session = sessionRepository.findByIdForUpdate(req.sessionId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "수업을 찾을 수 없습니다."));

        // 락을 잡은 뒤 연관 엔티티를 다시 읽어 program/place를 초기화한다.
        session = sessionRepository.findDetailById(req.sessionId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "수업을 찾을 수 없습니다."));

        session.assertReservable();

        // 2) 같은 회차에 이미 예약이 있는지 본다. 취소했던 건은 되살린다.
        var existing = reservationRepository.findBySessionIdAndMemberId(req.sessionId(), memberId);
        if (existing.isPresent() && existing.get().isActive()) {
            throw new ApiException(ErrorCode.ALREADY_RESERVED);
        }

        AppUser member = userRepository.findById(memberId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        // 3) 사용할 이용권을 고르고 차감한다. v1은 출석 시점에만 차감해서
        //    잔여 0회여도 예약이 무제한이었다.
        Membership membership = resolveMembership(memberId, session, req.membershipId());
        membership.use();

        // 4) 정원 반영
        session.increaseReserved();

        Reservation reservation;
        if (existing.isPresent()) {
            // 취소했던 예약 레코드를 재사용한다(UNIQUE 제약 때문에 새로 넣을 수 없다).
            reservation = existing.get();
            reservation.reactivate(membership);
        } else {
            reservation = Reservation.builder()
                    .session(session)
                    .member(member)
                    .membership(membership)
                    .build();
            try {
                reservation = reservationRepository.saveAndFlush(reservation);
            } catch (DataIntegrityViolationException e) {
                // UNIQUE(session_id, member_user_id) 위반 = 동시에 들어온 중복 예약
                throw new ApiException(ErrorCode.ALREADY_RESERVED);
            }
        }

        notificationService.notifyReservationConfirmed(member, session);
        return ReservationResponse.from(reservation);
    }

    /**
     * 이용권 선택 규칙.
     * - membershipId를 지정하면 그 이용권이 조건을 만족하는지 검증한다.
     * - 지정하지 않으면 만료가 임박한 것부터 자동으로 고른다.
     * 어느 쪽이든 지점과 수업 종류(GROUP/PERSONAL)가 맞아야 한다.
     */
    private Membership resolveMembership(Long memberId, ClassSession session, Long membershipId) {
        Long placeId = session.getProgram().getPlace().getId();
        Enums.ClassType classType = session.getProgram().getClassType();
        LocalDate sessionDate = session.getStartAt().toLocalDate();

        if (membershipId != null) {
            Membership m = membershipRepository.findByIdForUpdate(membershipId)
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "이용권을 찾을 수 없습니다."));

            if (!m.getMember().getId().equals(memberId)) {
                throw new ApiException(ErrorCode.FORBIDDEN, "본인의 이용권이 아닙니다.");
            }
            if (!m.getPlace().getId().equals(placeId)) {
                throw new ApiException(ErrorCode.NO_USABLE_MEMBERSHIP, "다른 지점의 이용권입니다.");
            }
            if (!m.getPlan().covers(classType)) {
                throw new ApiException(ErrorCode.NO_USABLE_MEMBERSHIP, "이 수업에 사용할 수 없는 이용권입니다.");
            }
            if (!m.isUsableOn(sessionDate)) {
                throw new ApiException(ErrorCode.NO_USABLE_MEMBERSHIP,
                        "수업 날짜에 사용할 수 없는 이용권입니다.");
            }
            return m;
        }

        return membershipRepository
                .findUsableForUpdate(memberId, placeId, sessionDate, Enums.MembershipStatus.ACTIVE)
                .stream()
                .filter(m -> m.getPlan().covers(classType))
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.NO_USABLE_MEMBERSHIP));
    }

    /** 회원 본인 취소. 마감 시간 내라면 이용권을 복원한다. */
    @Transactional
    public void cancel(Long memberId, Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다."));

        if (!reservation.getMember().getId().equals(memberId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        // 정원과 잔여 횟수를 되돌리므로 두 행 모두 잠근다.
        ClassSession session = sessionRepository.findByIdForUpdate(reservation.getSession().getId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        Membership membership = membershipRepository.findByIdForUpdate(reservation.getMembership().getId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        reservation.cancelByMember();
        session.decreaseReserved();
        membership.restore();
    }

    /**
     * 트레이너/관리자의 수업 취소에 따른 일괄 처리.
     * 회원 귀책이 아니므로 마감 시간과 무관하게 전원 이용권을 복원한다.
     */
    @Transactional
    public int cancelAllForSession(ClassSession session, String reason) {
        List<Reservation> targets = reservationRepository
                .findBySessionIdAndStatus(session.getId(), Enums.ReservationStatus.RESERVED);

        for (Reservation r : targets) {
            Membership m = membershipRepository.findByIdForUpdate(r.getMembership().getId())
                    .orElse(null);
            r.cancelBySession();
            if (m != null) {
                m.restore();
            }
            notificationService.notifyClassCanceled(r.getMember(), session, reason);
        }

        session.cancel(reason);
        return targets.size();
    }

    @Transactional(readOnly = true)
    public PageResponse<ReservationResponse> myReservations(Long memberId,
                                                            Collection<Enums.ReservationStatus> statuses,
                                                            Pageable pageable) {
        Collection<Enums.ReservationStatus> filter =
                (statuses == null || statuses.isEmpty()) ? null : statuses;
        return PageResponse.of(
                reservationRepository.findMyReservations(memberId, filter, pageable),
                ReservationResponse::from);
    }

    @Transactional(readOnly = true)
    public long occupyingCount(Long sessionId) {
        return reservationRepository.countBySessionIdAndStatusIn(sessionId, OCCUPYING_STATUSES);
    }
}
