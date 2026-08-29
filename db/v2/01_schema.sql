-- =====================================================================
-- GymKKong Schema v2 (for React Native app + Spring Boot API)
--
-- v1(DDL/common.sql) 대비 변경 요약
--  1. 인증 통합: member/trainer/admin -> app_user(role) + 프로필 테이블
--  2. class 분리: class_program(강습 정의) + class_session(실제 회차)
--  3. 예약/출석 통합: class_reservation + attendance -> reservation(status)
--  4. 이용권 class 종속 제거: membership_plan(place 기준) + 예약 시점 차감
--  5. room_reserve 제거 -> class_session이 강습실 점유의 유일한 소스(이중예약 방지)
--  6. 게시판 작성자 일반화: post/comment 모두 app_user 기준(회원·트레이너 모두 작성)
--  7. 모바일 필수 테이블 추가: 인증코드/리프레시토큰/푸시토큰/알림/첨부/즐겨찾기/약관
--  8. ENUM 오타(INACTTIVE) 수정, 전 테이블 created_at/updated_at, 조회 인덱스 추가
-- =====================================================================

-- 이 파일은 docker-entrypoint-initdb.d 에서 자동 실행됩니다.
-- 수동으로 초기화하려면 db/v2/00_reset.sql 을 먼저 실행하세요.
CREATE DATABASE IF NOT EXISTS gymkkong_v2
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE gymkkong_v2;

-- =====================================================================
-- 1. 계정 / 인증
-- =====================================================================

-- 모든 역할의 로그인 주체. JWT subject = app_user.id
CREATE TABLE app_user (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,              -- BCrypt. 평문 저장 금지
  name          VARCHAR(100) NOT NULL,
  phone_num     VARCHAR(20),
  role          ENUM('MEMBER','TRAINER','ADMIN','SUPER_ADMIN') NOT NULL,
  status        ENUM('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  email_verified_at DATETIME NULL,
  phone_verified_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  CONSTRAINT uq_app_user_email UNIQUE (email),
  INDEX idx_app_user_phone (phone_num),
  INDEX idx_app_user_role_status (role, status)
) ENGINE=InnoDB;

-- 회원 전용 프로필
CREATE TABLE member_profile (
  user_id     BIGINT PRIMARY KEY,
  birth_date  DATE NULL,                            -- v1의 age VARCHAR(255) 대체
  gender      ENUM('M','F','OTHER') NULL,
  grade       ENUM('BRONZE','GOLD','DIAMOND') NOT NULL DEFAULT 'BRONZE',
  height_cm   DECIMAL(5,2) NULL,
  weight_kg   DECIMAL(5,2) NULL,
  profile_image_url VARCHAR(500) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_member_profile_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 트레이너 전용 프로필
CREATE TABLE trainer_profile (
  user_id     BIGINT PRIMARY KEY,
  bio         TEXT NULL,
  specialty   VARCHAR(255) NULL,                    -- 예: '요가, 필라테스'
  career_years INT NOT NULL DEFAULT 0,
  profile_image_url VARCHAR(500) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_trainer_profile_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 이메일/휴대폰 인증코드. v1 README는 "인증 기반"이라 명시했으나 테이블이 없었음
CREATE TABLE verification_code (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  channel     ENUM('EMAIL','PHONE') NOT NULL,
  target      VARCHAR(190) NOT NULL,                -- 이메일 주소 또는 휴대폰번호
  purpose     ENUM('SIGNUP','FIND_ACCOUNT','RESET_PASSWORD','CHANGE_PHONE') NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,                -- 코드도 해시 저장
  expires_at  DATETIME NOT NULL,
  verified_at DATETIME NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_verification_lookup (channel, target, purpose, expires_at)
) ENGINE=InnoDB;

-- 리프레시 토큰 (기기별 세션)
CREATE TABLE refresh_token (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  device_id   VARCHAR(190) NULL,
  expires_at  DATETIME NOT NULL,
  revoked_at  DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash),
  CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
  INDEX idx_refresh_token_user (user_id, revoked_at)
) ENGINE=InnoDB;

-- 약관 동의 이력
CREATE TABLE terms_agreement (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  terms_code  VARCHAR(50) NOT NULL,                 -- SERVICE, PRIVACY, MARKETING ...
  terms_version VARCHAR(20) NOT NULL,
  agreed      BOOLEAN NOT NULL,
  agreed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_terms_agreement_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
  INDEX idx_terms_agreement_user (user_id, terms_code)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. 지점 / 시설
-- =====================================================================

CREATE TABLE place (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  address     VARCHAR(255) NOT NULL,
  address_detail VARCHAR(255) NULL,
  phone_num   VARCHAR(20) NULL,
  description TEXT NULL,
  latitude    DECIMAL(10,7) NULL,                   -- 앱 '내 주변 지점' 필수. v1에 없었음
  longitude   DECIMAL(10,7) NULL,
  open_time   TIME NULL,
  close_time  TIME NULL,
  image_url   VARCHAR(500) NULL,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  INDEX idx_place_name (name),
  INDEX idx_place_geo (latitude, longitude),
  INDEX idx_place_status (status)
) ENGINE=InnoDB;

-- 지점 관리자. v1의 admin에는 place_id가 없어 '지점 담당자'가 표현 불가능했음
CREATE TABLE place_admin (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id    BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_place_admin UNIQUE (place_id, user_id),
  CONSTRAINT fk_place_admin_place FOREIGN KEY (place_id) REFERENCES place(id),
  CONSTRAINT fk_place_admin_user  FOREIGN KEY (user_id)  REFERENCES app_user(id),
  INDEX idx_place_admin_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE room (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id    BIGINT NOT NULL,
  room_num    VARCHAR(20) NOT NULL,
  name        VARCHAR(100) NULL,
  capacity    INT NOT NULL DEFAULT 0,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_room_place_num UNIQUE (place_id, room_num),
  CONSTRAINT fk_room_place FOREIGN KEY (place_id) REFERENCES place(id),
  INDEX idx_room_place (place_id, status)
) ENGINE=InnoDB;

-- 트레이너 소속. v1 흐름의 '승인 대기'를 ENUM으로 표현(v1은 ENUM에 없는 'N'을 넣어 실패)
CREATE TABLE place_trainer (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id    BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,                      -- role=TRAINER
  status      ENUM('PENDING','ACTIVE','REJECTED','INACTIVE') NOT NULL DEFAULT 'PENDING',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  approved_by BIGINT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_place_trainer UNIQUE (place_id, user_id),
  CONSTRAINT fk_place_trainer_place FOREIGN KEY (place_id) REFERENCES place(id),
  CONSTRAINT fk_place_trainer_user  FOREIGN KEY (user_id)  REFERENCES app_user(id),
  CONSTRAINT fk_place_trainer_approver FOREIGN KEY (approved_by) REFERENCES app_user(id),
  INDEX idx_place_trainer_user (user_id, status),
  INDEX idx_place_trainer_place (place_id, status)
) ENGINE=InnoDB;

-- =====================================================================
-- 3. 강습 (프로그램 + 회차)
--    v1의 class는 start_time 하나뿐인 단일 회차라 '10회권'과 모순이었음
-- =====================================================================

CREATE TABLE class_program (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id    BIGINT NOT NULL,
  trainer_user_id BIGINT NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT NULL,
  class_type  ENUM('GROUP','PERSONAL') NOT NULL DEFAULT 'GROUP',
  level       ENUM('BEGINNER','INTERMEDIATE','ADVANCED','ALL') NOT NULL DEFAULT 'ALL',
  duration_min INT NOT NULL DEFAULT 60,             -- v1은 진행중 판정을 2시간 하드코딩했음
  default_capacity INT NOT NULL DEFAULT 10,
  image_url   VARCHAR(500) NULL,
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  CONSTRAINT fk_class_program_place FOREIGN KEY (place_id) REFERENCES place(id),
  CONSTRAINT fk_class_program_trainer FOREIGN KEY (trainer_user_id) REFERENCES app_user(id),
  INDEX idx_class_program_place (place_id, status),
  INDEX idx_class_program_trainer (trainer_user_id, status)
) ENGINE=InnoDB;

-- 실제 예약 대상이 되는 1회분 수업
CREATE TABLE class_session (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  program_id  BIGINT NOT NULL,
  room_id     BIGINT NOT NULL,
  start_at    DATETIME NOT NULL,
  end_at      DATETIME NOT NULL,                    -- v1에 종료시간 컬럼이 없었음
  capacity    INT NOT NULL,
  reserved_count INT NOT NULL DEFAULT 0,            -- 정합성은 예약 트랜잭션에서 유지
  status      ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELED') NOT NULL DEFAULT 'SCHEDULED',
  cancel_reason VARCHAR(255) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_class_session_program FOREIGN KEY (program_id) REFERENCES class_program(id),
  CONSTRAINT fk_class_session_room FOREIGN KEY (room_id) REFERENCES room(id),
  CONSTRAINT chk_class_session_time CHECK (end_at > start_at),
  CONSTRAINT chk_class_session_capacity CHECK (capacity > 0),
  -- 같은 방/같은 시작시각 중복 개설 차단. 부분 겹침은 서비스 계층에서 range 검사
  CONSTRAINT uq_class_session_room_start UNIQUE (room_id, start_at),
  INDEX idx_class_session_start (start_at, status),
  INDEX idx_class_session_program (program_id, start_at),
  INDEX idx_class_session_room_range (room_id, start_at, end_at)
) ENGINE=InnoDB;

-- =====================================================================
-- 4. 이용권 / 결제
-- =====================================================================

-- v1: membership_option.class_id -> 이용권이 수업 1회에 묶여 있었음. place 기준으로 변경
CREATE TABLE membership_plan (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id    BIGINT NOT NULL,
  name        VARCHAR(150) NOT NULL,                -- 예: '그룹 10회권'
  total_count INT NOT NULL,
  price       INT NOT NULL,
  valid_days  INT NOT NULL DEFAULT 90,              -- 구매일 기준 유효기간
  class_type  ENUM('GROUP','PERSONAL','ALL') NOT NULL DEFAULT 'ALL',
  status      ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_membership_plan_place FOREIGN KEY (place_id) REFERENCES place(id),
  CONSTRAINT chk_membership_plan_count CHECK (total_count > 0),
  CONSTRAINT chk_membership_plan_price CHECK (price >= 0),
  INDEX idx_membership_plan_place (place_id, status)
) ENGINE=InnoDB;

CREATE TABLE membership (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  plan_id     BIGINT NOT NULL,
  member_user_id BIGINT NOT NULL,
  place_id    BIGINT NOT NULL,                      -- plan 변경에도 소속 지점 고정
  total_count INT NOT NULL,                         -- 구매 시점 스냅샷
  remain_count INT NOT NULL,
  start_date  DATE NOT NULL,
  expire_date DATE NOT NULL,
  status      ENUM('ACTIVE','EXPIRED','REFUNDED','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_membership_plan FOREIGN KEY (plan_id) REFERENCES membership_plan(id),
  CONSTRAINT fk_membership_user FOREIGN KEY (member_user_id) REFERENCES app_user(id),
  CONSTRAINT fk_membership_place FOREIGN KEY (place_id) REFERENCES place(id),
  CONSTRAINT chk_membership_remain CHECK (remain_count >= 0 AND remain_count <= total_count),
  INDEX idx_membership_user (member_user_id, status),
  INDEX idx_membership_place (place_id, status)
) ENGINE=InnoDB;

CREATE TABLE payment (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  membership_id BIGINT NOT NULL,
  member_user_id BIGINT NOT NULL,
  amount      INT NOT NULL,
  method      ENUM('CARD','TRANSFER','KAKAOPAY','TOSS','ONSITE') NOT NULL DEFAULT 'CARD',
  status      ENUM('PENDING','PAID','FAILED','CANCELED') NOT NULL DEFAULT 'PAID',
  pg_tid      VARCHAR(190) NULL,
  paid_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_payment_pg_tid UNIQUE (pg_tid),
  CONSTRAINT fk_payment_membership FOREIGN KEY (membership_id) REFERENCES membership(id),
  CONSTRAINT fk_payment_user FOREIGN KEY (member_user_id) REFERENCES app_user(id),
  INDEX idx_payment_user (member_user_id, paid_at),
  INDEX idx_payment_membership (membership_id)
) ENGINE=InnoDB;

CREATE TABLE refund (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id  BIGINT NOT NULL,
  amount      INT NOT NULL,
  reason      VARCHAR(255) NULL,
  status      ENUM('REQUESTED','APPROVED','REJECTED','COMPLETED') NOT NULL DEFAULT 'REQUESTED',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  processed_by BIGINT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payment(id),
  CONSTRAINT fk_refund_processor FOREIGN KEY (processed_by) REFERENCES app_user(id),
  CONSTRAINT chk_refund_amount CHECK (amount >= 0),
  INDEX idx_refund_payment (payment_id, status)
) ENGINE=InnoDB;

-- =====================================================================
-- 5. 예약 + 출석 (v1의 class_reservation / attendance 통합)
-- =====================================================================

CREATE TABLE reservation (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id  BIGINT NOT NULL,
  member_user_id BIGINT NOT NULL,
  membership_id BIGINT NOT NULL,                    -- 어떤 이용권에서 차감했는지
  status      ENUM('RESERVED','CANCELED','ATTENDED','NOSHOW') NOT NULL DEFAULT 'RESERVED',
  reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  canceled_at DATETIME NULL,
  checked_at  DATETIME NULL,                        -- 출석 처리 시각
  checked_by  BIGINT NULL,                          -- 출석 처리한 트레이너
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 같은 회차 중복 예약 차단. v1에는 이 제약이 없어 무한 예약 가능했음
  CONSTRAINT uq_reservation_session_member UNIQUE (session_id, member_user_id),
  CONSTRAINT fk_reservation_session FOREIGN KEY (session_id) REFERENCES class_session(id),
  CONSTRAINT fk_reservation_user FOREIGN KEY (member_user_id) REFERENCES app_user(id),
  CONSTRAINT fk_reservation_membership FOREIGN KEY (membership_id) REFERENCES membership(id),
  CONSTRAINT fk_reservation_checker FOREIGN KEY (checked_by) REFERENCES app_user(id),
  INDEX idx_reservation_user (member_user_id, status, reserved_at),
  INDEX idx_reservation_session (session_id, status),
  INDEX idx_reservation_membership (membership_id)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. 커뮤니티
--    v1: post는 트레이너만, comment는 회원만 작성 가능했고
--        sp_댓글_작성은 존재하지 않는 'coment' 테이블을 참조해 항상 실패
-- =====================================================================

CREATE TABLE post (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id    BIGINT NOT NULL,
  author_user_id BIGINT NOT NULL,                   -- 회원/트레이너/관리자 모두 가능
  post_type   ENUM('NOTICE','FREE','QNA') NOT NULL DEFAULT 'FREE',
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  view_count  INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  CONSTRAINT fk_post_place FOREIGN KEY (place_id) REFERENCES place(id),
  CONSTRAINT fk_post_author FOREIGN KEY (author_user_id) REFERENCES app_user(id),
  INDEX idx_post_place_created (place_id, deleted_at, is_pinned DESC, created_at DESC),
  INDEX idx_post_author (author_user_id)
) ENGINE=InnoDB;

CREATE TABLE comment (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id     BIGINT NOT NULL,
  author_user_id BIGINT NOT NULL,
  parent_id   BIGINT NULL,                          -- 대댓글
  content     TEXT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME NULL,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post(id),
  CONSTRAINT fk_comment_author FOREIGN KEY (author_user_id) REFERENCES app_user(id),
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comment(id),
  INDEX idx_comment_post (post_id, deleted_at, created_at)
) ENGINE=InnoDB;

-- =====================================================================
-- 7. 모바일 앱 지원 테이블
-- =====================================================================

CREATE TABLE device_token (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  token       VARCHAR(500) NOT NULL,                -- Expo push token / FCM token
  platform    ENUM('IOS','ANDROID') NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_device_token UNIQUE (token(191)),
  CONSTRAINT fk_device_token_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
  INDEX idx_device_token_user (user_id, is_active)
) ENGINE=InnoDB;

CREATE TABLE notification (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  type        ENUM('RESERVATION','CLASS_CANCELED','MEMBERSHIP_EXPIRING','PAYMENT','COMMENT','NOTICE') NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        VARCHAR(500) NOT NULL,
  link_type   VARCHAR(50) NULL,                     -- 앱 딥링크 대상 (예: SESSION, POST)
  link_id     BIGINT NULL,
  read_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
  INDEX idx_notification_user (user_id, read_at, created_at DESC)
) ENGINE=InnoDB;

CREATE TABLE attachment (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_type  ENUM('POST','COMMENT','PLACE','PROGRAM','USER') NOT NULL,
  owner_id    BIGINT NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  file_name   VARCHAR(255) NULL,
  content_type VARCHAR(100) NULL,
  file_size   BIGINT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attachment_owner (owner_type, owner_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE favorite_place (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT NOT NULL,
  place_id    BIGINT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_favorite_place UNIQUE (user_id, place_id),
  CONSTRAINT fk_favorite_place_user FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_place_place FOREIGN KEY (place_id) REFERENCES place(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 8. 조회용 뷰
-- =====================================================================

-- 앱 수업 목록 카드에 필요한 정보 1회 조회
CREATE OR REPLACE VIEW v_session_detail AS
SELECT
  s.id                AS session_id,
  s.start_at,
  s.end_at,
  s.capacity,
  s.reserved_count,
  (s.capacity - s.reserved_count) AS remain_seat,
  s.status            AS session_status,
  p.id                AS program_id,
  p.name              AS program_name,
  p.class_type,
  p.level,
  p.image_url         AS program_image_url,
  pl.id               AS place_id,
  pl.name             AS place_name,
  pl.address          AS place_address,
  r.id                AS room_id,
  r.room_num,
  t.id                AS trainer_user_id,
  t.name              AS trainer_name,
  tp.profile_image_url AS trainer_image_url
FROM class_session s
JOIN class_program  p  ON s.program_id = p.id
JOIN place          pl ON p.place_id = pl.id
JOIN room           r  ON s.room_id = r.id
JOIN app_user       t  ON p.trainer_user_id = t.id
LEFT JOIN trainer_profile tp ON tp.user_id = t.id;

-- 지점별 매출 통계 (v1의 통계 쿼리를 뷰로 고정)
CREATE OR REPLACE VIEW v_place_revenue AS
SELECT
  pl.id   AS place_id,
  pl.name AS place_name,
  COUNT(DISTINCT ms.member_user_id) AS member_count,
  COUNT(pay.id)                     AS payment_count,
  COALESCE(SUM(pay.amount), 0)      AS total_paid,
  COALESCE(SUM(rf.amount), 0)       AS total_refunded,
  COALESCE(SUM(pay.amount), 0) - COALESCE(SUM(rf.amount), 0) AS net_revenue
FROM place pl
LEFT JOIN membership ms ON ms.place_id = pl.id
LEFT JOIN payment pay   ON pay.membership_id = ms.id AND pay.status = 'PAID'
LEFT JOIN refund rf     ON rf.payment_id = pay.id AND rf.status = 'COMPLETED'
GROUP BY pl.id, pl.name;
