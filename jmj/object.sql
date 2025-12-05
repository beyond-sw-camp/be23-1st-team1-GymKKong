--지점별 전체 강습 목록 조회 (강습실, 트레이너, 참가 회원 정보 포함)
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
--attendence와 member를 left로 바꾸면 참가 회원이 없는 강습도 출력 가능 

--결제 목록 기반으로 환불 이력 및 환불 로그 조회
-- 기본 환불 이력 조회
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

-- 환불한 회원별로 조회
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
HAVING 환불횟수 > 0
ORDER BY 환불횟수 DESC;

--모든 지점의 등록 회원의 결제 내역 목록 조회
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


-- 기본 지점별 회원 결제 내역 조회
SELECT
    pl.name AS 지점명,
    COUNT(DISTINCT m.id) AS 등록회원수,
    m.name as 이름,
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

--해당 지점 소속 회원 목록 조회
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

--특정지점 소속 회우너 // 데이터 넣어야됨
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

--지점 소속 회원 상세 정보 
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

-- 개설된 강습실 목록 
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

--강습실 예약 현황
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

--빈 강습실 
SELECT
    pl.name AS 지점명,
    r.room_num AS 강습실번호,
    '강습없음' AS 상태
FROM room r
JOIN place pl ON r.place_id = pl.id
LEFT JOIN class c ON r.id = c.room_id
WHERE c.id IS NULL
ORDER BY pl.name, r.room_num;


-- 트레이너 이메일로 조회 후 제외하는 프로시저
DELIMITER //

CREATE PROCEDURE 트레이너이메일조회후트레이너삭제(
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

-- 프로시저 실행
CALL 트레이너이메일조회후트레이너삭제('choi.trainer2@gymkkong.com');

---------------------------------------------------------------
--트랜젝션 + 프로시져 
DELIMITER //

CREATE PROCEDURE 트레이너이메일조회후트레이너삭제 (
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

-- 실행
CALL 트레이너이메일조회후트레이너삭제 ('choi.trainer@gymkkong.com');

-------------------------

--트레이너 목록 조회
-- 기본 트레이너 목록 조회
SELECT
    t.id AS 트레이너ID,
    t.name AS 트레이너명,
    t.email AS 이메일,
    t.phone_num AS 연락처
FROM trainer t
ORDER BY t.name;

--지점 정보 포함 트레이너 목록 조회
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

--전체 지점 리스트 조회 //admin 관점
SELECT id, name, address
FROM place;

--지점명 검색 후 지점 목록에서 삭제

DELIMITER //

CREATE PROCEDURE 지점명검색후지점목록에서삭제(IN p_name VARCHAR(255))
BEGIN
    DECLARE v_count INT;

    -- 오류 발생 시 롤백 처리
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT '삭제 실패: 오류 발생으로 롤백되었습니다.' AS message;
    END;

    --  존재 여부 확인
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

CALL 지점명검색후지점목록에서삭제('짐꽁 강남점');

----------------------------------

--예약을 할 때 원하는 시간과 기존 수업시간이 겹치면 롤백 아ㅏ니면 인서트 프로시져 
DELIMITER //

CREATE PROCEDURE 강습생성(
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

CALL 강습생성(1, 2, 'PT Class', '2025-12-10 14:00:00', 10);

--------------------------------------------------

--post 댓글 조회
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

--댓글 작성 프로시져 
DELIMITER //

CREATE PROCEDURE 댓글작성1(
    IN p_content TEXT,
    IN p_member_id BIGINT,
    IN p_place_trainer_id BIGINT,
    IN p_board_id BIGINT
)
label_main: BEGIN   --  레이블 추가됨
    DECLARE v_member_exists INT DEFAULT 0;
    DECLARE v_trainer_exists INT DEFAULT 0;

    START TRANSACTION;

    -- 1. 둘 다 NULL → 오류
    IF p_member_id IS NULL AND p_place_trainer_id IS NULL THEN
        SELECT '오류: member_id 또는 place_trainer_id 중 하나는 반드시 입력해야 합니다.' AS message;
        ROLLBACK;
        LEAVE label_main;   --  레이블로 LEAVE
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

CALL 댓글작성1('내용', 3, NULL, 1); --member가 작성할때
CALL 댓글작성1('트레이너 댓글', NULL, 1, 1); --p@_t@_가 작성할때



---------------------------------------------------














