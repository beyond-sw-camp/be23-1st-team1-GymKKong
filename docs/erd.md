# ERD — 스키마 v2

`db/v2/01_schema.sql`의 실제 구조입니다. 테이블 23개, 뷰 2개.
FK와 UNIQUE 제약은 실행 중인 DB의 `information_schema`에서 뽑아 그대로 옮겼습니다.

v1에서 **왜** 바꿨는지는 [schema-v2.md](schema-v2.md)에, 전체 아키텍처는
[architecture.md](architecture.md)에 있습니다.

- [1. 전체 ERD](#1-전체-erd)
- [2. 도메인별 상세](#2-도메인별-상세)
- [3. 제약 목록](#3-제약-목록)
- [4. v1 → v2 대응표](#4-v1--v2-대응표)
- [5. 뷰](#5-뷰)

---

## 1. 전체 ERD

읽기 편하도록 도메인을 색으로 나눴습니다.
`app_user`와 `place`가 대부분의 테이블이 매달리는 두 축입니다.

```mermaid
erDiagram
  %% ---------- 계정 · 인증 ----------
  app_user       ||--o| member_profile   : "프로필"
  app_user       ||--o| trainer_profile  : "프로필"
  app_user       ||--o{ refresh_token    : "기기별 세션"
  app_user       ||--o{ terms_agreement  : "약관 동의"
  app_user       ||--o{ device_token     : "푸시 토큰"
  app_user       ||--o{ notification     : "알림함"

  %% ---------- 지점 · 시설 ----------
  place          ||--o{ room             : "강습실"
  place          ||--o{ place_admin      : "담당 관리자"
  place          ||--o{ place_trainer    : "소속 트레이너"
  app_user       ||--o{ place_admin      : "담당"
  app_user       ||--o{ place_trainer    : "신청·소속"
  app_user       ||--o{ favorite_place   : "즐겨찾기"
  place          ||--o{ favorite_place   : ""

  %% ---------- 강습 ----------
  place          ||--o{ class_program    : "개설 지점"
  app_user       ||--o{ class_program    : "담당 트레이너"
  class_program  ||--o{ class_session    : "회차"
  room           ||--o{ class_session    : "점유"

  %% ---------- 이용권 · 결제 ----------
  place          ||--o{ membership_plan  : "판매 상품"
  membership_plan||--o{ membership       : "구매"
  app_user       ||--o{ membership       : "보유"
  place          ||--o{ membership       : "사용 지점"
  membership     ||--|| payment          : "결제"
  app_user       ||--o{ payment          : ""
  payment        ||--o{ refund           : "환불"
  app_user       ||--o{ refund           : "처리자"

  %% ---------- 예약 · 출석 ----------
  class_session  ||--o{ reservation      : ""
  app_user       ||--o{ reservation      : "예약자"
  membership     ||--o{ reservation      : "차감 출처"

  %% ---------- 커뮤니티 ----------
  place          ||--o{ post             : "지점 게시판"
  app_user       ||--o{ post             : "작성자"
  post           ||--o{ comment          : ""
  app_user       ||--o{ comment          : "작성자"
  comment        ||--o{ comment          : "대댓글"

  app_user {
    bigint id PK
    varchar email UK
    varchar password_hash "BCrypt"
    varchar name
    varchar phone_num
    enum role "MEMBER|TRAINER|ADMIN|SUPER_ADMIN"
    enum status "ACTIVE|INACTIVE|SUSPENDED"
    datetime email_verified_at
    datetime phone_verified_at
    datetime deleted_at "소프트 삭제"
  }
  place {
    bigint id PK
    varchar name
    varchar address
    decimal latitude "내 주변 지점"
    decimal longitude
    time open_time
    time close_time
    enum status
    datetime deleted_at
  }
  class_program {
    bigint id PK
    bigint place_id FK
    bigint trainer_user_id FK
    varchar name
    enum class_type "GROUP|PERSONAL"
    enum level
    int duration_min "종료 시각 계산 근거"
    int default_capacity
  }
  class_session {
    bigint id PK
    bigint program_id FK
    bigint room_id FK
    datetime start_at
    datetime end_at
    int capacity
    int reserved_count
    enum status "SCHEDULED|IN_PROGRESS|COMPLETED|CANCELED"
  }
  reservation {
    bigint id PK
    bigint session_id FK
    bigint member_user_id FK
    bigint membership_id FK
    enum status "RESERVED|CANCELED|ATTENDED|NOSHOW"
    datetime canceled_at
    datetime checked_at
    bigint checked_by FK
  }
  membership {
    bigint id PK
    bigint plan_id FK
    bigint member_user_id FK
    bigint place_id FK
    int total_count "구매 시점 스냅샷"
    int remain_count
    date start_date
    date expire_date
    enum status "ACTIVE|EXPIRED|REFUNDED|SUSPENDED"
  }
```

### 한눈에 보는 구조

```mermaid
graph TB
  subgraph acc["계정 · 인증 (7)"]
    A1[app_user] --- A2[member_profile]
    A1 --- A3[trainer_profile]
    A1 --- A4[refresh_token]
    A1 --- A5[verification_code]
    A1 --- A6[terms_agreement]
  end
  subgraph plc["지점 · 시설 (4)"]
    P1[place] --- P2[room]
    P1 --- P3[place_admin]
    P1 --- P4[place_trainer]
  end
  subgraph cls["강습 (2)"]
    C1[class_program] --- C2[class_session]
  end
  subgraph mem["이용권 · 결제 (4)"]
    M1[membership_plan] --- M2[membership]
    M2 --- M3[payment] --- M4[refund]
  end
  subgraph rsv["예약 · 출석 (1)"]
    R1[reservation]
  end
  subgraph com["커뮤니티 (2)"]
    B1[post] --- B2[comment]
  end
  subgraph app["앱 지원 (4)"]
    S1[device_token]
    S2[notification]
    S3[attachment]
    S4[favorite_place]
  end

  acc --> plc --> cls --> rsv
  mem --> rsv

  classDef core fill:#eceefb,stroke:#4c55c2,color:#3a41a0
  class cls,rsv,mem core
```

`verification_code`와 `attachment`는 FK가 없습니다.
인증코드는 가입 전에도 발급되어야 하고(계정이 아직 없다), 첨부는 `owner_type` + `owner_id`로
여러 종류의 소유자를 가리킵니다.

---

## 2. 도메인별 상세

### 2.1 계정 · 인증

v1은 `member` · `trainer` · `admin` 세 테이블이 각각 이메일·비밀번호를 들고 있었습니다.
로그인 주체가 셋이면 토큰 하나로 세 역할을 다룰 수 없어 `app_user`로 합쳤습니다.

```mermaid
erDiagram
  app_user ||--o| member_profile  : ""
  app_user ||--o| trainer_profile : ""
  app_user ||--o{ refresh_token   : ""
  app_user ||--o{ terms_agreement : ""

  member_profile {
    bigint user_id PK "app_user와 공유 PK"
    date birth_date "v1의 age VARCHAR(255) 대체"
    enum gender "M|F|OTHER"
    enum grade "BRONZE|GOLD|DIAMOND"
    decimal height_cm
    decimal weight_kg
  }
  trainer_profile {
    bigint user_id PK
    text bio
    varchar specialty
    int career_years
  }
  refresh_token {
    bigint id PK
    bigint user_id FK
    varchar token_hash UK "원문 아님 · SHA-256"
    varchar device_id
    datetime expires_at
    datetime revoked_at "회전 시 폐기"
  }
  verification_code {
    bigint id PK
    enum channel "EMAIL|PHONE"
    varchar target "가입 전이라 FK 없음"
    enum purpose "SIGNUP|FIND_ACCOUNT|RESET_PASSWORD|CHANGE_PHONE"
    varchar code_hash "코드도 해시"
    datetime expires_at
    int attempt_count "무차별 대입 차단"
  }
```

프로필을 별도 테이블로 둔 이유는 회원과 트레이너가 필요로 하는 컬럼이 겹치지 않기 때문입니다.
`app_user`에 다 넣으면 절반이 항상 NULL입니다. `@MapsId`로 PK를 공유해 조인 비용은 없습니다.

### 2.2 지점 · 시설

```mermaid
erDiagram
  place ||--o{ room          : ""
  place ||--o{ place_admin   : ""
  place ||--o{ place_trainer : ""
  app_user ||--o{ place_admin   : ""
  app_user ||--o{ place_trainer : "신청자"
  app_user ||--o{ place_trainer : "승인자"

  place_admin {
    bigint id PK
    bigint place_id FK
    bigint user_id FK "role=ADMIN"
  }
  place_trainer {
    bigint id PK
    bigint place_id FK
    bigint user_id FK "role=TRAINER"
    enum status "PENDING|ACTIVE|REJECTED|INACTIVE"
    datetime requested_at
    datetime approved_at
    bigint approved_by FK "승인한 관리자"
  }
  room {
    bigint id PK
    bigint place_id FK
    varchar room_num
    varchar name
    int capacity
  }
```

`place_admin`이 새로 생긴 테이블입니다. v1의 `admin`에는 `place_id`가 없어
README가 말하는 "지점 담당자"를 표현할 수 없었습니다.

`place_trainer.status`는 v1에서 `ENUM('ACTIVE','INACTTIVE')`였고(오타 포함),
승인 대기를 표현하려고 ENUM에 없는 `'N'`을 넣으려 해 INSERT 자체가 실패했습니다.
v2는 4개 상태를 정식으로 둡니다.

```mermaid
stateDiagram-v2
  [*] --> PENDING : 트레이너 신청
  PENDING --> ACTIVE : 관리자 승인
  PENDING --> REJECTED : 관리자 거절
  ACTIVE --> INACTIVE : 소속 해제
  REJECTED --> PENDING : 재신청
  note right of ACTIVE
    이 상태에서만 강습을 개설할 수 있다
    ClassService.assertActiveTrainerOf
  end note
```

### 2.3 강습 — 2단 구조

v1의 `class`는 `start_time` 하나만 가진 **단일 회차**였습니다.
그런데 이용권은 10회권이었습니다. 회차가 하나뿐인 수업에 10회권을 파는 것은 성립하지 않습니다.

```mermaid
erDiagram
  class_program ||--o{ class_session : "1개 강습 → N개 회차"
  room          ||--o{ class_session : "점유"

  class_program {
    bigint id PK
    varchar name "아침 요가"
    int duration_min "60"
    int default_capacity "15"
    enum class_type
    enum status
    datetime deleted_at
  }
  class_session {
    bigint id PK
    datetime start_at "8/31 07:00"
    datetime end_at "8/31 08:00 — 자동 계산"
    int capacity
    int reserved_count "예약 트랜잭션에서만 변경"
    enum status
    varchar cancel_reason
  }
```

`end_at`이 생기면서 두 가지가 해결됩니다.

| v1 | v2 |
| --- | --- |
| 진행중 판정을 `start_time + 2시간`으로 하드코딩 | `start_at ≤ now < end_at` |
| 강습실 충돌을 1시간 고정으로 검사 | 실제 구간 겹침 `start < :end AND end > :start` |

또한 v1에는 `room_reserve`라는 별도 예약 경로가 있어 같은 방을 이중으로 잡을 수 있었습니다.
v2는 그 테이블을 없애고 `class_session`이 강습실 점유의 유일한 소스입니다.

### 2.4 이용권 · 결제

```mermaid
erDiagram
  membership_plan ||--o{ membership : "구매"
  membership      ||--|| payment    : ""
  payment         ||--o{ refund     : ""

  membership_plan {
    bigint id PK
    bigint place_id FK "v1은 class_id였다"
    varchar name "그룹 10회권"
    int total_count
    int price
    int valid_days
    enum class_type "GROUP|PERSONAL|ALL"
  }
  membership {
    bigint id PK
    int total_count "구매 시점 스냅샷"
    int remain_count
    date expire_date
    enum status
  }
  payment {
    bigint id PK
    int amount
    enum method "CARD|TRANSFER|KAKAOPAY|TOSS|ONSITE"
    enum status "PENDING|PAID|FAILED|CANCELED"
    varchar pg_tid UK "중복 콜백 차단"
    datetime paid_at
  }
  refund {
    bigint id PK
    int amount "잔여 비율로 계산"
    enum status "REQUESTED|APPROVED|REJECTED|COMPLETED"
    datetime processed_at
    bigint processed_by FK
  }
```

**`membership_plan.place_id`가 v1과의 가장 큰 차이입니다.**
v1은 `membership_option.class_id` — 이용권이 수업 1개에 묶여 있었습니다.
v2는 지점 + 이용 범위 기준이라 "강남점 그룹 10회권으로 아무 그룹 수업이나 예약"이 성립합니다.

`total_count`를 `membership`에도 복사해 두는 것은 의도적인 비정규화입니다.
상품 가격이나 횟수가 나중에 바뀌어도 이미 판 이용권은 영향받지 않아야 합니다.

### 2.5 예약 · 출석 — 통합

v1은 `class_reservation`(예약)과 `attendance`(출석)가 **FK 없이 따로** 있었습니다.
그리고 강습을 만들 때마다 전체 회원을 `attendance`에 넣고, 그 행 수를 예약 인원으로 표시했습니다.

```mermaid
graph LR
  subgraph v1["v1 — 분리"]
    CR["class_reservation<br/>예약"]
    AT["attendance<br/>출석<br/>강습 생성 시 전체 회원 INSERT"]
    CR -.->|"연결 없음"| AT
  end
  subgraph v2["v2 — 통합"]
    RV["reservation<br/>status로 구분"]
  end
  v1 ==> v2

  classDef bad fill:#fee2e2,stroke:#dc2626,color:#991b1b
  classDef good fill:#e7f7ee,stroke:#12a150,color:#0b6b36
  class CR,AT bad
  class RV good
```

```mermaid
stateDiagram-v2
  [*] --> RESERVED : 예약 (이용권 1회 차감)
  RESERVED --> CANCELED : 회원 취소 (2시간 전까지) / 수업 취소
  RESERVED --> ATTENDED : 트레이너 출석 체크
  RESERVED --> NOSHOW : 트레이너 노쇼 처리
  ATTENDED --> RESERVED : 오처리 정정
  NOSHOW --> RESERVED : 오처리 정정
  CANCELED --> RESERVED : 같은 회차 재예약 (행 재사용)
  note left of CANCELED
    이용권 복원
  end note
  note right of NOSHOW
    이용권 복원하지 않음
  end note
```

`CANCELED → RESERVED` 전이가 있는 이유는 `UNIQUE(session_id, member_user_id)` 때문입니다.
취소했다가 같은 회차를 다시 예약하면 새 행을 넣을 수 없어 기존 행을 되살립니다
(`Reservation.reactivate`).

### 2.6 커뮤니티

```mermaid
erDiagram
  place    ||--o{ post    : ""
  app_user ||--o{ post    : "작성자"
  post     ||--o{ comment : ""
  app_user ||--o{ comment : "작성자"
  comment  ||--o{ comment : "1단계 대댓글"

  post {
    bigint id PK
    bigint place_id FK
    bigint author_user_id FK "v1은 place_trainer_id NOT NULL"
    enum post_type "NOTICE|FREE|QNA"
    varchar title
    text content
    int view_count
    int comment_count "역정규화"
    boolean is_pinned
    datetime deleted_at
  }
  comment {
    bigint id PK
    bigint post_id FK
    bigint author_user_id FK "v1은 member_id NOT NULL"
    bigint parent_id FK "대댓글"
    text content
    datetime deleted_at
  }
```

작성자를 `app_user`로 통일한 것이 핵심입니다. v1은 게시글이 트레이너 전용,
댓글이 회원 전용이라 **트레이너가 댓글을 달 수 없었습니다.**

---

## 3. 제약 목록

### UNIQUE

| 테이블 | 컬럼 | 막는 것 |
| --- | --- | --- |
| `app_user` | `email` | 이메일 중복 가입 |
| `reservation` | `session_id`, `member_user_id` | **같은 회차 중복 예약** |
| `class_session` | `room_id`, `start_at` | 같은 방 같은 시각 중복 개설 |
| `room` | `place_id`, `room_num` | 지점 내 강습실 번호 중복 |
| `place_trainer` | `place_id`, `user_id` | 같은 지점에 중복 소속 신청 |
| `place_admin` | `place_id`, `user_id` | 같은 지점에 중복 담당 지정 |
| `favorite_place` | `user_id`, `place_id` | 즐겨찾기 중복 |
| `payment` | `pg_tid` | PG 중복 콜백으로 인한 이중 결제 |
| `refresh_token` | `token_hash` | 토큰 충돌 |
| `device_token` | `token` | 기기 토큰 중복 등록 |

`reservation`의 복합 UNIQUE는 애플리케이션 락을 뚫고 들어온 동시 요청까지 잡는 **최후 방어선**입니다.
서비스는 이 제약 위반을 `ALREADY_RESERVED`로 변환합니다.

### CHECK

| 테이블 | 조건 | 의미 |
| --- | --- | --- |
| `class_session` | `end_at > start_at` | 끝이 시작보다 빠를 수 없다 |
| `class_session` | `capacity > 0` | 정원 0인 수업은 열 수 없다 |
| `membership` | `0 ≤ remain_count ≤ total_count` | 잔여가 음수이거나 총량을 넘을 수 없다 |
| `membership_plan` | `total_count > 0`, `price ≥ 0` | |
| `refund` | `amount ≥ 0` | |

### 인덱스

v1에는 FK 인덱스 외에 조회용 인덱스가 없었습니다. v2는 실제 조회 경로마다 둡니다.

| 인덱스 | 쓰이는 곳 |
| --- | --- |
| `class_session(start_at, status)` | 시간표 |
| `class_session(room_id, start_at, end_at)` | 강습실 충돌 검사 |
| `reservation(member_user_id, status, reserved_at)` | 내 예약 목록 |
| `reservation(session_id, status)` | 예약자 명단 · 정원 집계 |
| `membership(member_user_id, status)` | 이용권 선택 |
| `place(latitude, longitude)` | 내 주변 지점 (박스 필터) |
| `post(place_id, deleted_at, is_pinned, created_at)` | 게시판 목록 |
| `notification(user_id, read_at, created_at)` | 알림함 · 뱃지 |

---

## 4. v1 → v2 대응표

| v1 | v2 | 변화 |
| --- | --- | --- |
| `member`, `trainer`, `admin` | `app_user` + `member_profile` + `trainer_profile` | 로그인 주체 통합, role로 구분 |
| — | `place_admin` | **신규.** 지점 담당자를 표현할 수 없었다 |
| `class` | `class_program` + `class_session` | 강습 정의와 회차 분리 |
| `class_reservation` + `attendance` | `reservation` | 통합, status로 구분 |
| `membership_option` | `membership_plan` | `class_id` → `place_id` + `class_type` |
| `room_reserve` | *(삭제)* | 강습실 이중 예약 경로 제거 |
| `comment`(회원 전용) | `comment`(작성자 = app_user) | 트레이너도 댓글 가능 |
| `post`(트레이너 전용) | `post`(작성자 = app_user) | 회원 문의글 가능 |
| — | `verification_code` | **신규.** "인증 기반"이라 했지만 저장할 곳이 없었다 |
| — | `refresh_token` | **신규.** 기기별 세션 |
| — | `device_token`, `notification` | **신규.** 푸시·알림함 |
| — | `attachment`, `favorite_place`, `terms_agreement` | **신규** |
| `member.age VARCHAR(255)` | `member_profile.birth_date DATE` | 타입 정정 |
| `ENUM('ACTIVE','INACTTIVE')` | `ENUM('ACTIVE','INACTIVE')` | 오타 수정 |
| 물리 DELETE | `deleted_at` 소프트 삭제 | 이력 보존 |

테이블 수: **13개 → 23개**. 늘어난 10개 중 7개는 모바일 앱에 필요해 새로 만든 것입니다
(인증코드, 리프레시 토큰, 기기 토큰, 알림, 첨부, 즐겨찾기, 약관 동의).

---

## 5. 뷰

### `v_session_detail`

앱의 수업 카드 하나를 그리는 데 필요한 값을 한 번에 가져옵니다.
`class_session` → `class_program` → `place` / `room` / `app_user`(트레이너) 조인을 감싼 것입니다.

```sql
SELECT s.id AS session_id, s.start_at, s.end_at, s.capacity, s.reserved_count,
       (s.capacity - s.reserved_count) AS remain_seat,
       p.name AS program_name, p.class_type, p.level,
       pl.name AS place_name, r.room_num, t.name AS trainer_name
FROM class_session s
JOIN class_program p  ON s.program_id = p.id
JOIN place         pl ON p.place_id = pl.id
JOIN room          r  ON s.room_id = r.id
JOIN app_user      t  ON p.trainer_user_id = t.id
LEFT JOIN trainer_profile tp ON tp.user_id = t.id;
```

### `v_place_revenue`

지점별 매출 통계입니다. v1에서 흩어져 있던 집계 쿼리를 뷰로 고정했습니다.

```sql
SELECT pl.id AS place_id, pl.name AS place_name,
       COUNT(DISTINCT ms.member_user_id) AS member_count,
       COALESCE(SUM(pay.amount), 0) AS total_paid,
       COALESCE(SUM(rf.amount), 0)  AS total_refunded,
       COALESCE(SUM(pay.amount), 0) - COALESCE(SUM(rf.amount), 0) AS net_revenue
FROM place pl
LEFT JOIN membership ms ON ms.place_id = pl.id
LEFT JOIN payment pay   ON pay.membership_id = ms.id AND pay.status = 'PAID'
LEFT JOIN refund  rf    ON rf.payment_id = pay.id AND rf.status = 'COMPLETED'
GROUP BY pl.id, pl.name;
```

> API는 뷰를 직접 쓰지 않습니다. JPA 엔티티로 조회하고 `JOIN FETCH`로 N+1을 피합니다.
> 뷰는 운영 중 DB에서 바로 확인하거나 통계를 뽑을 때 씁니다.
