-- 데이터베이스 생성
CREATE DATABASE gymkkong;
USE gymkkong;

-- 회원
CREATE TABLE member (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL ,
  phone_num VARCHAR(255),
  age VARCHAR(255),
  gender ENUM('m','f'),
  grade ENUM('BRONZE','GOLD','DIAMOND'),
  status ENUM('ACTIVE','INACTTIVE') NOT NULL DEFAULT 'ACTIVE'
);

-- 지점
CREATE TABLE place (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL
);

-- 트레이너
CREATE TABLE trainer (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone_num VARCHAR(255),
  status ENUM('ACTIVE','INACTTIVE') NOT NULL DEFAULT 'ACTIVE'
);

-- 강습실
CREATE TABLE room (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT NOT NULL,
  room_num INT NOT NULL,
  FOREIGN KEY (place_id) REFERENCES place(id)
);

-- 강의 (수업)
CREATE TABLE class (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  trainer_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  start_time DATETIME NOT NULL,
  capacity INT NOT NULL,
  FOREIGN KEY (trainer_id) REFERENCES trainer(id),
  FOREIGN KEY (room_id) REFERENCES room(id)
);

-- 출석
CREATE TABLE attendance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  status ENUM('Y','N') DEFAULT 'N',
  FOREIGN KEY (class_id) REFERENCES class(id),
  FOREIGN KEY (member_id) REFERENCES member(id)
);

-- 이용권 옵션
CREATE TABLE membership_option (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_id BIGINT NOT NULL,
  place_id BIGINT NOT NULL,
  count INT NOT NULL,
  price INT NOT NULL,
  FOREIGN KEY (class_id) REFERENCES class(id),
  FOREIGN KEY (place_id) REFERENCES place(id)
);

-- 이용권 (회원 구매)
CREATE TABLE membership (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  membership_option_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  refund_YN ENUM('Y','N') DEFAULT 'N',
  remain_count INT NOT NULL,
  FOREIGN KEY (membership_option_id) REFERENCES membership_option(id),
  FOREIGN KEY (member_id) REFERENCES member(id)
);

-- 결제
CREATE TABLE payment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  membership_id BIGINT NOT NULL,
  pay_price BIGINT NOT NULL,
  pay_day DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (membership_id) REFERENCES membership(id)
);

-- 환불
CREATE TABLE refund (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payment_id BIGINT NOT NULL,
  refund_price BIGINT NOT NULL,
  refund_day DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (payment_id) REFERENCES payment(id)
);

-- 지점-트레이너 관계
CREATE TABLE place_trainer (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT NOT NULL,
  trainer_id BIGINT NOT NULL,
  status ENUM('ACTIVE','INACTTIVE') NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY (place_id) REFERENCES place(id),
  FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);

-- 룸 예약
CREATE TABLE room_reserve (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_trainer_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  start_time DATETIME NOT NULL,
  FOREIGN KEY (place_trainer_id) REFERENCES place_trainer(id),
  FOREIGN KEY (room_id) REFERENCES room(id)
);

-- 게시글
CREATE TABLE post (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_trainer_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  contents VARCHAR(255) NOT NULL,
  post_date DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (place_trainer_id) REFERENCES place_trainer(id)
);

-- 댓글
CREATE TABLE comment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  contents VARCHAR(255) NOT NULL,
  comment_date DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (post_id) REFERENCES post(id),
  FOREIGN KEY (member_id) REFERENCES member(id)
);

-- 관리자
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  type ENUM('admin','super_admin') DEFAULT 'admin'
);
