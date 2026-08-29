package com.gymkkong.api.service;

import com.gymkkong.api.common.ApiException;
import com.gymkkong.api.common.ErrorCode;
import com.gymkkong.api.common.PageResponse;
import com.gymkkong.api.domain.*;
import com.gymkkong.api.dto.CommunityDtos.*;
import com.gymkkong.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;

/**
 * 인앱 알림 저장 + 푸시 발송 지점.
 * 실제 Expo Push 전송은 sendPush에서 처리한다. 현재는 발송기가 붙기 전이라
 * 알림함 저장까지만 수행하고 전송은 로그로 남긴다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("M월 d일 HH:mm");

    private final NotificationRepository notificationRepository;
    private final DeviceTokenRepository deviceTokenRepository;

    @Transactional
    public void notifyReservationConfirmed(AppUser member, ClassSession session) {
        create(member, Enums.NotificationType.RESERVATION,
                "예약이 확정되었습니다",
                session.getStartAt().format(WHEN) + " " + session.getProgram().getName()
                        + " 수업이 예약되었습니다.",
                "SESSION", session.getId());
    }

    @Transactional
    public void notifyClassCanceled(AppUser member, ClassSession session, String reason) {
        String body = session.getStartAt().format(WHEN) + " " + session.getProgram().getName()
                + " 수업이 취소되었습니다. 이용권은 자동으로 복원되었습니다.";
        if (reason != null && !reason.isBlank()) {
            body += " (사유: " + reason + ")";
        }
        create(member, Enums.NotificationType.CLASS_CANCELED,
                "수업이 취소되었습니다", body, "SESSION", session.getId());
    }

    @Transactional
    public void notifyPayment(AppUser member, String planName, int amount) {
        create(member, Enums.NotificationType.PAYMENT,
                "결제가 완료되었습니다",
                planName + " " + String.format("%,d", amount) + "원 결제가 완료되었습니다.",
                null, null);
    }

    @Transactional
    public void notifyComment(AppUser postAuthor, Post post, String commenterName) {
        if (postAuthor.getId().equals(post.getAuthor().getId())) {
            // 본인 글에 본인이 단 댓글은 알리지 않는다.
            return;
        }
        create(postAuthor, Enums.NotificationType.COMMENT,
                "새 댓글이 달렸습니다",
                commenterName + "님이 \"" + post.getTitle() + "\"에 댓글을 남겼습니다.",
                "POST", post.getId());
    }

    private void create(AppUser user, Enums.NotificationType type, String title,
                        String body, String linkType, Long linkId) {
        notificationRepository.save(Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(truncate(body, 500))
                .linkType(linkType)
                .linkId(linkId)
                .build());
        sendPush(user, title, body);
    }

    /** Expo Push API 연동 지점. 토큰이 없으면 조용히 넘어간다. */
    private void sendPush(AppUser user, String title, String body) {
        var tokens = deviceTokenRepository.findByUserIdAndIsActiveTrue(user.getId());
        if (tokens.isEmpty()) return;
        log.info("[푸시] to={} tokens={} title={}", user.getId(), tokens.size(), title);
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }

    // ------------------------------------------------------------ 조회 / 기기

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(Long userId, Pageable pageable) {
        return PageResponse.of(
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable),
                NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        if (!n.getUser().getId().equals(userId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        n.markRead();
    }

    /** 같은 기기가 다른 계정으로 로그인할 수 있어 upsert로 처리한다. */
    @Transactional
    public void registerDevice(AppUser user, DeviceTokenRequest req) {
        deviceTokenRepository.findByToken(req.token())
                .ifPresentOrElse(
                        existing -> existing.reassign(user, req.platform()),
                        () -> deviceTokenRepository.save(DeviceToken.builder()
                                .user(user)
                                .token(req.token())
                                .platform(req.platform())
                                .build()));
    }
}
