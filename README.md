## 팀 소개

| 이지연 | 정명진 | 황주완 |
| --- | --- | --- |
| <img src="src/assets/img/jy_profile_img.png" alt="이지연" width="120" /> | <img src="src/assets/img/mj_profile_img.png" alt="정명진" width="120" /> | <img src="src/assets/img/jw_profile_img.png" alt="황주완" width="120" /> |


***

## 프로젝트 개요

<img src="src/assets/img/gymkkong_img.png" alt='짐꽁' height="360" />  <br/>
피트니스 센터의 지점, 회원, 트레이너 정보를 통합 관리하는 <b>수업 예약·출석·결제 관리 시스템</b>입니다.<br/>
회원·트레이너·관리자(지점 담당자)가 하나의 플랫폼에서 예약, 출석, 결제·환불, 커뮤니케이션을 편리하게 처리할 수 있도록 돕는 것을 목표로 합니다.

***
## 스택
<p>
<img src="https://img.shields.io/badge/mariaDB-003545?style=for-the-badge&logo=mariaDB&logoColor=white">
<img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
<img src="https://img.shields.io/badge/visualstudiocode-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white">
<img src="https://img.shields.io/badge/git-F05032?style=for-the-badge&logo=git&logoColor=white">
<img src="https://img.shields.io/badge/github-181717?style=for-the-badge&logo=github&logoColor=white">
<img src="https://img.shields.io/badge/notion-000000?style=for-the-badge&logo=notion&logoColor=white">
<img src="https://img.shields.io/badge/discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">
</p>

***

## 주요 기능 및 목표

- 피트니스 센터의 <b>지점·회원·트레이너 데이터를 한 번에 관리</b>할 수 있는 통합 플랫폼 구축
- 예약, 출석, 결제·환불, 커뮤니케이션까지 <b>운영 전 과정을 온라인으로 전환</b>하여 업무 효율 상승
- 실제 오프라인 센터 환경에서도 바로 사용할 수 있을 수준의 <b>실무 친화적인 시스템</b> 구현

### 회원(Member)

- 지점을 선택해 수강권(이용권)을 구매하고, 보유 수강권의<b>잔여 횟수 및 유효기간을 조회</b>할 수 있습니다.  
- 개인 일정에 맞춰 <b>수업을 예약·취소</b>하고, 출석 이력을 확인할 수 있습니다.  
- 지점 게시판과 댓글을 통해 트레이너와 소통하며, <b>이메일·휴대폰 인증 기반의 로그인, 계정 찾기, 비밀번호 변경</b> 기능을 제공합니다.

### 트레이너(Trainer)

- 소속 지점을 기준으로 <b>개인 또는 그룹 강습을 개설</b>하고, 강습별 <b>예약 현황과 진행 상태를 한눈에 조회</b>할 수 있습니다.  
- 출석 체크를 통해 회원 출석을 관리하고, <b>게시판 글·댓글 작성으로 지점 회원들과 소통</b>할 수 있습니다.  
- 트레이너 전용 <b>계정 관리(가입, 프로필 수정, 비밀번호 변경, 탈퇴)</b> 기능을 지원합니다.

### 관리자 / 지점(Admin / Branch)

- 지점, 강습실, 트레이너, 회원 정보를 <b>통합 관리</b>하며, 지점별 <b>강습, 예약, 결제·환불 이력</b>을 조회할 수 있습니다.  
- 트레이너 소속 승인, 지점별 게시판 관리, 수강권 상품 및 할인 정책 설정 등 <b>지점 운영 전반을 제어</b>합니다.  
- 통계를 통해 지점별 이용 현황을 파악하고, 운영 전략 수립에 참고할 수 있습니다.

***

## 프로젝트 산출물

- <a href="https://docs.google.com/spreadsheets/d/1NEbiscCO2ZXA2BI60zutTN66JqbDQYSuLrj9P9V-RkM/edit?gid=1452561464#gid=1452561464">🔗 [요구사항 정의서 및 WBS URL]</a>
- <a href="https://www.erdcloud.com/d/p7SArbyYRbxc2d88M">🔗 [ERD cloud URL]</a>

### 요구사항 정의서
<img src="src/assets/img/api.jpg" alt='요구사항 정의서' />

### WBS
<img src="src/assets/img/WBS.jpg" alt='WBS' />

### ERD
<img src="src/assets/img/erd.png" alt='ERD' />

***

## 데이터베이스 아키텍쳐

### 데이터베이스 구축(DDL)
<details>
<summary>📋 0. DATABASE 초기 설정</summary>

```
CREATE DATABASE gymkkong;
USE gymkkong;
```
</details>

<details>
<summary>👥 1. 계정 관련 테이블 (회원/트레이너/관리자)</summary>

```sql
-- 회원
CREATE TABLE member (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone_num VARCHAR(255),
  age VARCHAR(255),
  gender ENUM('m','f'),
  grade ENUM('BRONZE','GOLD','DIAMOND'),
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
);

-- 트레이너
CREATE TABLE trainer (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone_num VARCHAR(255),
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'
);

-- 관리자
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  type ENUM('admin','super_admin') DEFAULT 'admin'
);
```
</details>

<details>
<summary>🏪 2. 지점 및 시설 관리</summary>

```sql
-- 지점
CREATE TABLE place (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL
);

-- 강습실
CREATE TABLE room (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT NOT NULL,
  room_num INT NOT NULL,
  FOREIGN KEY (place_id) REFERENCES place(id)
);

-- 지점-트레이너 관계
CREATE TABLE place_trainer (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT NOT NULL,
  trainer_id BIGINT NOT NULL,
  status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY (place_id) REFERENCES place(id),
  FOREIGN KEY (trainer_id) REFERENCES trainer(id)
);
```
</details>

<details>
<summary>📚 3. 강습 및 예약 관리</summary>

```sql
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

-- 강의 예약
CREATE TABLE class_reservation (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancel_YN ENUM('Y','N') DEFAULT 'N',
  FOREIGN KEY (class_id) REFERENCES class(id),
  FOREIGN KEY (member_id) REFERENCES member(id)
);

-- 출석
CREATE TABLE attendance (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  class_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  status ENUM('Y','N') DEFAULT 'N',
  CONSTRAINT uq_attendance_class_member UNIQUE (class_id, member_id),
  FOREIGN KEY (class_id) REFERENCES class(id),
  FOREIGN KEY (member_id) REFERENCES member(id)
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
```
</details>

<details>
<summary>💳 4. 이용권 및 결제관리</summary>

```sql
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
```
</details>

<details>
<summary>💬 5. 커뮤니티 (게시글/댓글)</summary>

```sql
-- 게시글
CREATE TABLE post (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  place_trainer_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  contents TEXT NOT NULL,
  post_date DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (place_trainer_id) REFERENCES place_trainer(id)
);

-- 댓글
CREATE TABLE comment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  contents TEXT NOT NULL,
  comment_date DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (post_id) REFERENCES post(id),
  FOREIGN KEY (member_id) REFERENCES member(id)
);
```
</details>

### 샘플테이터 삽입

<details>
<summary>기본 데이터 (회원/지점/트레이너/관리자)</summary>

```sql
-- 회원
INSERT INTO member (name, email, phone_num, age, gender, grade) VALUES
('김철수', 'kim.scs@email.com', '010-1234-5678', '28', 'm', 'GOLD'),
('이영희', 'lee.y2h@email.com', '010-2345-6789', '32', 'f', 'DIAMOND'),
('박민수', 'park.m3s@email.com', '010-3456-7890', '25', 'm', 'BRONZE');

-- 지점
INSERT INTO place (name, address) VALUES
('짐꽁 강남점', '서울시 강남구 테헤란로 123'),
('짐꽁 홍대점', '서울시 마포구 양화로 456'),
('짐꽁 잠실점', '서울시 송파구 올림픽로 789');

-- 트레이너
INSERT INTO trainer (name, email, phone_num) VALUES
('최트레이너', 'choia.trainer@gymkkong.com', '010-1111-2222'),
('정코치', 'juang.coach@gymkkong.com', '010-3333-4444'),
('한선생', 'hana.teacher@gymkkong.com', '010-5555-6666');

-- 관리자
INSERT INTO admin (name, email, password, type) VALUES
('최관리자', 'admin.choi@gymkkong.com', 'hashed_password_123', 'super_admin'),
('김매니저', 'manager.kim@gymkkong.com', 'hashed_password_456', 'admin'),
('이스태프', 'staff.lee@gymkkong.com', 'hashed_password_789', 'admin');
```
</details>

<details>
<summary>시설 및 관계 데이터 (룸/place_trainer)</summary>

```sql
-- 강습실
INSERT INTO room (place_id, room_num) VALUES
(1, 101), (1, 102), (2, 201);

-- 지점-트레이너 관계
INSERT INTO place_trainer (place_id, trainer_id, status) VALUES
(1, 1, 'ACTIVE'), (1, 2, 'ACTIVE'), (2, 3, 'ACTIVE');
```
</details>

<details>
<summary>강습 및 예약 데이터</summary>

```sql
-- 강습
INSERT INTO class (trainer_id, room_id, class_name, start_time, capacity) VALUES
(1, 1, '아침 요가 클래스', '2024-12-05 07:00:00', 15),
(2, 2, '근력 운동 클래스', '2024-12-05 19:00:00', 10),
(3, 3, '필라테스 클래스', '2024-12-05 10:00:00', 12);

-- 출석
INSERT INTO attendance (class_id, member_id, status) VALUES
(1, 1, 'Y'), (1, 2, 'Y'), (2, 3, 'N');

-- 룸 예약
INSERT INTO room_reserve (place_trainer_id, room_id, start_time) VALUES
(1, 1, '2024-12-06 08:00:00'),
(2, 2, '2024-12-06 18:00:00'),
(3, 3, '2024-12-06 11:00:00');
```
</details>

<details>
<summary>이용권 및 결제 데이터</summary>

```sql
-- 이용권 옵션
INSERT INTO membership_option (class_id, place_id, count, price) VALUES
(1, 1, 10, 150000), (2, 1, 20, 280000), (3, 2, 15, 200000);

-- 이용권 (회원 구매)
INSERT INTO membership (membership_option_id, member_id, refund_YN, remain_count) VALUES
(1, 1, 'N', 8), (2, 2, 'N', 20), (3, 3, 'N', 12);

-- 결제
INSERT INTO payment (membership_id, pay_price, pay_day) VALUES
(1, 150000, '2024-11-01 14:30:00'),
(2, 280000, '2024-11-05 16:20:00'),
(3, 200000, '2024-11-10 11:00:00');

-- 환불
INSERT INTO refund (payment_id, refund_price, refund_day) VALUES
(1, 50000, '2024-11-15 10:00:00'),
(2, 100000, '2024-11-20 15:30:00'),
(3, 80000, '2024-11-25 13:45:00');
```
</details>

<details>
<summary>커뮤니티 데이터 (게시글/댓글)</summary>

```sql
-- 게시글
INSERT INTO post (place_trainer_id, title, contents, post_date) VALUES
(1, '새로운 요가 프로그램 안내', '12월부터 새로운 요가 프로그램이 시작됩니다!', '2024-11-28 09:00:00'),
(2, '연말 특별 이벤트', '12월 한달간 특별 할인 이벤트를 진행합니다.', '2024-11-29 10:30:00'),
(3, '필라테스 입문 가이드', '필라테스 초보자를 위한 안내 글입니다.', '2024-11-30 14:00:00');

-- 댓글 (comment 테이블명 통일)
INSERT INTO comment (post_id, member_id, contents, comment_date) VALUES
(1, 1, '요가 프로그램 기대됩니다!', '2024-11-28 10:00:00'),
(2, 2, '할인 이벤트 감사합니다~', '2024-11-29 11:00:00'),
(3, 3, '필라테스 처음인데 도움 많이 됐어요', '2024-11-30 15:00:00');
```
</details>

### 테스트 케이스 실행
<details>
<summary>시스템 통합 SQL 스크립트 ([TEST] 테스트쿼리 | [PROC] 프로시저 | [VIEW] 뷰 | [SELECT] 조회쿼리 | [INSERT] 삽입쿼리 )</summary>

```sql
-- [회원 기능] ========================================
-- [TEST] 회원 비밀번호 변경 : 이메일 인증 후 비밀번호 변경 (SELECT+UPDATE)
-- SELECT직후 UPDATE하는 수 ms안에 같은 비밀번호에 접근하는 경우 거의 없음
SELECT *
FROM member
WHERE email = 'lee.y2h@email.com';

UPDATE member
SET password = 'trewq'
WHERE email = 'lee.y2h@email.com';

-- [TEST] 회원 탈퇴 : email로 회원 조회 -> 회원 상태를 '탈퇴'로 변경 (SELECT+UPDATE)
SELECT *
FROM member
WHERE email = 'lee.y2h@email.com';

UPDATE member
SET member.status = 'N'
WHERE email = 'lee.y2h@email.com';

-- [TEST] 회원 계정 찾기 : 사용자 휴대폰번호 인증 후 이메일/임시 비밀번호 발급 (트랜잭션)
START TRANSACTION;
SELECT id, email
FROM member
WHERE phone_num = '010-2345-6789'
  AND status = 'Y' FOR UPDATE;                 -- 해당 회원 lock걸고 진행

UPDATE member
SET password = '프로그램에서 hash한 임시 비밀번호'
WHERE phone_num = '010-2345-6789'
  AND status = 'Y';                             -- 임시 비밀번호 업데이트
COMMIT;

-- [SELECT] 회원 지점 선택 : 검색어 또는 주소 필터를 적용한 지점 목록 조회
SELECT id, name, address
FROM place
WHERE name LIKE '%짐꽁%'
  AND address LIKE '%강남%';

-- [TEST] 회원 수강권 구매 : 선택한 지점의 수강권(10회권, 30회권 등) 구매 (트랜잭션)
SELECT id, count, price
FROM membership_option
WHERE place_id = 1;                               -- 지점의 회원권 옵션 조회

START TRANSACTION;
SELECT id, count, price
FROM membership_option
WHERE id = 2
  AND place_id = 1 FOR UPDATE;                    -- 선택한 수강권 조회

INSERT INTO membership (membership_option_id, member_id, refund_YN, remain_count)
VALUES (2, 2, 'N', (SELECT count FROM membership_option WHERE id = 2));  -- 회원에게 membership 발급

INSERT INTO payment (membership_id, pay_price)
VALUES (LAST_INSERT_ID(), (SELECT price FROM membership_option WHERE id = 2)); -- 최근 추가된 membership id의 결제 내역 저장
COMMIT;

-- [SELECT] 회원 수강권 상태 조회 : 보유 수강권의 잔여 횟수, 지점 정보 조회 및 "환불" 버튼 노출
SELECT m.id            AS 멤버쉽ID,
       mo.count        AS 횟수권,
       m.remain_count  AS 잔여횟수권,
       m.refund_YN,
       p.name          AS 지점명,
       p.address       AS 지점주소,
       CASE                                      -- 환불 조건이 변할 경우 프로시저 매번 수정해야함
           WHEN m.refund_YN = 'N'               -- 환불 되지 않았고
                AND m.remain_count > 0          -- 잔여 횟수가 남은 경우
                THEN 'Y'                        -- 환불 가능
           ELSE 'N'                             -- 환불 불가
       END        AS refund_button_show         -- 환불 버튼 출력
FROM membership m
     INNER JOIN membership_option mo ON mo.id = m.membership_option_id
     INNER JOIN place p ON p.id = mo.place_id
WHERE m.member_id = 2;

-- [PROC] 회원 수강권 환불 : 환불 정책(잔여 상태, 사용 이력 등)에 따른 환불 절차 처리
DELIMITER //

CREATE PROCEDURE sp_회원_수강권_환불(
    IN p_membership_id BIGINT,                   -- 멤버쉽ID, 회원ID 매개변수로 받음
    IN p_member_id BIGINT
)
BEGIN
    DECLARE v_payment_id BIGINT;
    DECLARE v_pay_price BIGINT;                  -- 결제 ID, 결제 금액 변수 생성
    
    START TRANSACTION;
    SELECT p.id, p.pay_price
    INTO v_payment_id, v_pay_price               -- 변수에 각 값 할당
    FROM membership m
         INNER JOIN payment p ON p.membership_id = m.id
    WHERE m.id = p_membership_id                 -- 멤버쉽ID가 매개변수로 받은 멤버쉽ID이고
      AND m.member_id = p_member_id              -- 회원ID가 매개변수로 받은 회원ID이고
      AND m.refund_YN = 'N'                      -- 환불 되지 않았고
      AND m.remain_count > 0                     -- 잔여 횟수가 남아 있는 경우
        FOR UPDATE;                              -- lock 걸음 (환불 요청이 동시에 들어올 경우 문제 발생 여지 있음)
    
    INSERT INTO refund(payment_id, refund_price) -- 환불테이블에 매개변수(멤버쉽ID, 가격) 추가
    VALUES (v_payment_id, v_pay_price);
    
    UPDATE membership                            -- 멤버쉽의 환불 여부 Yes로 수정 및 잔여 횟수 0회로 수정
    SET refund_YN     = 'Y',
        remain_count  = 0
    WHERE id = p_membership_id;
    
    COMMIT;
END//
DELIMITER ;

-- [PROC] 회원 예약 내역 조회 : 예약 가능한 수업 목록 조회 후 강좌 선택 및 예약
DELIMITER //
CREATE PROCEDURE sp_회원_예약_내역_조회(
    IN p_place_id BIGINT
)
BEGIN
    SELECT c.id                       AS 수업ID,
           c.class_name               AS 수업이름,
           c.start_time               AS 시작시간,
           c.capacity                 AS 수업정원,
           (SELECT COUNT(*)
            FROM class_reservation r
            WHERE r.class_id = c.id                  -- 예약된 수업ID가 수업ID인 경우
              AND r.cancel_YN = 'N') AS reserved_count, -- 취소되지 않은 경우
           t.name                     AS trainer_name,   -- 수업을 개설한 트레이너 이름
           r2.room_num                             -- 강습실 번호
    FROM class c
         INNER JOIN room r2 ON c.room_id = r2.id
         INNER JOIN place p ON r2.place_id = p.id
         INNER JOIN trainer t ON c.trainer_id = t.id
    WHERE p.id = p_place_id                          -- 지점ID=매개변수로 입력받은 값
      AND c.start_time > NOW()                       -- 시작 시간이 현재보다 큰 경우
      AND c.capacity >
         (SELECT COUNT(*)
          FROM class_reservation r
          WHERE r.class_id = c.id
            AND r.cancel_YN = 'N')                    -- 예약된 수업이 수업ID와 같고 취소 여부가 NO인 경우
    ORDER BY c.start_time ASC;                       -- 시간 순 정렬
END //
DELIMITER ;

-- [SELECT] 회원 예약 취소를 위한 조회
SELECT r.id          AS 예약ID,
       c.class_name  AS 수업명,
       c.start_time  AS 시작시간,
       t.name        AS 트레이너명,                 -- 예약조회
       p.name        AS 지점명,
       r.cancel_YN   AS 취소여부
FROM class_reservation r
     INNER JOIN class c ON r.class_id = c.id
     INNER JOIN room rm ON c.room_id = rm.id
     INNER JOIN place p ON rm.place_id = p.id
     INNER JOIN trainer t ON c.trainer_id = t.id
WHERE r.member_id = 1                             -- 특정 회원
  AND r.cancel_YN = 'N'                           -- 취소되지 않은 예약만
ORDER BY c.start_time;

-- [PROC] 회원 예약 취소 : 예약 내역 중 선택하여 수업 예약 취소
DELIMITER //

CREATE PROCEDURE sp_회원_예약_취소(
    IN p_reservation_id BIGINT,
    IN p_member_id BIGINT                          -- 수업 예약 취소
)
BEGIN
    DECLARE v_start_time DATETIME;
    
    START TRANSACTION;
    SELECT c.start_time
    INTO v_start_time
    FROM class_reservation r
         INNER JOIN class c ON r.class_id = c.id
    WHERE r.id = p_reservation_id                  --  수업이 존재하는지
      AND r.member_id = p_member_id                --  본인의 예약인지
      AND r.cancel_YN = 'N'                        --  아직 취소 안 됐는지
        FOR UPDATE;
    
    IF v_start_time IS NULL THEN
        SIGNAL SQLSTATE '45000'                     -- 예약이 없으면 취소 불가
            SET MESSAGE_TEXT = '취소할 수 있는 예약이 존재하지 않습니다.';
    END IF;
    
    IF v_start_time <= NOW() THEN
        SIGNAL SQLSTATE '45000'                     -- 이미 시작한 수업이면 취소 불가
            SET MESSAGE_TEXT = '이미 시작한 수업은 취소할 수 없습니다.';
    END IF;
    
    UPDATE class_reservation
    SET cancel_YN = 'Y'
    WHERE id = p_reservation_id;                   -- 예약 취소 처리
    
    COMMIT;
END //
DELIMITER ;

-- [PROC] 회원 예약 내역 조회 : 출석 전 상태의 예약 목록 확인 (날짜, 강습실, 트레이너 정보 포함)
DELIMITER //
CREATE PROCEDURE sp_회원_예약_내역_조회 (
    IN p_member_id BIGINT
)
BEGIN
    SELECT
        a.id         AS attendance_id,   -- 예약/출석 레코드 PK
        c.id         AS class_id,
        c.class_name,
        c.start_time,
        r.room_num,
        pl.name      AS place_name,      -- 강습실이 속한 지점
        t.name       AS trainer_name,
        a.status     AS attendance_status
    FROM attendance a
    JOIN class    c   ON a.class_id = c.id
    JOIN room     r   ON c.room_id = r.id
    JOIN place    pl  ON r.place_id = pl.id
    JOIN trainer  t   ON c.trainer_id = t.id
    WHERE a.member_id = p_member_id
      AND a.status     = 'N'            -- 아직 출석 처리 전
      AND c.start_time > NOW()          -- 수업 시작 전
    ORDER BY c.start_time;
END //
DELIMITER ;

-- [PROC] 회원 지점별 게시판 조회 : 선택한 지점(수강권 등록된 지점)의 게시글 목록 조회
DELIMITER //
CREATE PROCEDURE sp_회원_지점별_게시판_조회(
    IN p_지점명 VARCHAR(255) CHARACTER SET utf8mb4
)
BEGIN
    SELECT
        p.id AS 게시글번호,
        pl.name AS 지점명,
        t.name AS 트레이너명,
        p.title AS 제목,
        p.contents AS 내용,
        p.post_date AS 작성일,
        (SELECT COUNT(*) FROM comment c WHERE c.post_id = p.id) AS 댓글수
    FROM post p
    JOIN place_trainer pt ON p.place_trainer_id = pt.id
    JOIN place pl ON pt.place_id = pl.id
    JOIN trainer t ON pt.trainer_id = t.id
    WHERE pt.status = 'ACTIVE'
      AND pl.name LIKE CONCAT('%', p_지점명, '%')
    ORDER BY p.post_date DESC;
END //
DELIMITER ;

-- [VIEW] 공통 게시글별 댓글 목록 조회
CREATE VIEW v_게시글별_댓글_목록조회 AS
SELECT 
    c.id,
    c.post_id,
    p.title AS post_title,
    m.name AS member_name,
    c.contents,
    c.comment_date
FROM comment c
JOIN post p ON c.post_id = p.id
JOIN member m ON c.member_id = m.id;

-- [PROC] 회원 게시판 댓글 등록 : 게시글별 댓글 목록 조회 및 댓글 등록
DELIMITER //
CREATE PROCEDURE sp_회원_게시판_댓글등록(
    IN p_post_id BIGINT,
    IN p_member_id BIGINT,
    IN p_contents VARCHAR(255)
)
BEGIN
    INSERT INTO comment (post_id, member_id, contents) 
    VALUES (p_post_id, p_member_id, p_contents);
END //
DELIMITER ;

-- [트레이너 기능] ======================================
-- [PROC] 트레이너 비밀번호 변경 : 이메일 인증 후 비밀번호 변경
DELIMITER //
CREATE PROCEDURE sp_트레이너_비밀번호_변경(
    IN p_email VARCHAR(255),
    IN p_new_password VARCHAR(255)
)
BEGIN
    DECLARE trainer_count INT DEFAULT 0;

    SELECT COUNT(*) INTO trainer_count FROM trainer WHERE email = p_email;

    IF trainer_count = 1 THEN
        UPDATE trainer SET password = p_new_password WHERE email = p_email;
        SELECT '비밀번호 변경 성공' AS result;
    ELSE
        SELECT '일치하는 회원이 없습니다' AS result;
    END IF;
END //
DELIMITER ;

-- [PROC] 트레이너 탈퇴 : 이메일로 조회 후 상태를 "탈퇴"로 수정
DELIMITER //
CREATE PROCEDURE sp_트레이너_탈퇴(
    IN p_email VARCHAR(255)
)
BEGIN
    UPDATE trainer t
    JOIN place_trainer pt ON t.id = pt.trainer_id
    SET pt.status = 'INACTIVE'
    WHERE t.email = p_email;
    
    SELECT ROW_COUNT() AS affected_rows, '트레이너 탈퇴 처리 완료' AS result;
END //
DELIMITER ;

-- [PROC] 트레이너 계정찾기 : 휴대폰번호 인증 후 이메일/임시 비밀번호 발급
DELIMITER //
CREATE PROCEDURE sp_트레이너_계정찾기(
    IN  p_phone_num      VARCHAR(255),
    OUT p_email          VARCHAR(255),
    OUT p_temp_password  VARCHAR(20)
)
BEGIN
    DECLARE temp_pwd VARCHAR(20);

    -- 1) 기본값 초기화 (혹시 이전 CALL 값이 남아 있는 경우 대비)
    SET p_email          = NULL;
    SET p_temp_password  = NULL;

    -- 2) 활성(Y) 회원 중 휴대폰번호로 이메일 조회
    SELECT t.email
      INTO p_email
    FROM trainer t
    WHERE t.phone_num = p_phone_num
      AND t.status     = 'ACTIVE'
    LIMIT 1;

    -- 3) 계정이 있으면 임시비밀번호 생성 + 업데이트
    IF p_email IS NOT NULL THEN
        SET temp_pwd = CONCAT('tmp', LPAD(FLOOR(RAND() * 1000000), 6, '0'));

        UPDATE trainer
        SET password = temp_pwd
        WHERE phone_num = p_phone_num
          AND status    = 'ACTIVE';

        SET p_temp_password = temp_pwd;

        SELECT CONCAT('임시비밀번호: ', temp_pwd) AS message;
    ELSE
        SELECT '일치하는 계정이 없습니다' AS message;
    END IF;
END //
DELIMITER ;

-- [PROC] 트레이너 지점 등록 : 지점 검색(주소/이름 기반) 후 소속 요청 등록 (승인 필요)
DELIMITER //
CREATE PROCEDURE sp_트레이너_지점_등록(
    IN p_place_name VARCHAR(255),
    IN p_trainer_id BIGINT
)
BEGIN
    DECLARE place_id BIGINT DEFAULT NULL;

    -- 지점 검색
    SELECT id INTO place_id
    FROM place
    WHERE name LIKE CONCAT('%', p_place_name, '%');

    IF place_id IS NOT NULL THEN
        INSERT INTO place_trainer (place_id, trainer_id, status)
        VALUES (place_id, p_trainer_id, 'N'); -- 승인 대기
        SELECT '지점 소속 요청 등록 완료' AS result, place_id;
    ELSE
        SELECT '해당 지점이 존재하지 않습니다' AS result;
    END IF;
END //
DELIMITER ;

-- [PROC] 트레이너 강습 개설 : 지점 선택 후 수업 개설 (수업명, 시간, 종료시간, 정원, 유형, 강습실 선택)
DELIMITER //
CREATE PROCEDURE sp_트레이너_강습_개설(
    IN p_trainer_id BIGINT,
    IN p_room_id BIGINT,
    IN p_class_name VARCHAR(255),
    IN p_start_time DATETIME,
    IN p_capacity INT
)
BEGIN
    INSERT INTO class (trainer_id, room_id, class_name, start_time, capacity)
    VALUES (p_trainer_id, p_room_id, p_class_name, p_start_time, p_capacity);

    SELECT LAST_INSERT_ID() AS class_id, '강습 개설 완료' AS result;
END //
DELIMITER ;

-- [PROC] 트레이너 강습 정보 조회 : 자신이 개설한 강습 목록 및 상태(수업 전/진행중/종료/취소) 확인, 현재 예약 인원 표시
DELIMITER //
CREATE PROCEDURE sp_트레이너_강습_정보_조회(
    IN p_trainer_id BIGINT
)
BEGIN
    SELECT
        c.id AS class_id,
        t.name AS trainer_name,
        c.class_name,
        c.start_time,
        c.capacity,
        COUNT(a.id) AS reserved_count,
        CASE
            WHEN c.start_time > NOW() THEN '수업전'
            WHEN c.start_time <= NOW()
             AND DATE_ADD(c.start_time, INTERVAL 2 HOUR) > NOW() THEN '진행중'
            WHEN c.start_time < NOW() THEN '종료'
            ELSE '알수없음'
        END AS class_status
    FROM class c
    JOIN trainer t ON c.trainer_id = t.id
    LEFT JOIN attendance a ON c.id = a.class_id
    WHERE c.trainer_id = p_trainer_id          -- 트레이너 id 조건
    GROUP BY
        c.id, t.name, c.class_name, c.start_time, c.capacity
    ORDER BY c.start_time DESC;
END //
DELIMITER ;



-- [PROC] 트레이너 출석 관리 : 해당 강습의 예약 회원 목록 조회 후 개인별 출석 상태 등록 (회원권 차감 기능도 후행되어야함)
DELIMITER //
CREATE PROCEDURE sp_출석_관리(
    IN p_class_id  BIGINT,
    IN p_member_id BIGINT,
    IN p_status    ENUM('Y','N')
)
BEGIN
    DECLARE v_membership_id BIGINT;

    -- 1) attendance upsert (UNIQUE (class_id, member_id) 필요)
    INSERT INTO attendance (class_id, member_id, status)
    VALUES (p_class_id, p_member_id, p_status)
    ON DUPLICATE KEY UPDATE status = VALUES(status);

    -- 2) 출석 'Y'인 경우에만 이용권 차감
    IF p_status = 'Y' THEN

        -- 2-1) 해당 수업에 연결된 이용권 중, 이 회원이 가진 활성 이용권 하나 찾기
        SELECT m.id
        INTO v_membership_id
        FROM membership m
        JOIN membership_option mo ON m.membership_option_id = mo.id
        WHERE mo.class_id = p_class_id
          AND m.member_id = p_member_id
          AND m.refund_YN = 'N'
          AND m.remain_count > 0
        ORDER BY m.id
        LIMIT 1;

        -- 2-2) 찾은 경우에만 차감
        IF v_membership_id IS NOT NULL THEN
            UPDATE membership
            SET remain_count = remain_count - 1
            WHERE id = v_membership_id;
        END IF;
    END IF;

    SELECT '출석 처리 및 이용권 차감 완료' AS result;
END //
DELIMITER ;


-- [PROC] 트레이너 게시판 작성 : 등록 지점의 게시판에 글 작성
DELIMITER //
CREATE PROCEDURE sp_트레이너_게시판_작성(
    IN p_trainer_id       BIGINT,
    IN p_place_id         BIGINT,
    IN p_title            VARCHAR(255),
    IN p_contents         VARCHAR(255)
)
BEGIN
    DECLARE v_place_trainer_id BIGINT;

    -- 1) 트레이너가 해당 지점에 소속(활성)인지 확인
    SELECT pt.id
      INTO v_place_trainer_id
    FROM place_trainer pt
    WHERE pt.place_id   = p_place_id
      AND pt.trainer_id = p_trainer_id
      AND pt.status     = 'ACTIVE'
    LIMIT 1;

    -- 2) 소속이 없으면 에러 메시지
    IF v_place_trainer_id IS NULL THEN
        SELECT '해당 지점에 등록되지 않은 트레이너입니다' AS result;
    ELSE
        -- 3) 소속이 맞으면 게시글 작성
        INSERT INTO post (place_trainer_id, title, contents)
        VALUES (v_place_trainer_id, p_title, p_contents);

        SELECT LAST_INSERT_ID() AS post_id,
               '게시글 등록 완료' AS result;
    END IF;
END //
DELIMITER ;


-- [PROC] 트레이너 게시판 목록 조회 : 등록 지점의 게시판의 글 목록 조회
DELIMITER //
CREATE PROCEDURE sp_트레이너_게시판_목록_조회 (
    IN p_place_id BIGINT
)
BEGIN
    SELECT
        p.id           AS post_id,
        t.name         AS trainer_name,
        p.title,
        p.contents,
        p.post_date,
        pl.name        AS place_name
    FROM post p
    JOIN place_trainer pt ON p.place_trainer_id = pt.id
    JOIN place pl         ON pt.place_id = pl.id
    JOIN trainer t        ON pt.trainer_id = t.id
    WHERE pt.place_id = p_place_id
    ORDER BY p.post_date DESC;
END //
DELIMITER ;


-- [SELECT] 게시글 댓글 조회
SELECT 
    c.id AS comment_id,
    c.comment_contents,
    c.comment_day,
    c.place_trainer_id,
    pt.trainer_id,
    pt.place_id,
    pt.status
FROM coment c
LEFT JOIN place_trainer pt 
      ON pt.id = c.place_trainer_id
      --조회할 post_id 
WHERE c.post_id = 1  
ORDER BY c.comment_day ASC;


-- [PROC] 공통 댓글 작성 (회원/트레이너 검증 포함)
DELIMITER //

CREATE PROCEDURE sp_댓글_작성(
    IN p_content TEXT,
    IN p_member_id BIGINT,
    IN p_place_trainer_id BIGINT,
    IN p_board_id BIGINT
)
label_main: BEGIN   -- 레이블 추가됨
    DECLARE v_member_exists INT DEFAULT 0;
    DECLARE v_trainer_exists INT DEFAULT 0;

    START TRANSACTION;

    -- 1. 둘 다 NULL → 오류
    IF p_member_id IS NULL AND p_place_trainer_id IS NULL THEN
        SELECT '오류: member_id 또는 place_trainer_id 중 하나는 반드시 입력해야 합니다.' AS message;
        ROLLBACK;
        LEAVE label_main;   -- 레이블로 LEAVE
    END IF;

    -- 2. 둘 다 값 있음 → 오류
    IF p_member_id IS NOT NULL AND p_place_trainer_id IS NOT NULL THEN
        SELECT '오류: member와 trainer 둘 다 작성자가 될 수 없습니다.' AS message;
        ROLLBACK;
        LEAVE label_main;
    END IF;

    -- 3. member 검증
    IF p_member_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_member_exists
        FROM member
        WHERE id = p_member_id;

        IF v_member_exists = 0 THEN
            SELECT '오류: 존재하지 않는 member_id 입니다.' AS message;
            ROLLBACK;
            LEAVE label_main;
        END IF;
    END IF;

    -- 4. place_trainer 검증
    IF p_place_trainer_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_trainer_exists
        FROM place_trainer
        WHERE id = p_place_trainer_id;

        IF v_trainer_exists = 0 THEN
            SELECT '오류: 존재하지 않는 place_trainer_id 입니다.' AS message;
            ROLLBACK;
            LEAVE label_main;
        END IF;
    END IF;

    -- 5. 댓글 저장
    INSERT INTO coment (comment_contents, comment_day, member_id, place_trainer_id, post_id)
    VALUES (p_content, NOW(), p_member_id, p_place_trainer_id, p_board_id);

    COMMIT;
    SELECT '댓글 작성 완료' AS message;

END label_main //   --레이블 닫기

DELIMITER ;

-- [관리자 기능] ======================================
-- [PROC] 관리자 지점 삭제 : 지점명 검색 후 지점 목록에서 삭제
DELIMITER //

CREATE PROCEDURE sp_관리자_지점_삭제(IN p_name VARCHAR(255))
BEGIN
    DECLARE v_count INT;

    -- 오류 발생 시 롤백 처리
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT '삭제 실패: 오류 발생으로 롤백되었습니다.' AS message;
    END;

    -- 존재 여부 확인
    SELECT COUNT(*) INTO v_count
    FROM place
    WHERE name = p_name;

    IF v_count = 0 THEN
        SELECT '해당 지점이 존재하지 않습니다.' AS message;
    ELSE
        START TRANSACTION;
        --삭제
        DELETE FROM place
        WHERE name = p_name;

        COMMIT;
        SELECT '삭제 완료' AS message;
    END IF;
END //

DELIMITER ;

-- [지점 기능] ========================================
-- [SELECT] 모든 지점의 등록 회원 결제 내역 목록 조회
SELECT 
    pl.name AS 지점명,
    pl.address AS 지점주소,
    m.name AS 회원명,
    m.email AS 회원이메일,
    m.phone_num AS 회원연락처,
    m.grade AS 회원등급,
    c.class_name AS 강습명,
    t.name AS 트레이너명,
    mo.count AS 이용권횟수,
    mo.price AS 이용권가격,
    ms.remain_count AS 남은횟수,
    p.pay_price AS 결제금액,
    p.pay_day AS 결제일시,
    ms.refund_YN AS 환불여부
FROM payment p
JOIN membership ms ON p.membership_id = ms.id
JOIN member m ON ms.member_id = m.id
JOIN membership_option mo ON ms.membership_option_id = mo.id
JOIN place pl ON mo.place_id = pl.id
JOIN class c ON mo.class_id = c.id
JOIN trainer t ON c.trainer_id = t.id
ORDER BY pl.name, p.pay_day DESC;

-- [SELECT] 기본 지점별 회원 결제 내역 통계
SELECT
    pl.name AS 지점명,
    COUNT(DISTINCT m.id) AS 등록회원수,
    COUNT(p.id) AS 총결제건수,
    SUM(p.pay_price) AS 총결제금액,
    AVG(p.pay_price) AS 평균결제금액,
    SUM(IFNULL(r.refund_price, 0)) AS 총환불금액,
    SUM(p.pay_price - IFNULL(r.refund_price, 0)) AS 순매출
FROM place pl
JOIN membership_option mo ON pl.id = mo.place_id
JOIN membership ms ON mo.id = ms.membership_option_id
JOIN payment p ON ms.id = p.membership_id
JOIN member m ON ms.member_id = m.id
LEFT JOIN refund r ON p.id = r.payment_id
GROUP BY pl.id, pl.name
ORDER BY 순매출 DESC;

-- [SELECT] 지점 회원 조회 : 해당 지점 소속 회원 목록 조회
SELECT DISTINCT
    pl.name AS 지점명,
    m.id AS 회원ID,
    m.name AS 회원명,
    m.email AS 회원이메일,
    m.phone_num AS 회원연락처,
    m.age AS 나이,
    m.gender AS 성별,
    m.grade AS 회원등급
FROM place pl
JOIN membership_option mo ON pl.id = mo.place_id
JOIN membership ms ON mo.id = ms.membership_option_id
JOIN member m ON ms.member_id = m.id
ORDER BY pl.name, m.name;

-- [SELECT] 특정 지점 소속 회원 목록 (짐꽁 강남점)
SELECT DISTINCT
    m.id AS 회원ID,
    m.name AS 회원명,
    m.email AS 회원이메일,
    m.phone_num AS 회원연락처,
    m.age AS 나이,
    m.gender AS 성별,
    m.grade AS 회원등급,
    COUNT(ms.id) AS 보유이용권수
FROM member m
JOIN membership ms ON m.id = ms.member_id
JOIN membership_option mo ON ms.membership_option_id = mo.id
JOIN place pl ON mo.place_id = pl.id
WHERE pl.name = '짐꽁 강남점'  
GROUP BY m.id, m.name, m.email, m.phone_num, m.age, m.gender, m.grade
ORDER BY m.name;

-- [SELECT] 지점 소속 회원 상세 정보
SELECT 
    pl.name AS 지점명,
    m.name AS 회원명,
    m.email AS 회원이메일,
    m.phone_num AS 회원연락처,
    m.grade AS 회원등급,
    c.class_name AS 등록강습,
    t.name AS 트레이너,
    ms.remain_count AS 남은횟수,
    mo.count AS 총이용권횟수,
    CASE 
        WHEN ms.refund_YN = 'Y' THEN '환불완료'
        WHEN ms.remain_count = 0 THEN '이용완료'
        ELSE '이용중'
    END AS 이용권상태
FROM place pl
JOIN membership_option mo ON pl.id = mo.place_id
JOIN membership ms ON mo.id = ms.membership_option_id
JOIN member m ON ms.member_id = m.id
JOIN class c ON mo.class_id = c.id
JOIN trainer t ON c.trainer_id = t.id
ORDER BY pl.name, m.name, c.class_name;

-- [SELECT] 개설된 강습실 목록
SELECT
    pl.name AS 지점명,
    r.room_num AS 강습실번호,
    c.class_name AS 강습명,
    c.start_time AS 강습시작시간,
    t.name AS 트레이너명,
    c.capacity AS 정원,
    COUNT(a.id) AS 신청인원
FROM room r
JOIN place pl ON r.place_id = pl.id
LEFT JOIN class c ON r.id = c.room_id
LEFT JOIN trainer t ON c.trainer_id = t.id
LEFT JOIN attendance a ON c.id = a.class_id
GROUP BY pl.id, pl.name, r.id, r.room_num, c.id, c.class_name, c.start_time, t.name, c.capacity
ORDER BY pl.name, r.room_num, c.start_time;

-- [SELECT] 강습실 예약 현황
SELECT
    pl.name AS 지점명,
    r.room_num AS 강습실번호,
    rr.start_time AS 예약시간,
    t.name AS 예약트레이너,
    pt.status AS 승인상태,
    CASE
        WHEN rr.start_time > NOW() THEN '예약대기'
        WHEN rr.start_time <= NOW() THEN '진행완료'
    END AS 예약상태
FROM room r
JOIN place pl ON r.place_id = pl.id
LEFT JOIN room_reserve rr ON r.id = rr.room_id
LEFT JOIN place_trainer pt ON rr.place_trainer_id = pt.id
LEFT JOIN trainer t ON pt.trainer_id = t.id
ORDER BY pl.name, r.room_num, rr.start_time DESC;

-- [SELECT] 빈 강습실 조회
SELECT
    pl.name AS 지점명,
    r.room_num AS 강습실번호,
    '강습없음' AS 상태
FROM room r
JOIN place pl ON r.place_id = pl.id
LEFT JOIN class c ON r.id = c.room_id
WHERE c.id IS NULL
ORDER BY pl.name, r.room_num;

-- [SELECT] 기본 트레이너 목록 조회
SELECT
    t.id AS 트레이너ID,
    t.name AS 트레이너명,
    t.email AS 이메일,
    t.phone_num AS 연락처
FROM trainer t
ORDER BY t.name;

-- [SELECT] 지점 정보 포함 트레이너 목록 조회
SELECT
    t.id AS 트레이너ID,
    t.name AS 트레이너명,
    t.email AS 이메일,
    t.phone_num AS 연락처,
    GROUP_CONCAT(DISTINCT pl.name SEPARATOR ', ') AS 소속지점,
    COUNT(DISTINCT CASE WHEN pt.status = 'Y' THEN pt.place_id END) AS 활성지점수
FROM trainer t
LEFT JOIN place_trainer pt ON t.id = pt.trainer_id
LEFT JOIN place pl ON pt.place_id = pl.id
GROUP BY t.id, t.name, t.email, t.phone_num
ORDER BY t.name;

-- [SELECT] 전체 지점 리스트 조회 (Admin 관점)
SELECT id, name, address
FROM place;

-- [PROC] 지점 트레이너 삭제 : 트레이너 이메일로 조회 후 제외 (기본 버전)
DELIMITER //

CREATE PROCEDURE sp_지점_트레이너_삭제1(
    IN p_email VARCHAR(255)
)
BEGIN
    -- 제외할 트레이너 정보 조회
    SELECT
        t.id AS 제외트레이너ID,
        t.name AS 제외트레이너명,
        t.email AS 이메일
    FROM trainer t
    WHERE t.email = p_email;

    -- 해당 트레이너를 제외한 나머지 트레이너 목록 조회
    SELECT
        t.id AS 트레이너ID,
        t.name AS 트레이너명,
        t.email AS 이메일,
        t.phone_num AS 연락처
    FROM trainer t
    WHERE t.email != p_email
    ORDER BY t.name;
END //

DELIMITER ;

-- [PROC] 지점 트레이너 삭제 :트레이너 이메일 조회 후 트레이너 삭제 (트랜잭션 버전)
DELIMITER //

CREATE PROCEDURE sp_지점_트레이너_삭제2 (
    IN p_email VARCHAR(255)
)
BEGIN
    DECLARE v_trainer_id BIGINT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT '트랜잭션 실패: 롤백되었습니다.' AS 결과;
    END;

    START TRANSACTION;

    -- 트레이너 ID 조회
    SELECT id INTO v_trainer_id
    FROM trainer
    WHERE email = p_email
    LIMIT 1;

    IF v_trainer_id IS NOT NULL THEN
        -- 해당 트레이너의 지점 연결 비활성화
        UPDATE place_trainer
        SET status = 'N'
        WHERE trainer_id = v_trainer_id;

        -- 제외된 트레이너 정보
        SELECT
            t.id AS 비활성화트레이너ID,
            t.name AS 트레이너명,
            t.email AS 이메일
           FROM trainer t
        WHERE t.id = v_trainer_id;

        COMMIT;
    ELSE
        SELECT '해당 이메일의 트레이너를 찾을 수 없습니다.' AS 결과;
        ROLLBACK;
    END IF;

    -- 활성화된 트레이너 목록
    SELECT
        t.id AS 트레이너ID,
        t.name AS 트레이너명,
        t.email AS 이메일,
        t.phone_num AS 연락처,
        pt.status as 상태,
        COUNT(DISTINCT CASE WHEN pt.status = 'Y' THEN pt.place_id END) AS 활성지점수
    FROM trainer t
    LEFT JOIN place_trainer pt ON t.id = pt.trainer_id
    WHERE t.email != p_email
    GROUP BY t.id, t.name, t.email, t.phone_num
    ORDER BY t.name;
END //

DELIMITER ;

-- [PROC] 지점 강습실 등록 : 지점 내 신규 강습실 등록 (이름, 수용인원 등)
-- 강습 생성 (시간 충돌 체크 + 트랜잭션)
DELIMITER //

CREATE PROCEDURE sp_지점_강습실_등록(
    IN p_trainer_id BIGINT,
    IN p_room_id BIGINT,
    IN p_class_name VARCHAR(255),
    IN p_start_time DATETIME,
    IN p_capacity INT
)
BEGIN
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE v_class_id BIGINT;

    -- 에러 발생 시 롤백 처리
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT '예약 실패: 오류 발생으로 롤백되었습니다.' AS message;
    END;

    -- 기존 예약 시간과 1시간 겹침 여부 확인
    SELECT COUNT(*) INTO v_conflict_count
    FROM class
    WHERE room_id = p_room_id
      AND (
            p_start_time BETWEEN start_time AND DATE_ADD(start_time, INTERVAL 1 HOUR)
         OR start_time BETWEEN p_start_time AND DATE_ADD(p_start_time, INTERVAL 1 HOUR)
      );

    IF v_conflict_count > 0 THEN
        SELECT '예약 불가: 기존 예약과 시간이 겹칩니다.' AS message;
    ELSE
        START TRANSACTION;

        -- 강습 생성
        INSERT INTO class(trainer_id, room_id, class_name, start_time, capacity)
        VALUES (p_trainer_id, p_room_id, p_class_name, p_start_time, p_capacity);

        SET v_class_id = LAST_INSERT_ID();

        -- attendance 테이블 insert
        INSERT INTO attendance(class_id, member_id, status)
        SELECT v_class_id, id, 'N'
        FROM member;

        COMMIT;

        SELECT '예약 완료' AS message, v_class_id AS created_class_id;
    END IF;

END //

DELIMITER ;


-- [06.결제환불관리] ======================================
-- [SELECT] 지점 회원 조회 : 지점별 전체 강습 목록 조회 (강습실, 트레이너, 참가 회원 정보 포함)
-- 참가 회원이 없는 강습도 조회하려면 attendance와 member를 LEFT JOIN으로 변경
SELECT
    p.name AS 지점명,
    p.address AS 지점주소,
    r.room_num AS 강습실번호,
    c.class_name AS 강습명,
    c.start_time AS 강습시작시간,
    c.capacity AS 정원,
    t.name AS 트레이너명,
    t.phone_num AS 트레이너연락처,
    m.name AS 참가회원명,
    m.email AS 회원이메일,
    m.grade AS 회원등급,
    a.status AS 출석여부
FROM class c
JOIN room r ON c.room_id = r.id
JOIN place p ON r.place_id = p.id
JOIN trainer t ON c.trainer_id = t.id
JOIN attendance a ON c.id = a.class_id
JOIN member m ON a.member_id = m.id
ORDER BY p.name, c.start_time;

-- [SELECT] 지점 결제 관리 : 결제 목록 기반 환불 이력 및 환불 로그 조회 (기본)
SELECT
    p.id AS 결제ID,
    m.name AS 회원명,
    m.email AS 회원이메일,
    mo.count AS 이용권횟수,
    mo.price AS 이용권가격,
    p.pay_price AS 결제금액,
    p.pay_day AS 결제일시,
    r.id AS 환불ID,
    r.refund_price AS 환불금액,
    r.refund_day AS 환불일시,
    (p.pay_price - IFNULL(r.refund_price, 0)) AS 실결제금액,
    CASE
        WHEN r.id IS NULL THEN '환불없음'
        WHEN r.refund_price = p.pay_price THEN '전액환불'
        ELSE '부분환불'
    END AS 환불상태
FROM payment p
JOIN membership ms ON p.membership_id = ms.id
JOIN member m ON ms.member_id = m.id
JOIN membership_option mo ON ms.membership_option_id = mo.id
LEFT JOIN refund r ON p.id = r.payment_id
ORDER BY p.pay_day DESC;

-- [SELECT] 환불 관리 : 환불한 회원별 통계 조회
SELECT
    m.id AS 회원ID,
    m.name AS 회원명,
    m.email AS 회원이메일,
    COUNT(r.id) AS 환불횟수,
    SUM(p.pay_price) AS 총결제금액,
    SUM(r.refund_price) AS 총환불금액,
    (SUM(p.pay_price) - SUM(r.refund_price)) AS 순결제금액
FROM member m
JOIN membership ms ON m.id = ms.member_id
JOIN payment p ON ms.id = p.membership_id
LEFT JOIN refund r ON p.id = r.payment_id
GROUP BY m.id, m.name, m.email
HAVING COUNT(r.id) > 0
ORDER BY 환불횟수 DESC;

```
</details> 

