-- 이메일 인증 후 비밀번호 변경
-- SELECT직후 UPDATE하는 수 ms안에 같은 비밀번호에 접근하는 경우 거의 없음
SELECT *
FROM member
WHERE email = 'lee.y2h@email.com';
UPDATE member
SET password = 'trewq'
WHERE email = 'lee.y2h@email.com';

-- email로 회원 조회 -> 회원 상태를 '탈퇴'로 변경
SELECT *
FROM member
WHERE email = 'lee.y2h@email.com';
UPDATE member
SET member.status = 'N'
WHERE email = 'lee.y2h@email.com';

-- 사용자 휴대폰번호 인증 후 이메일/임시 비밀번호 발급
START TRANSACTION;
SELECT id, email
FROM member
WHERE phone_num = 010 - 2345 - 6789
  AND status = 'Y' FOR
UPDATE;                             -- 해당 회원 lock걸고 진행
UPDATE member
SET password = '프로그램에서 hash한 임시 비밀번호'
WHERE phone_num = 010 - 2345 - 6789
  AND status = 'Y';                 -- 임시 비밀번호 업데이트
COMMIT;

-- 검색어 또는 주소 필터를 적용한 지점 목록 중 원하는 지점 선택  or? and?
SELECT id, name, address
FROM place
WHERE name LIKE '%짐꽁%'
  AND address LIKE '%강남%';

-- 선택한 지점의 수강권(10회권, 30회권 등) 구매
SELECT id, count, price
FROM membership_option
WHERE place_id = 1;                                                            -- 지점의 회원권 옵션 조회
START TRANSACTION;
SELECT id, count, price
FROM membership_option
WHERE id = 2
  AND place_id = 1 FOR
UPDATE;                                                                        -- 선택한 수강권 조회
INSERT INTO membership (membership_option_id, member_id, refund_YN, remain_count)
VALUES (2, 2, 'N', (SELECT count FROM membership_option WHERE id = 2));        -- 회원에게 membership 발급
INSERT INTO payment (membership_id, pay_price)
VALUES (LAST_INSERT_ID(), (SELECT price FROM membership_option WHERE id = 2)); -- 최근 추가된 membership id의 결제 내역 저장
COMMIT;

-- 보유 수강권의 잔여 횟수, 지점 정보 조회 및 “환불” 버튼 노출
SELECT m.id           AS 멤버쉽ID,
       mo.count       AS 횟수권,
       m.remain_count AS 잔여횟수권,
       m.refund_YN,
       p.name         AS 지점명,
       p.address      AS 지점주소,

       CASE                                    -- 환불 조건이 변할 경우 프로시저 매번 수정해야함
           WHEN m.refund_YN = 'N'              -- 환불 되지 않았고
               AND m.remain_count > 0          -- 잔여 횟수가 남은 경우
               THEN 'Y'                        -- 환불 가능
           ELSE 'N'                            -- 환불 불가
           END        AS refund_button_show    -- 환불 버튼 출력
FROM membership m
         INNER JOIN membership_option mo
                    ON mo.id = m.membership_option_id
         INNER JOIN place p
                    ON p.id = mo.place_id
WHERE m.member_id = 2;

-- 환불 정책(잔여 상태, 사용 이력 등)에 따른 환불 절차 처리
DELIMITER //

CREATE PROCEDURE refund_membership(
    IN p_membership_id BIGINT,                              -- 멤버쉽ID, 회원ID 매개변수로 받음
    IN p_member_id BIGINT
)
BEGIN
    DECLARE v_payment_id BIGINT;
    DECLARE v_pay_price BIGINT;                             -- 결제 ID, 결제 금액 변수 생성
    START TRANSACTION;
    SELECT p.id, p.pay_price
    INTO v_payment_id, v_pay_price                          -- 변수에 각 값 할당
    FROM membership m
             INNER JOIN payment p ON p.membership_id = m.id -- 결제테이블과 멤버쉽 테이블 INNER JOIN
    WHERE m.id = p_membership_id                            -- 멤버쉽ID가 매개변수로 받은 멤버쉽ID이고
      AND m.member_id = p_member_id                         -- 회원ID가 매개변수로 받은 회원ID이고
      AND m.refund_YN = 'N'                                 -- 환불 되지 않았고
      AND m.remain_count > 0                                -- 잔여 횟수가 남아 있는 경우
        FOR
    UPDATE;                                                 -- lock 걸음 (환불 요청이 동시에 들어올 경우 문제 발생 여지 있음)
    INSERT INTO refund(payment_id, refund_price)            -- 환불테이블에 매개변수(멤버쉽ID, 가격) 추가
    VALUES (v_payment_id, v_pay_price);
    UPDATE membership                                       -- 멤버쉽의 환불 여부 Yes로 수정 및 잔여 횟수 0회로 수정
    SET refund_YN    = 'Y',
        remain_count = 0
    WHERE id = p_membership_id;
    COMMIT;
END//
DELIMITER ;
call refund_membership(2, 1);

-- 예약 가능한 수업 목록 조회 후 강좌 선택 및 예약
DELIMITER //
CREATE PROCEDURE get_available_classes(
    IN p_place_id BIGINT
)
BEGIN
    SELECT c.id                      AS 수업ID,
           c.class_name              AS 수업이름,
           c.start_time              AS 시작시간,
           c.capacity                AS 수업정원,
           (SELECT COUNT(*)
            FROM class_reservation r
            WHERE r.class_id = c.id                     -- 예약된 수업ID가 수업ID인 경우
              AND r.cancel_YN = 'N') AS reserved_count, -- 취소되지 않은 경우
           t.name                    AS trainer_name,   -- 수업을 개설한 트레이너 이름
           r2.room_num                                  -- 강습실 번호
    FROM class c
             INNER JOIN room r2 ON c.room_id = r2.id
             INNER JOIN place p ON r2.place_id = p.id
             INNER JOIN trainer t ON c.trainer_id = t.id
    WHERE p.id = p_place_id                             -- 지점ID=매개변수로 입력받은 값
      AND c.start_time > NOW()                          -- 시작 시간이 현재보다 큰 경우
      AND c.capacity >
          (SELECT COUNT(*)
           FROM class_reservation r
           WHERE r.class_id = c.id
             AND r.cancel_YN = 'N')                     -- 예약된 수업이 수업ID와 같고 취소 여부가 NO인 경우
    ORDER BY c.start_time ASC;                          -- 시간 순 정ㅕㄹㄹ
END //
DELIMITER ;
CALL get_available_classes(1);

-- 예약 내역 중 선택하여 수업 예약 취소
SELECT r.id         AS 예약ID,
       c.class_name AS 수업명,
       c.start_time AS 시작시간,
       t.name       AS 트레이너명,                        -- 예약조회
       p.name       AS 지점명,
       r.cancel_YN  AS 취소여부
FROM class_reservation r
         INNER JOIN class c ON r.class_id = c.id
         INNER JOIN room rm ON c.room_id = rm.id
         INNER JOIN place p ON rm.place_id = p.id
         INNER JOIN trainer t ON c.trainer_id = t.id
WHERE r.member_id = 1                                    -- 특정 회원
  AND r.cancel_YN = 'N'                                  -- 취소되지 않은 예약만
ORDER BY c.start_time;

DELIMITER //

CREATE PROCEDURE cancel_class_reservation(
    IN p_reservation_id BIGINT,
    IN p_member_id BIGINT
)
-- 수업 예약 취소
BEGIN
    DECLARE v_start_time DATETIME;
    START TRANSACTION;
    SELECT c.start_time
    INTO v_start_time
    FROM class_reservation r
             INNER JOIN class c ON r.class_id = c.id
    WHERE r.id = p_reservation_id                     --  수업이 존재하는지
      AND r.member_id = p_member_id                   --  본인의 예약인지
      AND r.cancel_YN = 'N'                           --  아직 취소 안 됐는지
        FOR
    UPDATE;
    IF v_start_time IS NULL THEN
        SIGNAL SQLSTATE '45000'                       -- 예약이 없으면 취소 불가
            SET MESSAGE_TEXT = '취소할 수 있는 예약이 존재하지 않습니다.';
    END IF;
    IF v_start_time <= NOW() THEN
        SIGNAL SQLSTATE '45000'                       -- 이미 시작한 수업이면 취소 불가
            SET MESSAGE_TEXT = '이미 시작한 수업은 취소할 수 없습니다.';
    END IF;
    UPDATE class_reservation
    SET cancel_YN = 'Y'
    WHERE id = p_reservation_id;                      -- 예약 취소 처리
    COMMIT;
END //
DELIMITER ;

