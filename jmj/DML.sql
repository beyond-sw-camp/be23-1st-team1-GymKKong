INSERT INTO place(name, address)
VALUES ('헬스짱 강남점', '서울 강남구 123');

INSERT INTO trainer(name, email, phone_num)
VALUES ('홍길동', 'hong@gym.com', '010-1111-2222');

INSERT INTO member(name, email, phone_num, age, gender, grade)
VALUES ('김철수', 'kim@gym.com', '010-2222-3333', '29', 'm', 'BRONZE');

INSERT INTO room(place_id, room_num)
VALUES (1, 101);

INSERT INTO class(trainer_id, room_id, class_name, start_time, capacity)
VALUES (1, 1, '요가 클래스', '2025-12-05 10:00:00', 10);


INSERT INTO attendance(class_id, member_id, status)
VALUES (1, 1, 'Y');


INSERT INTO membership_option(class_id, place_id, count, price)
VALUES (1, 1, 20, 150000);

INSERT INTO membership(membership_option_id, member_id, remain_count, refund_YN)
VALUES (1, 1, 20, 'N');

INSERT INTO payment(membership_id, pay_price)
VALUES (1, 150000);

INSERT INTO refund(payment_id, refund_price)
VALUES (1, 50000);

INSERT INTO place_trainer(id, place_id, trainer_id)
VALUES (1, 1, 1);

INSERT INTO room_reserve(id, place_trainer_id, room_id, start_time)
VALUES (1, 1, 1, '2025-12-05 09:00:00');

INSERT INTO post(id, place_trainer_id, title, post_contents)
VALUES (1, 1, '공지사항', '12월 신규 이벤트 안내');

INSERT INTO coment(id, post_id, member_id, comment_contents)
VALUES (1, 1, 1, '좋은 정보 감사합니다!');


INSERT INTO admin(id, name, email, password, type)
VALUES (1, '관리자', 'admin@gym.com', '1234', 'admin');





-- 1. 부모 테이블부터 삽입 (외래키 참조 없는 테이블)

-- member 데이터 삽입
INSERT INTO member (name, email, phone_num, age, gender, grade) VALUES
('김철수', 'kim.scs@email.com', '010-1234-5678', '28', 'm', 'GOLD'),
('이영희', 'lee.y2h@email.com', '010-2345-6789', '32', 'f', 'DIAMOND'),
('박민수', 'park.m3s@email.com', '010-3456-7890', '25', 'm', 'BRONZE');

-- place 데이터 삽입
INSERT INTO place (name, address) VALUES
('짐꽁 강남점', '서울시 강남구 테헤란로 123'),
('짐꽁 홍대점', '서울시 마포구 양화로 456'),
('짐꽁 잠실점', '서울시 송파구 올림픽로 789');

-- trainer 데이터 삽입
INSERT INTO trainer (name, email, phone_num) VALUES
('최트레이너', 'choia.trainer@gymkkong.com', '010-1111-2222'),
('정코치', 'juang.coach@gymkkong.com', '010-3333-4444'),
('한선생', 'hana.teacher@gymkkong.com', '010-5555-6666');

-- 2. 1단계 자식 테이블 (member, place, trainer 참조)

-- room 데이터 삽입 (place 참조)
INSERT INTO room (place_id, room_num) VALUES
(1, 101),
(1, 102),
(2, 201);

-- place_trainer 데이터 삽입 (place, trainer 참조)
INSERT INTO place_trainer (place_id, trainer_id, status) VALUES
(1, 1, 'Y'),
(1, 2, 'Y'),
(2, 3, 'Y');

-- 3. 2단계 자식 테이블 (room, trainer 참조)

-- class 데이터 삽입 (trainer, room 참조)
INSERT INTO class (trainer_id, room_id, class_name, start_time, capacity) VALUES
(1, 1, '아침 요가 클래스', '2024-12-05 07:00:00', 15),
(2, 2, '근력 운동 클래스', '2024-12-05 19:00:00', 10),
(3, 3, '필라테스 클래스', '2024-12-05 10:00:00', 12);

-- 4. 3단계 자식 테이블 (class 참조)

-- attendance 데이터 삽입 (class, member 참조)
INSERT INTO attendance (class_id, member_id, status) VALUES
(1, 1, 'Y'),
(1, 2, 'Y'),
(2, 3, 'N');

-- membership_option 데이터 삽입 (class, place 참조)
INSERT INTO membership_option (class_id, place_id, count, price) VALUES
(1, 1, 10, 150000),
(2, 1, 20, 280000),
(3, 2, 15, 200000);

-- room_reserve 데이터 삽입 (place_trainer, room 참조)
INSERT INTO room_reserve (place_trainer_id, room_id, start_time) VALUES
(1, 1, '2024-12-06 08:00:00'),
(2, 2, '2024-12-06 18:00:00'),
(3, 3, '2024-12-06 11:00:00');

-- post 데이터 삽입 (place_trainer 참조)
INSERT INTO post (place_trainer_id, title, post_contents, post_day) VALUES
(1, '새로운 요가 프로그램 안내', '12월부터 새로운 요가 프로그램이 시작됩니다!', '2024-11-28 09:00:00'),
(2, '연말 특별 이벤트', '12월 한달간 특별 할인 이벤트를 진행합니다.', '2024-11-29 10:30:00'),
(3, '필라테스 입문 가이드', '필라테스 초보자를 위한 안내 글입니다.', '2024-11-30 14:00:00');

-- 5. 4단계 자식 테이블 (membership_option, post 참조)

-- membership 데이터 삽입 (membership_option, member 참조)
INSERT INTO membership (membership_option_id, member_id, refund_YN, remain_count) VALUES
(1, 1, 'N', 8),
(2, 2, 'N', 20),
(3, 3, 'N', 12);

-- coment 데이터 삽입 (post, member 참조)
INSERT INTO coment (post_id, member_id, comment_contents, comment_day) VALUES
(1, 1, '요가 프로그램 기대됩니다!', '2024-11-28 10:00:00'),
(2, 2, '할인 이벤트 감사합니다~', '2024-11-29 11:00:00'),
(3, 3, '필라테스 처음인데 도움 많이 됐어요', '2024-11-30 15:00:00');

-- 6. 5단계 자식 테이블 (membership 참조)

-- payment 데이터 삽입 (membership 참조)
INSERT INTO payment (membership_id, pay_price, pay_day) VALUES
(1, 150000, '2024-11-01 14:30:00'),
(2, 280000, '2024-11-05 16:20:00'),
(3, 200000, '2024-11-10 11:00:00');

-- 7. 6단계 자식 테이블 (payment 참조)

-- refund 데이터 삽입 (payment 참조)
INSERT INTO refund (payment_id, refund_price, refund_day) VALUES
(1, 50000, '2024-11-15 10:00:00'),
(2, 100000, '2024-11-20 15:30:00'),
(3, 80000, '2024-11-25 13:45:00');

-- 8. 독립 테이블

-- admin 데이터 삽입 (외래키 없음)
INSERT INTO admin (name, email, password, type) VALUES
('최관리자', 'admin.choi@gymkkong.com', 'hashed_password_123', 'super_admin'),
('김매니저', 'manager.kim@gymkkong.com', 'hashed_password_456', 'admin'),
('이스태프', 'staff.lee@gymkkong.com', 'hashed_password_789', 'admin');






















