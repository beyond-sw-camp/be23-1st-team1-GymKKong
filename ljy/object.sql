-- 선택한 지점(수강권 등록된 지점)의 게시글 목록 조회
DELIMITER //
CREATE PROCEDURE sp_지점별_게시판_조회(
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

-- 게시글별 댓글 목록 조회
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

-- 게시글별 댓글 등록
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


-- 트레이너 이메일 인증 후 비밀번호 변경
DELIMITER //
CREATE PROCEDURE sp_트레이너_계정_비밀번호_변경(
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


-- 트레이너 이메일로 조회 후 상태를 “탈퇴”로 수정
DELIMITER //
CREATE PROCEDURE sp_트레이너_계정_탈퇴(
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

-- 트레이너 휴대폰번호 인증 후 이메일/임시 비밀번호 발급
DELIMITER //
CREATE PROCEDURE sp_트레이너_계정_찾기(
    IN  p_phone_num     VARCHAR(255),
    OUT p_email         VARCHAR(255),
    OUT p_temp_password VARCHAR(20)
)
BEGIN
    DECLARE temp_pwd VARCHAR(20);

    -- 1) 기본값 초기화 (혹시 이전 CALL 값이 남아 있는 경우 대비)
    SET p_email         = NULL;
    SET p_temp_password = NULL;

    -- 2) 활성(Y) 회원 중 휴대폰번호로 이메일 조회
    SELECT t.email
      INTO p_email
    FROM trainer t
    WHERE t.phone_num = p_phone_num
      AND t.status    = 'ACTIVE'
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


-- 지점 검색(주소/이름 기반) 후 소속 요청 등록 (승인 필요)
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


-- 지점 선택 후 수업 개설 (수업명, 시간, 종료시간, 정원, 유형, 강습실 선택)
DELIMITER //
CREATE PROCEDURE sp_강습_개설(
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


-- 자신이 개설한 강습 목록 및 상태(수업 전/진행중/종료/취소) 확인, 현재 예약 인원 표시
DELIMITER //
CREATE PROCEDURE sp_트레이너별_강습_목록_및_상태(
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



-- 해당 강습의 예약 회원 목록 조회 후 개인별 출석 상태 등록 (회원권 차감 기능도 후행되어야함)
DELIMITER //
CREATE PROCEDURE sp_출석_체크(
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


-- 등록 지점의 게시판에 글 작성
DELIMITER //
CREATE PROCEDURE sp_등록지점_게시글_작성(
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


-- 등록 지점의 게시판의 글 목록 조회
DELIMITER //
CREATE PROCEDURE sp_등록지점_게시판_목록_조회 (
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
