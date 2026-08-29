# 스키마 v2 — 왜 바꿨는가

1차 프로젝트의 `DDL/common.sql`, `DML/common.sql`은 **DB 설계 과제**로서 완결된 결과물입니다.
다만 그 위에 REST API와 모바일 앱을 올리려고 하니 구조적으로 막히는 지점이 있어
`db/v2/01_schema.sql`로 재설계했습니다. **v1 파일은 지우지 않고 그대로 두었습니다.**

아래는 v1을 실제로 실행/정독하면서 확인한 문제와 v2의 대응입니다.
완성된 v2 구조는 [erd.md](erd.md), 그 위에 올린 아키텍처는 [architecture.md](architecture.md),
권한 설계는 [rbac.md](rbac.md)에 있습니다.

---

## 1. 예약 생성 로직이 존재하지 않았다

레포 전체에 `INSERT INTO class_reservation`이 **한 줄도 없습니다.**

```
$ grep -rn "INSERT INTO class_reservation" .
(결과 없음)
```

예약 조회(`sp_회원_예약_내역_조회`)와 취소(`sp_회원_예약_취소`)는 있지만,
정작 "수업을 예약한다"는 앱의 핵심 동작이 구현되지 않았습니다.
따라서 정원 검사, 중복 예약 방지, 이용권 잔여 검증도 존재하지 않았습니다.

**v2 / API**
`ReservationService.reserve()`가 한 트랜잭션에서 처리합니다.

1. `class_session` 행을 비관적 락으로 잠근다 (`SELECT … FOR UPDATE`)
2. 예약 가능 상태인지 검사한다 (취소된 수업인지, 이미 시작했는지)
3. 사용할 이용권을 고르고 잠근 뒤 1회 차감한다
4. `reserved_count`를 올린다
5. `reservation` 행을 만든다

DB에도 `UNIQUE (session_id, member_user_id)` 제약을 두어, 락을 뚫고 동시에 들어온
중복 예약은 제약 위반으로 걸러 `ALREADY_RESERVED`로 변환합니다.

---

## 2. 예약과 출석이 따로 놀아 예약 인원이 틀리게 표시됐다

v1은 `class_reservation`(예약)과 `attendance`(출석)가 FK 없이 분리돼 있었습니다.
그리고 [`sp_지점_강습실_등록`](../DML/common.sql)은 강습을 만들 때마다 **전체 회원**을
출석 테이블에 넣었습니다.

```sql
INSERT INTO attendance(class_id, member_id, status)
SELECT v_class_id, id, 'N'
FROM member;                    -- 회원 10만 명이면 강습 1개당 10만 행
```

그리고 `sp_트레이너_강습_정보_조회`는 그 행 수를 예약 인원으로 표시했습니다.

```sql
COUNT(a.id) AS reserved_count   -- 예약자 수가 아니라 전체 회원 수
```

즉 앱에 "3/15명 예약"을 그리면 항상 틀린 값이 나옵니다.

**v2**
두 테이블을 `reservation` 하나로 합치고 상태로 구분합니다.

| status | 의미 | 이용권 |
| --- | --- | --- |
| `RESERVED` | 예약함 | 차감됨 |
| `CANCELED` | 취소함 | 복원됨 |
| `ATTENDED` | 출석 | 차감 유지 |
| `NOSHOW` | 노쇼 | 차감 유지 (복원 안 함) |

출석 체크는 상태만 바꾸므로 이중 차감이 일어나지 않습니다.

---

## 3. 이용권이 "수업 1회"에 묶여 있어 10회권이 성립하지 않았다

v1의 `membership_option`은 `class_id`를 FK로 갖고, `class`는 `start_time` 하나뿐인
**단일 회차**였습니다. "10회권을 사서 여러 수업을 예약한다"가 스키마상 불가능합니다.

**v2**
- `class` → `class_program`(강습 정의) + `class_session`(실제 회차)로 분리
- `membership_option` → `membership_plan`으로 바꾸고 `class_id` 대신 `place_id` + `class_type`(GROUP/PERSONAL/ALL) 기준으로 판매

---

## 4. 잔여 0회여도 예약이 무한히 가능했다

v1은 `sp_출석_관리`에서 **출석 시점에만** 차감했습니다.
예약 시점에는 아무 검사도 없어서, 잔여 횟수와 무관하게 예약이 쌓입니다.

**v2** 예약 시점에 차감하고, 취소하면 복원합니다. 노쇼는 차감을 유지합니다.

---

## 5. 실행 자체가 안 되는 SQL이 있었다

| 위치 | 문제 |
| --- | --- |
| `DML/common.sql:117`, `:202` | `sp_회원_예약_내역_조회`가 **같은 이름으로 두 번 정의** → 두 번째 `CREATE`는 duplicate name 에러 |
| `DML/common.sql:536`, `:600` | `coment` — **존재하지 않는 테이블**. 컬럼(`comment_contents`, `comment_day`, `place_trainer_id`)도 실제 `comment` 테이블에 없음. `sp_댓글_작성`은 항상 실패 |
| `DDL/common.sql` | `ENUM('ACTIVE','INACTTIVE')` — **INACTIVE 오타** |
| `DML/common.sql:23,31,36,809,873,897` | 위 ENUM 컬럼을 `status = 'Y'` / `'N'`으로 조회·수정 → 매칭 0건 |
| `DML/common.sql:369` | `place_trainer`에 ENUM에 없는 `'N'`을 INSERT (승인 대기 표현 시도) |

**v2** ENUM 오타 수정, 승인 대기를 `PENDING`으로 정식 표현
(`ENUM('PENDING','ACTIVE','REJECTED','INACTIVE')`).

---

## 6. 트레이너가 댓글을 쓸 수 없었다

v1 `comment.member_id`는 `NOT NULL`이라 회원만 댓글을 달 수 있었습니다.
`post`는 반대로 `place_trainer_id`가 `NOT NULL`이라 트레이너만 글을 쓸 수 있었고,
회원 문의글이 불가능했습니다.

**v2** `post.author_user_id` / `comment.author_user_id`를 `app_user` 기준으로 통일해
세 역할 모두 글과 댓글을 쓸 수 있습니다. 공지(`NOTICE`)만 트레이너 이상으로 제한합니다.

---

## 7. 시간 관련 컬럼이 없어 상수로 때웠다

`class`에 종료 시각이 없어서,

- 진행중 판정: `DATE_ADD(c.start_time, INTERVAL 2 HOUR)` — 2시간 하드코딩
- 강습실 충돌 검사: 1시간 하드코딩

요구사항 정의서에는 "종료시간"을 입력받는다고 되어 있는데 컬럼이 없었습니다.

**v2** `class_session.end_at`을 두고, 충돌 검사는 실제 구간 겹침으로 판정합니다.

```sql
s.start_at < :endAt AND s.end_at > :startAt
```

---

## 8. 강습실이 이중으로 잡힐 수 있었다

v1은 `class`(수업이 방을 점유)와 `room_reserve`(트레이너가 방을 예약) 두 경로가
서로를 모르는 채 같은 방을 잡을 수 있었습니다. 충돌 검사는 `class`만 봤습니다.

**v2** `room_reserve`를 없애고 `class_session`이 강습실 점유의 유일한 소스입니다.

---

## 9. 지점 관리자를 표현할 수 없었다

README는 "관리자 / 지점(Admin / Branch)"이 지점을 운영한다고 설명하지만,
`admin` 테이블에는 `place_id`가 없어 **어느 지점 담당인지 알 수 없었습니다.**

**v2** `place_admin` 연결 테이블을 두고, `ADMIN`은 담당 지점만,
`SUPER_ADMIN`은 전 지점을 다룹니다.

---

## 10. 지점 삭제가 물리 DELETE였다

`sp_관리자_지점_삭제`는 `DELETE FROM place`를 수행합니다.
`room`, `membership_option`, `place_trainer`가 FK로 참조하고 있어 실패하거나,
성공하면 결제·예약 이력이 사라집니다.

**v2** `deleted_at` 기반 소프트 삭제로 이력을 보존합니다.

---

## 11. 모바일 앱에 필요한데 없던 것들

| 추가한 것 | 왜 필요한가 |
| --- | --- |
| `verification_code` | README는 "이메일·휴대폰 인증 기반"이라 하지만 저장할 곳이 없었다 |
| `refresh_token` | 앱은 매번 로그인시킬 수 없다. 기기별 세션 관리 |
| `device_token`, `notification` | 예약 확정·수업 취소 푸시 |
| `place.latitude/longitude` | "내 주변 지점"은 좌표 없이는 불가능 |
| `attachment` | 프로필/지점/게시글 이미지 |
| `favorite_place` | 앱 홈의 기본 지점 |
| `terms_agreement` | 약관 동의 이력 |

---

## 12. 그 밖의 정리

- `member.age VARCHAR(255)` → `member_profile.birth_date DATE`
- 비밀번호는 BCrypt 해시로 저장 (v1 시드는 `'hashed_password_123'` 같은 문자열)
- 전 테이블에 `created_at` / `updated_at`
- 조회 경로마다 인덱스 추가 (v1은 FK 인덱스 외에 없었음)
- `CHECK` 제약으로 잔여 횟수 음수·정원 0 등을 DB 레벨에서 차단

---

## 팀 회고에서 언급된 문제들

README 회고에 남아 있던 항목도 함께 처리했습니다.

> **황주완** — "환불처리 프로시저가 한 번 동작한 후 이미 환불된 멤버쉽에 재입력 시 에러가 발생"

`Membership.assertRefundable()`에서 상태를 먼저 검사해
`MEMBERSHIP_NOT_REFUNDABLE` + "이미 환불된 이용권입니다."로 응답합니다.
(`backend/scripts/smoke-test.sh` 16번 항목에서 검증)

> **이지연** — "이용권 부족 등 비즈니스 예외에 대한 명확한 에러 처리가 부족"

`ErrorCode` enum으로 도메인 예외마다 코드를 부여하고, 앱은 그 코드로 분기합니다.
예: 예약 시 `NO_USABLE_MEMBERSHIP`이면 이용권 구매 화면으로 유도.

> **정명진** — "정규화에만 몰두해 조회 쿼리에 조인이 너무 많다"

자주 쓰는 조합은 뷰로 고정했습니다 (`v_session_detail`, `v_place_revenue`).
API 레벨에서는 `JOIN FETCH`로 N+1을 피합니다.
