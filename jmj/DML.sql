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




























