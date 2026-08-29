-- =====================================================================
-- GymKKong v2 시드 데이터 (개발용)
-- 모든 계정 비밀번호: gymkkong1234
-- 강습 회차는 CURDATE() 기준 상대 날짜로 생성되어 앱에 항상 예정 수업이 보입니다.
-- =====================================================================
USE gymkkong_v2;

SET @PW := '$2b$10$WknSqE6pgM5s//9V3Fq.Ie47X1BgLIY3X1LlVPbtRt4WGB859ENha';

-- ---------------------------------------------------------------------
-- 계정
-- ---------------------------------------------------------------------
INSERT INTO app_user (email, password_hash, name, phone_num, role, email_verified_at, phone_verified_at) VALUES
-- 관리자
('super@gymkkong.com',      @PW, '최관리자',   '010-0000-0001', 'SUPER_ADMIN', NOW(), NOW()),
('admin.gangnam@gymkkong.com', @PW, '김매니저', '010-0000-0002', 'ADMIN',       NOW(), NOW()),
('admin.hongdae@gymkkong.com', @PW, '이스태프', '010-0000-0003', 'ADMIN',       NOW(), NOW()),
-- 트레이너
('choi.trainer@gymkkong.com', @PW, '최트레이너', '010-1111-2222', 'TRAINER', NOW(), NOW()),
('jung.coach@gymkkong.com',   @PW, '정코치',     '010-3333-4444', 'TRAINER', NOW(), NOW()),
('han.teacher@gymkkong.com',  @PW, '한선생',     '010-5555-6666', 'TRAINER', NOW(), NOW()),
('park.pt@gymkkong.com',      @PW, '박피티',     '010-7777-8888', 'TRAINER', NOW(), NOW()),
-- 회원
('kim@example.com',   @PW, '김철수', '010-1234-5678', 'MEMBER', NOW(), NOW()),
('lee@example.com',   @PW, '이영희', '010-2345-6789', 'MEMBER', NOW(), NOW()),
('park@example.com',  @PW, '박민수', '010-3456-7890', 'MEMBER', NOW(), NOW()),
('jung@example.com',  @PW, '정수현', '010-4567-8901', 'MEMBER', NOW(), NOW()),
('yoon@example.com',  @PW, '윤지아', '010-5678-9012', 'MEMBER', NOW(), NOW());

SET @u_super  := (SELECT id FROM app_user WHERE email='super@gymkkong.com');
SET @u_adm_gn := (SELECT id FROM app_user WHERE email='admin.gangnam@gymkkong.com');
SET @u_adm_hd := (SELECT id FROM app_user WHERE email='admin.hongdae@gymkkong.com');
SET @u_t_choi := (SELECT id FROM app_user WHERE email='choi.trainer@gymkkong.com');
SET @u_t_jung := (SELECT id FROM app_user WHERE email='jung.coach@gymkkong.com');
SET @u_t_han  := (SELECT id FROM app_user WHERE email='han.teacher@gymkkong.com');
SET @u_t_park := (SELECT id FROM app_user WHERE email='park.pt@gymkkong.com');
SET @u_m_kim  := (SELECT id FROM app_user WHERE email='kim@example.com');
SET @u_m_lee  := (SELECT id FROM app_user WHERE email='lee@example.com');
SET @u_m_park := (SELECT id FROM app_user WHERE email='park@example.com');
SET @u_m_jung := (SELECT id FROM app_user WHERE email='jung@example.com');
SET @u_m_yoon := (SELECT id FROM app_user WHERE email='yoon@example.com');

INSERT INTO member_profile (user_id, birth_date, gender, grade, height_cm, weight_kg) VALUES
(@u_m_kim,  '1997-03-14', 'M', 'GOLD',    176.0, 72.5),
(@u_m_lee,  '1993-08-02', 'F', 'DIAMOND', 163.5, 54.0),
(@u_m_park, '2000-11-25', 'M', 'BRONZE',  181.2, 80.1),
(@u_m_jung, '1995-05-09', 'F', 'GOLD',    168.0, 58.3),
(@u_m_yoon, '1999-01-30', 'F', 'BRONZE',  159.8, 50.2);

INSERT INTO trainer_profile (user_id, bio, specialty, career_years) VALUES
(@u_t_choi, '해부학 기반 자세 교정을 중요하게 봅니다.', '요가, 코어',        8),
(@u_t_jung, '3대 500 목표까지 함께 갑니다.',            '웨이트, 파워리프팅', 5),
(@u_t_han,  '재활 필라테스 전문.',                      '필라테스, 재활',    11),
(@u_t_park, '초보자 1:1 맞춤 PT.',                      'PT, 다이어트',      3);

-- ---------------------------------------------------------------------
-- 지점 / 강습실
-- ---------------------------------------------------------------------
INSERT INTO place (name, address, address_detail, phone_num, description, latitude, longitude, open_time, close_time) VALUES
('짐꽁 강남점', '서울시 강남구 테헤란로 123', '3층', '02-555-0101', '역삼역 2번 출구 도보 3분. 샤워시설 완비.', 37.5006540, 127.0365380, '06:00:00', '23:00:00'),
('짐꽁 홍대점', '서울시 마포구 양화로 456',   'B1',  '02-333-0202', '홍대입구역 9번 출구 도보 5분.',            37.5571800, 126.9245700, '07:00:00', '23:00:00'),
('짐꽁 잠실점', '서울시 송파구 올림픽로 789', '5층', '02-777-0303', '잠실역 직통. 주차 2시간 무료.',            37.5132610, 127.1000230, '06:00:00', '22:00:00');

SET @p_gn := (SELECT id FROM place WHERE name='짐꽁 강남점');
SET @p_hd := (SELECT id FROM place WHERE name='짐꽁 홍대점');
SET @p_js := (SELECT id FROM place WHERE name='짐꽁 잠실점');

INSERT INTO place_admin (place_id, user_id) VALUES
(@p_gn, @u_adm_gn),
(@p_hd, @u_adm_hd);

INSERT INTO room (place_id, room_num, name, capacity) VALUES
(@p_gn, '101', 'GX룸 A', 20),
(@p_gn, '102', '필라테스룸', 12),
(@p_gn, '103', 'PT존',      2),
(@p_hd, '201', 'GX룸',      16),
(@p_hd, '202', 'PT존',      2),
(@p_js, '301', '메인홀',    24);

SET @r_gn101 := (SELECT id FROM room WHERE place_id=@p_gn AND room_num='101');
SET @r_gn102 := (SELECT id FROM room WHERE place_id=@p_gn AND room_num='102');
SET @r_gn103 := (SELECT id FROM room WHERE place_id=@p_gn AND room_num='103');
SET @r_hd201 := (SELECT id FROM room WHERE place_id=@p_hd AND room_num='201');
SET @r_hd202 := (SELECT id FROM room WHERE place_id=@p_hd AND room_num='202');
SET @r_js301 := (SELECT id FROM room WHERE place_id=@p_js AND room_num='301');

INSERT INTO place_trainer (place_id, user_id, status, approved_at, approved_by) VALUES
(@p_gn, @u_t_choi, 'ACTIVE',  NOW(), @u_adm_gn),
(@p_gn, @u_t_jung, 'ACTIVE',  NOW(), @u_adm_gn),
(@p_gn, @u_t_park, 'ACTIVE',  NOW(), @u_adm_gn),
(@p_hd, @u_t_han,  'ACTIVE',  NOW(), @u_adm_hd),
(@p_js, @u_t_choi, 'PENDING', NULL,  NULL);       -- 승인 대기 케이스

-- ---------------------------------------------------------------------
-- 강습 프로그램
-- ---------------------------------------------------------------------
INSERT INTO class_program (place_id, trainer_user_id, name, description, class_type, level, duration_min, default_capacity) VALUES
(@p_gn, @u_t_choi, '아침 요가',       '하루를 여는 60분 빈야사 요가.',        'GROUP',    'ALL',        60, 15),
(@p_gn, @u_t_jung, '근력 스트렝스',   '스쿼트/벤치/데드 중심 그룹 수업.',     'GROUP',    'INTERMEDIATE', 90, 10),
(@p_gn, @u_t_park, '1:1 다이어트 PT', '체성분 측정 후 맞춤 프로그램.',        'PERSONAL', 'BEGINNER',   50,  1),
(@p_hd, @u_t_han,  '필라테스 기구',    '리포머 기반 소그룹 필라테스.',        'GROUP',    'BEGINNER',   50, 12),
(@p_js, @u_t_choi, '코어 클래스',      '복부/둔근 중심 서킷.',                'GROUP',    'ALL',        45, 20);

SET @c_yoga  := (SELECT id FROM class_program WHERE name='아침 요가');
SET @c_str   := (SELECT id FROM class_program WHERE name='근력 스트렝스');
SET @c_pt    := (SELECT id FROM class_program WHERE name='1:1 다이어트 PT');
SET @c_pil   := (SELECT id FROM class_program WHERE name='필라테스 기구');
SET @c_core  := (SELECT id FROM class_program WHERE name='코어 클래스');

-- ---------------------------------------------------------------------
-- 강습 회차: 어제 ~ +6일. 앱에서 지난/오늘/예정이 모두 보이도록 구성
-- ---------------------------------------------------------------------
INSERT INTO class_session (program_id, room_id, start_at, end_at, capacity, status) VALUES
-- 아침 요가 07:00 (강남 101) — 어제는 종료 처리
(@c_yoga, @r_gn101, TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '07:00:00'), TIMESTAMP(CURDATE() - INTERVAL 1 DAY, '08:00:00'), 15, 'COMPLETED'),
(@c_yoga, @r_gn101, TIMESTAMP(CURDATE(),                  '07:00:00'), TIMESTAMP(CURDATE(),                  '08:00:00'), 15, 'SCHEDULED'),
(@c_yoga, @r_gn101, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '07:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '08:00:00'), 15, 'SCHEDULED'),
(@c_yoga, @r_gn101, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '07:00:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '08:00:00'), 15, 'SCHEDULED'),
(@c_yoga, @r_gn101, TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '07:00:00'), TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '08:00:00'), 15, 'SCHEDULED'),
-- 근력 스트렝스 19:00 (강남 101)
(@c_str,  @r_gn101, TIMESTAMP(CURDATE(),                  '19:00:00'), TIMESTAMP(CURDATE(),                  '20:30:00'), 10, 'SCHEDULED'),
(@c_str,  @r_gn101, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '19:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '20:30:00'), 10, 'SCHEDULED'),
(@c_str,  @r_gn101, TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '19:00:00'), TIMESTAMP(CURDATE() + INTERVAL 3 DAY, '20:30:00'), 10, 'SCHEDULED'),
-- 1:1 PT 14:00 (강남 103)
(@c_pt,   @r_gn103, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '14:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '14:50:00'),  1, 'SCHEDULED'),
(@c_pt,   @r_gn103, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '14:00:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '14:50:00'),  1, 'SCHEDULED'),
-- 필라테스 10:00 (홍대 201)
(@c_pil,  @r_hd201, TIMESTAMP(CURDATE(),                  '10:00:00'), TIMESTAMP(CURDATE(),                  '10:50:00'), 12, 'SCHEDULED'),
(@c_pil,  @r_hd201, TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '10:00:00'), TIMESTAMP(CURDATE() + INTERVAL 1 DAY, '10:50:00'), 12, 'SCHEDULED'),
(@c_pil,  @r_hd201, TIMESTAMP(CURDATE() + INTERVAL 4 DAY, '10:00:00'), TIMESTAMP(CURDATE() + INTERVAL 4 DAY, '10:50:00'), 12, 'SCHEDULED'),
-- 코어 20:00 (잠실 301)
(@c_core, @r_js301, TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '20:00:00'), TIMESTAMP(CURDATE() + INTERVAL 2 DAY, '20:45:00'), 20, 'SCHEDULED'),
(@c_core, @r_js301, TIMESTAMP(CURDATE() + INTERVAL 5 DAY, '20:00:00'), TIMESTAMP(CURDATE() + INTERVAL 5 DAY, '20:45:00'), 20, 'SCHEDULED');

-- ---------------------------------------------------------------------
-- 이용권 상품 / 구매 / 결제
-- ---------------------------------------------------------------------
INSERT INTO membership_plan (place_id, name, total_count, price, valid_days, class_type) VALUES
(@p_gn, '그룹 10회권', 10, 150000, 90,  'GROUP'),
(@p_gn, '그룹 20회권', 20, 280000, 180, 'GROUP'),
(@p_gn, 'PT 10회권',   10, 700000, 120, 'PERSONAL'),
(@p_hd, '그룹 15회권', 15, 200000, 120, 'GROUP'),
(@p_js, '그룹 10회권', 10, 130000, 90,  'GROUP');

SET @pl_gn10  := (SELECT id FROM membership_plan WHERE place_id=@p_gn AND name='그룹 10회권');
SET @pl_gn20  := (SELECT id FROM membership_plan WHERE place_id=@p_gn AND name='그룹 20회권');
SET @pl_gnpt  := (SELECT id FROM membership_plan WHERE place_id=@p_gn AND name='PT 10회권');
SET @pl_hd15  := (SELECT id FROM membership_plan WHERE place_id=@p_hd AND name='그룹 15회권');

INSERT INTO membership (plan_id, member_user_id, place_id, total_count, remain_count, start_date, expire_date, status) VALUES
(@pl_gn10, @u_m_kim,  @p_gn, 10,  8, CURDATE() - INTERVAL 20 DAY, CURDATE() + INTERVAL 70 DAY,  'ACTIVE'),
(@pl_gn20, @u_m_lee,  @p_gn, 20, 19, CURDATE() - INTERVAL 10 DAY, CURDATE() + INTERVAL 170 DAY, 'ACTIVE'),
(@pl_gnpt, @u_m_lee,  @p_gn, 10, 10, CURDATE() - INTERVAL 5 DAY,  CURDATE() + INTERVAL 115 DAY, 'ACTIVE'),
(@pl_hd15, @u_m_park, @p_hd, 15, 12, CURDATE() - INTERVAL 30 DAY, CURDATE() + INTERVAL 90 DAY,  'ACTIVE'),
(@pl_gn10, @u_m_jung, @p_gn, 10,  0, CURDATE() - INTERVAL 95 DAY, CURDATE() - INTERVAL 5 DAY,   'EXPIRED'),
(@pl_gn10, @u_m_yoon, @p_gn, 10,  0, CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 50 DAY,  'REFUNDED');

SET @ms_kim   := (SELECT id FROM membership WHERE member_user_id=@u_m_kim  LIMIT 1);
SET @ms_lee   := (SELECT id FROM membership WHERE member_user_id=@u_m_lee AND plan_id=@pl_gn20);
SET @ms_leept := (SELECT id FROM membership WHERE member_user_id=@u_m_lee AND plan_id=@pl_gnpt);
SET @ms_park  := (SELECT id FROM membership WHERE member_user_id=@u_m_park LIMIT 1);
SET @ms_jung  := (SELECT id FROM membership WHERE member_user_id=@u_m_jung LIMIT 1);
SET @ms_yoon  := (SELECT id FROM membership WHERE member_user_id=@u_m_yoon LIMIT 1);

INSERT INTO payment (membership_id, member_user_id, amount, method, status, pg_tid, paid_at) VALUES
(@ms_kim,   @u_m_kim,  150000, 'CARD',     'PAID', 'TID-0001', NOW() - INTERVAL 20 DAY),
(@ms_lee,   @u_m_lee,  280000, 'KAKAOPAY', 'PAID', 'TID-0002', NOW() - INTERVAL 10 DAY),
(@ms_leept, @u_m_lee,  700000, 'CARD',     'PAID', 'TID-0003', NOW() - INTERVAL 5 DAY),
(@ms_park,  @u_m_park, 200000, 'TOSS',     'PAID', 'TID-0004', NOW() - INTERVAL 30 DAY),
(@ms_jung,  @u_m_jung, 150000, 'CARD',     'PAID', 'TID-0005', NOW() - INTERVAL 95 DAY),
(@ms_yoon,  @u_m_yoon, 150000, 'CARD',     'PAID', 'TID-0006', NOW() - INTERVAL 40 DAY);

INSERT INTO refund (payment_id, amount, reason, status, requested_at, processed_at, processed_by) VALUES
((SELECT id FROM payment WHERE pg_tid='TID-0006'), 150000, '개인 사정으로 이용 중단', 'COMPLETED',
 NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 2 DAY, @u_adm_gn);

-- ---------------------------------------------------------------------
-- 예약 (reserved_count 동기화 포함)
-- ---------------------------------------------------------------------
SET @s_yoga_yesterday := (SELECT id FROM class_session WHERE program_id=@c_yoga AND start_at < NOW() ORDER BY start_at DESC LIMIT 1);
SET @s_yoga_tomorrow  := (SELECT id FROM class_session WHERE program_id=@c_yoga AND start_at > NOW() ORDER BY start_at ASC LIMIT 1);
SET @s_str_today      := (SELECT id FROM class_session WHERE program_id=@c_str  ORDER BY start_at ASC LIMIT 1);
SET @s_pil_next       := (SELECT id FROM class_session WHERE program_id=@c_pil  AND start_at > NOW() ORDER BY start_at ASC LIMIT 1);

INSERT INTO reservation (session_id, member_user_id, membership_id, status, reserved_at, checked_at, checked_by) VALUES
-- 지난 수업: 출석 완료 / 노쇼
(@s_yoga_yesterday, @u_m_kim, @ms_kim, 'ATTENDED', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY, @u_t_choi),
(@s_yoga_yesterday, @u_m_lee, @ms_lee, 'NOSHOW',   NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 1 DAY, @u_t_choi),
-- 예정 수업: 예약 상태
(@s_yoga_tomorrow,  @u_m_kim, @ms_kim, 'RESERVED', NOW() - INTERVAL 1 DAY, NULL, NULL),
(@s_str_today,      @u_m_lee, @ms_lee, 'RESERVED', NOW() - INTERVAL 2 DAY, NULL, NULL),
(@s_pil_next,       @u_m_park, @ms_park,'RESERVED', NOW() - INTERVAL 1 DAY, NULL, NULL);

UPDATE class_session s
SET s.reserved_count = (
  SELECT COUNT(*) FROM reservation r
  WHERE r.session_id = s.id AND r.status IN ('RESERVED','ATTENDED','NOSHOW')
);

-- ---------------------------------------------------------------------
-- 커뮤니티
-- ---------------------------------------------------------------------
INSERT INTO post (place_id, author_user_id, post_type, title, content, is_pinned, created_at) VALUES
(@p_gn, @u_t_choi, 'NOTICE', '12월 아침 요가 프로그램 개편 안내',
 '12월부터 아침 요가가 빈야사 중심으로 개편됩니다. 매트는 지점에 준비되어 있습니다.', TRUE,  NOW() - INTERVAL 3 DAY),
(@p_gn, @u_adm_gn, 'NOTICE', '연말 특별 할인 이벤트',
 '12월 한 달간 20회권 15% 할인 이벤트를 진행합니다.', FALSE, NOW() - INTERVAL 2 DAY),
(@p_gn, @u_m_kim,  'QNA',    '수업 20분 전에 도착해도 되나요?',
 '탈의실 사용 때문에 여쭤봅니다. 보통 몇 분 전에 오시나요?', FALSE, NOW() - INTERVAL 1 DAY),
(@p_hd, @u_t_han,  'FREE',   '필라테스 입문자 가이드',
 '처음 오시는 분들은 양말(그립 삭스) 꼭 챙겨오세요.', FALSE, NOW() - INTERVAL 4 DAY);

SET @po_notice := (SELECT id FROM post WHERE title='12월 아침 요가 프로그램 개편 안내');
SET @po_qna    := (SELECT id FROM post WHERE title='수업 20분 전에 도착해도 되나요?');

INSERT INTO comment (post_id, author_user_id, content, created_at) VALUES
(@po_notice, @u_m_kim,  '개편 기대됩니다!',                       NOW() - INTERVAL 2 DAY),
(@po_notice, @u_m_lee,  '매트 준비돼 있다니 좋네요.',             NOW() - INTERVAL 2 DAY),
(@po_qna,    @u_t_choi, '10분 전 도착이면 충분합니다.',           NOW() - INTERVAL 20 HOUR),  -- 트레이너 댓글(v1에선 불가)
(@po_qna,    @u_m_park, '저도 보통 10분 전에 갑니다.',            NOW() - INTERVAL 18 HOUR);

UPDATE post p SET p.comment_count = (
  SELECT COUNT(*) FROM comment c WHERE c.post_id = p.id AND c.deleted_at IS NULL
);

-- ---------------------------------------------------------------------
-- 앱 부가 데이터
-- ---------------------------------------------------------------------
INSERT INTO favorite_place (user_id, place_id) VALUES
(@u_m_kim, @p_gn), (@u_m_lee, @p_gn), (@u_m_park, @p_hd);

INSERT INTO notification (user_id, type, title, body, link_type, link_id) VALUES
(@u_m_kim, 'RESERVATION', '예약이 확정되었습니다', '내일 07:00 아침 요가 수업이 예약되었습니다.', 'SESSION', @s_yoga_tomorrow),
(@u_m_kim, 'MEMBERSHIP_EXPIRING', '이용권 만료 예정', '보유하신 그룹 10회권이 70일 후 만료됩니다.', 'MEMBERSHIP', @ms_kim),
(@u_m_lee, 'COMMENT', '새 댓글이 달렸습니다', '작성하신 글에 댓글이 등록되었습니다.', 'POST', @po_notice);

INSERT INTO terms_agreement (user_id, terms_code, terms_version, agreed) VALUES
(@u_m_kim, 'SERVICE', 'v1.0', TRUE),
(@u_m_kim, 'PRIVACY', 'v1.0', TRUE),
(@u_m_kim, 'MARKETING', 'v1.0', FALSE);
