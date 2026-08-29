-- =====================================================================
-- 데이터 초기화.
-- 스키마와 계정 권한은 그대로 두고 행만 비운다.
-- (DROP DATABASE를 쓰면 gymkkong 계정의 권한까지 사라지고,
--  애플리케이션이 잡고 있는 커넥션이 끊긴다.)
--
-- 실행 후에는 반드시 02_seed.sql을 이어서 실행해야 한다.
-- =====================================================================
USE gymkkong_v2;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE reservation;
TRUNCATE TABLE refund;
TRUNCATE TABLE payment;
TRUNCATE TABLE membership;
TRUNCATE TABLE membership_plan;
TRUNCATE TABLE class_session;
TRUNCATE TABLE class_program;
TRUNCATE TABLE comment;
TRUNCATE TABLE post;
TRUNCATE TABLE attachment;
TRUNCATE TABLE notification;
TRUNCATE TABLE device_token;
TRUNCATE TABLE favorite_place;
TRUNCATE TABLE terms_agreement;
TRUNCATE TABLE refresh_token;
TRUNCATE TABLE verification_code;
TRUNCATE TABLE place_trainer;
TRUNCATE TABLE place_admin;
TRUNCATE TABLE room;
TRUNCATE TABLE place;
TRUNCATE TABLE trainer_profile;
TRUNCATE TABLE member_profile;
TRUNCATE TABLE app_user;

SET FOREIGN_KEY_CHECKS = 1;
