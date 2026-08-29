package com.gymkkong.api.service;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.domain.*;
import com.gymkkong.api.dto.ClassDtos.*;
import com.gymkkong.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** 강습 프로그램/회차 개설, 시간표 조회, 출석 처리. */
@Service
@RequiredArgsConstructor
public class ClassService {

    private final ClassProgramRepository programRepository;
    private final ClassSessionRepository sessionRepository;
    private final ReservationRepository reservationRepository;
    private final PlaceTrainerRepository placeTrainerRepository;
    private final PlaceRepository placeRepository;
    private final RoomRepository roomRepository;
    private final AppUserRepository userRepository;
    private final ReservationService reservationService;

    // ------------------------------------------------------------ 조회

    /**
     * 앱 시간표. viewerId가 있으면 각 회차에 내 예약 여부를 함께 채운다.
     * (회차마다 조회하면 N+1이 되므로 예약 ID 집합을 한 번에 만든다.)
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> timetable(Long placeId, LocalDate date, Integer days,
                                           Enums.ClassType classType, Long viewerId) {
        LocalDate from = date != null ? date : LocalDate.now();
        int span = (days == null || days < 1) ? 1 : Math.min(days, 31);

        List<ClassSession> sessions = sessionRepository.findByPlaceAndPeriod(
                placeId, from.atStartOfDay(), from.plusDays(span).atStartOfDay(), classType);

        Set<Long> mine = reservedSessionIds(viewerId, sessions);
        return sessions.stream()
                .map(s -> SessionResponse.from(s, mine.contains(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SessionResponse session(Long sessionId, Long viewerId) {
        ClassSession s = sessionRepository.findDetailById(sessionId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "수업을 찾을 수 없습니다."));
        boolean mine = viewerId != null && reservationRepository
                .existsBySessionIdAndMemberIdAndStatus(sessionId, viewerId, Enums.ReservationStatus.RESERVED);
        return SessionResponse.from(s, mine);
    }

    @Transactional(readOnly = true)
    public List<ProgramResponse> programsOfPlace(Long placeId) {
        return programRepository.findActiveByPlace(placeId, Enums.PlaceStatus.ACTIVE)
                .stream().map(ProgramResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ProgramResponse> myPrograms(Long trainerId) {
        return programRepository.findByTrainer(trainerId).stream().map(ProgramResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> mySessions(Long trainerId, LocalDate from, Integer days) {
        LocalDate start = from != null ? from : LocalDate.now();
        int span = (days == null || days < 1) ? 7 : Math.min(days, 62);
        return sessionRepository
                .findByTrainerAndPeriod(trainerId, start.atStartOfDay(), start.plusDays(span).atStartOfDay())
                .stream().map(s -> SessionResponse.from(s, false)).toList();
    }

    private Set<Long> reservedSessionIds(Long viewerId, List<ClassSession> sessions) {
        if (viewerId == null || sessions.isEmpty()) return Set.of();
        List<Long> ids = sessions.stream().map(ClassSession::getId).toList();
        return Set.copyOf(reservationRepository.findReservedSessionIds(
                viewerId, ids, Enums.ReservationStatus.RESERVED));
    }

    // ------------------------------------------------------------ 프로그램

    @Transactional
    public ProgramResponse createProgram(Long trainerId, ProgramCreateRequest req) {
        assertActiveTrainerOf(req.placeId(), trainerId);

        Place place = placeRepository.findByIdAndDeletedAtIsNull(req.placeId())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "지점을 찾을 수 없습니다."));
        AppUser trainer = userRepository.findById(trainerId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        ClassProgram program = programRepository.save(ClassProgram.builder()
                .place(place)
                .trainer(trainer)
                .name(req.name())
                .description(req.description())
                .classType(req.classType())
                .level(req.level() == null ? Enums.ClassLevel.ALL : req.level())
                .durationMin(req.durationMin())
                .defaultCapacity(req.defaultCapacity())
                .imageUrl(req.imageUrl())
                .build());

        return ProgramResponse.from(program);
    }

    @Transactional
    public ProgramResponse updateProgram(Long trainerId, Long programId, ProgramUpdateRequest req) {
        ClassProgram program = ownedProgram(programId, trainerId);
        program.update(req.name(), req.description(), req.level(),
                req.durationMin(), req.defaultCapacity(), req.imageUrl());
        return ProgramResponse.from(program);
    }

    @Transactional
    public void deleteProgram(Long trainerId, Long programId) {
        ownedProgram(programId, trainerId).softDelete();
    }

    // ------------------------------------------------------------ 회차

    @Transactional
    public SessionResponse createSession(Long trainerId, Long programId, SessionCreateRequest req) {
        ClassProgram program = ownedProgram(programId, trainerId);
        Room room = resolveRoom(program, req.roomId());

        LocalDateTime start = req.startAt();
        LocalDateTime end = start.plusMinutes(program.getDurationMin());
        assertNoConflict(room.getId(), start, end, null);

        int capacity = req.capacity() != null ? req.capacity() : program.getDefaultCapacity();

        ClassSession session = sessionRepository.save(ClassSession.builder()
                .program(program)
                .room(room)
                .startAt(start)
                .endAt(end)
                .capacity(capacity)
                .build());

        return SessionResponse.from(session, false);
    }

    /**
     * 매주 같은 시간에 반복 개설.
     * 충돌하는 주는 건너뛰고 성공한 회차만 반환한다(전체 실패보다 유용하다).
     */
    @Transactional
    public List<SessionResponse> createSessionsWeekly(Long trainerId, Long programId,
                                                      SessionBulkCreateRequest req) {
        ClassProgram program = ownedProgram(programId, trainerId);
        Room room = resolveRoom(program, req.roomId());
        int capacity = req.capacity() != null ? req.capacity() : program.getDefaultCapacity();

        List<SessionResponse> created = new ArrayList<>();
        for (int w = 0; w < req.weeks(); w++) {
            LocalDateTime start = req.firstStartAt().plusWeeks(w);
            LocalDateTime end = start.plusMinutes(program.getDurationMin());

            boolean conflict = sessionRepository.existsOverlapping(
                    room.getId(), start, end, Enums.SessionStatus.CANCELED, null);
            if (conflict) continue;

            ClassSession session = sessionRepository.save(ClassSession.builder()
                    .program(program).room(room)
                    .startAt(start).endAt(end).capacity(capacity)
                    .build());
            created.add(SessionResponse.from(session, false));
        }

        if (created.isEmpty()) {
            throw new ApiException(ErrorCode.ROOM_TIME_CONFLICT, "요청한 기간 전체가 기존 수업과 겹칩니다.");
        }
        return created;
    }

    /** 수업 취소. 예약자 전원의 이용권을 복원하고 알림을 보낸다. */
    @Transactional
    public int cancelSession(Long trainerId, Long sessionId, String reason) {
        ClassSession session = sessionRepository.findDetailById(sessionId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "수업을 찾을 수 없습니다."));

        if (!session.getProgram().isOwnedBy(trainerId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "본인이 개설한 수업만 취소할 수 있습니다.");
        }
        return reservationService.cancelAllForSession(session, reason);
    }

    // ------------------------------------------------------------ 출석

    @Transactional(readOnly = true)
    public List<RosterRow> roster(Long trainerId, Long sessionId) {
        ClassSession session = sessionRepository.findDetailById(sessionId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!session.getProgram().isOwnedBy(trainerId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        return reservationRepository
                .findRosterBySession(sessionId, Enums.ReservationStatus.CANCELED)
                .stream()
                .map(r -> new RosterRow(r.getId(), r.getMember().getId(), r.getMember().getName(),
                        r.getMember().getPhoneNum(), r.getStatus(), r.getReservedAt(), r.getCheckedAt()))
                .toList();
    }

    /**
     * 출석 처리.
     * v1은 출석 시점에 이용권을 차감했지만, v2는 예약 시점에 이미 차감했으므로
     * 여기서는 상태만 바꾼다. 이중 차감이 일어나지 않는다.
     */
    @Transactional
    public void checkAttendance(Long trainerId, Long sessionId, List<AttendanceRequest> items) {
        ClassSession session = sessionRepository.findDetailById(sessionId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!session.getProgram().isOwnedBy(trainerId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        AppUser trainer = userRepository.findById(trainerId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        for (AttendanceRequest item : items) {
            Reservation r = reservationRepository.findById(item.reservationId())
                    .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "예약을 찾을 수 없습니다."));
            if (!r.getSession().getId().equals(sessionId)) {
                throw new ApiException(ErrorCode.INVALID_INPUT, "해당 수업의 예약이 아닙니다.");
            }

            switch (item.status()) {
                case ATTENDED -> r.markAttended(trainer);
                case NOSHOW -> r.markNoShow(trainer);
                case RESERVED -> r.revertCheck();
                default -> throw new ApiException(ErrorCode.INVALID_INPUT,
                        "출석 처리로 지정할 수 없는 상태입니다: " + item.status());
            }
        }

        if (session.hasStarted()) {
            session.complete();
        }
    }

    // ------------------------------------------------------------ 내부

    private ClassProgram ownedProgram(Long programId, Long trainerId) {
        ClassProgram program = programRepository.findDetailById(programId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "강습을 찾을 수 없습니다."));
        if (!program.isOwnedBy(trainerId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "본인이 개설한 강습이 아닙니다.");
        }
        return program;
    }

    private Room resolveRoom(ClassProgram program, Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "강습실을 찾을 수 없습니다."));
        if (!room.getPlace().getId().equals(program.getPlace().getId())) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "강습실이 해당 지점 소속이 아닙니다.");
        }
        return room;
    }

    /**
     * 강습실 시간 충돌 검사.
     * v1은 class 테이블만 보고 1시간 고정으로 검사했고, room_reserve를 통한
     * 별도 예약 경로가 있어 같은 방이 이중으로 잡힐 수 있었다.
     */
    private void assertNoConflict(Long roomId, LocalDateTime start, LocalDateTime end, Long excludeId) {
        if (sessionRepository.existsOverlapping(roomId, start, end, Enums.SessionStatus.CANCELED, excludeId)) {
            throw new ApiException(ErrorCode.ROOM_TIME_CONFLICT);
        }
    }

    private void assertActiveTrainerOf(Long placeId, Long trainerId) {
        boolean ok = placeTrainerRepository.existsByPlaceIdAndTrainerIdAndStatus(
                placeId, trainerId, Enums.PlaceTrainerStatus.ACTIVE);
        if (!ok) {
            throw new ApiException(ErrorCode.TRAINER_NOT_IN_PLACE);
        }
    }
}
