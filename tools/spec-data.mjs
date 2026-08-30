/**
 * 화면정의서 내용.
 *
 * shots에 적는 파일명은 docs/evidence/screens/ 에 실제로 존재하는 캡처다.
 * 캡처는 Playwright E2E(app/e2e)가 실제 브라우저에서 앱을 주행하며 남긴 것이고,
 * 콘솔 증적은 tools/capture-console.mjs 가 실제 명령을 다시 실행해 남긴 것이다.
 */

export const meta = {
  title: 'GymKKong 화면정의서',
  subtitle: '수업 예약·출석·결제 관리 앱 — 회원 / 트레이너 / 관리자',
  repo: 'beyond-sw-camp/be23-1st-team1-GymKKong · feat/rn-app',
  stack: 'React Native (Expo SDK 57) · Spring Boot 3.4 · MariaDB 11.4',
};

/**
 * 아키텍처 슬라이드의 우측 요약.
 * 도식(docs/architecture-overview.png)의 영역 색을 왼쪽 막대에 그대로 쓴다.
 */
export const architecture = [
  { label: '클라이언트', color: '#E8842B', body: 'Expo 앱 하나로 회원 · 트레이너 · 관리자를 모두 다룬다. 역할에 따라 탭 구성이 달라진다.' },
  { label: '인증 계층', color: '#8E93A6', body: '세션 없는 JWT. 필터가 Bearer를 검증해 AuthUser를 주입하고, 예외는 ErrorCode로 변환한다.' },
  { label: '애플리케이션', color: '#4C55C2', body: 'Controller 7 · Service 8 · Repository 21 · Entity 21. 예약은 비관적 락과 UNIQUE 제약으로 두 겹 방어.' },
  { label: '데이터', color: '#E8842B', body: 'MariaDB 11.4 · 23 테이블 / 2 뷰. ddl-auto: validate 로 스키마를 대조한다.' },
  { label: '검증', color: '#1F9D57', body: '스모크 22/22 · E2E 28/28 · 타입 검사 · 다이어그램 34/34. 증적은 docs/evidence.' },
  { label: '미연동', color: '#7A5FD3', body: 'PG 결제 · SMS/Email · 푸시 · 배포. 돈이나 외부 계약이 필요해 로컬에서는 대체 동작.' },
];

/** 전수 범위 매트릭스. */
export const scope = [
  { area: '인증', routes: ['/login', '/signup', '/find-account'], screens: 3, shots: 2 },
  { area: '홈 · 시간표', routes: ['/(app)'], screens: 1, shots: 2 },
  { area: '수업 · 예약', routes: ['/session/:id', '/(app)/reservations'], screens: 2, shots: 6 },
  { area: '이용권 · 결제', routes: ['/(app)/memberships', '/place/:id'], screens: 2, shots: 5 },
  { area: '커뮤니티', routes: ['/place/:id', '/post/:id'], screens: 2, shots: 3 },
  { area: '트레이너', routes: ['/(app)/classes', '/roster/:sessionId'], screens: 2, shots: 14 },
  { area: '관리자', routes: ['/(app)/manage'], screens: 1, shots: 13 },
  { area: '공통', routes: ['/(app)/notifications', '/(app)/profile'], screens: 2, shots: 2 },
];

/** 화면 ID 맵. */
export const idMap = [
  { id: 'GK-001', route: '/login', name: '로그인', role: '공통', file: 'app/(auth)/login.tsx' },
  { id: 'GK-002', route: '/signup', name: '회원가입', role: '공통', file: 'app/(auth)/signup.tsx' },
  { id: 'GK-003', route: '/find-account', name: '계정 찾기 · 비밀번호 재설정', role: '공통', file: 'app/(auth)/find-account.tsx' },
  { id: 'GK-010', route: '/(app)', name: '홈 — 지점 · 시간표', role: '전체', file: 'app/(app)/index.tsx' },
  { id: 'GK-020', route: '/session/:id', name: '수업 상세 · 예약', role: '회원', file: 'app/session/[id].tsx' },
  { id: 'GK-021', route: '/(app)/reservations', name: '내 예약', role: '회원', file: 'app/(app)/reservations.tsx' },
  { id: 'GK-030', route: '/(app)/memberships', name: '이용권', role: '회원', file: 'app/(app)/memberships.tsx' },
  { id: 'GK-040', route: '/place/:id', name: '지점 상세 — 강습 · 이용권 · 게시판', role: '전체', file: 'app/place/[id].tsx' },
  { id: 'GK-041', route: '/post/:id', name: '게시글 · 댓글', role: '전체', file: 'app/post/[id].tsx' },
  { id: 'GK-050', route: '/(app)/classes', name: '트레이너 — 수업 · 강습 · 소속', role: '트레이너', file: 'app/(app)/classes.tsx' },
  { id: 'GK-051', route: '/roster/:sessionId', name: '출석 관리', role: '트레이너', file: 'app/roster/[sessionId].tsx' },
  { id: 'GK-060', route: '/(app)/manage', name: '운영 — 환불 · 승인 · 시설', role: '관리자', file: 'app/(app)/manage.tsx' },
  { id: 'GK-070', route: '/(app)/notifications', name: '알림함', role: '전체', file: 'app/(app)/notifications.tsx' },
  { id: 'GK-071', route: '/(app)/profile', name: '내 정보', role: '전체', file: 'app/(app)/profile.tsx' },
];

/**
 * 화면별 상세.
 * shots: [{ file, caption }] — 좌측에 나열된다.
 * spec:  [{ label, body }]   — 우측 SCREEN SPEC 카드.
 * proof: string[]            — 검증 근거. 실제로 무엇을 확인했는지만 적는다.
 */
export const screens = [
  {
    section: 'D01 · 인증',
    id: 'GK-001',
    title: '로그인',
    route: '/login · app/(auth)/login.tsx',
    shots: [
      { file: '01_login.png', caption: '로그인 화면' },
      { file: '02_login-failed.png', caption: '자격 불일치 — 화면 유지' },
    ],
    spec: [
      { label: '구성 요소', body: '브랜드 · 이메일 · 비밀번호 · [로그인] · 회원가입/계정 찾기 링크 · 개발용 테스트 계정 버튼' },
      { label: '인증 방식', body: 'POST /api/auth/login. BCrypt로 검증하고 액세스 토큰(JWT)과 리프레시 토큰을 함께 발급한다. 리프레시 토큰은 원문이 아니라 SHA-256 해시로 DB에 저장한다.' },
      { label: '토큰 보관', body: '네이티브는 SecureStore(키체인·키스토어), 웹은 AsyncStorage. 401 + TOKEN_EXPIRED가 오면 인터셉터가 한 번만 재발급하고 원 요청을 재시도한다. 동시 401이 몰려도 갱신은 1회다.' },
      { label: '실패 처리', body: '자격 불일치는 화면을 유지한 채 서버가 준 문구를 그대로 보여준다. 다른 화면으로 보내지 않는다.' },
      { label: '역할 분기', body: '로그인 후 role(MEMBER/TRAINER/ADMIN/SUPER_ADMIN)에 따라 탭 구성이 달라진다.' },
    ],
    proof: [
      'E2E "잘못된 비밀번호는 화면에 머문 채 사유를 알려준다"가 LOGIN_FAILED 문구 노출을 확인한다',
      '캡처는 로그인 화면 자체를 찍은 것이며 자격증명을 입력하지 않았다',
    ],
  },
  {
    section: 'D02 · 홈',
    id: 'GK-010',
    title: '홈 — 지점과 시간표',
    route: '/(app) · app/(app)/index.tsx',
    shots: [
      { file: '03_home-timetable.png', caption: '강남점 시간표' },
      { file: '04_home-place-switched.png', caption: '홍대점으로 전환' },
    ],
    spec: [
      { label: '기본 지점', body: '즐겨찾기한 지점이 있으면 그 지점을 먼저 연다. 없으면 목록의 첫 지점.' },
      { label: '시간표 축', body: '지점 × 날짜. 상단 날짜 스트립은 오늘부터 14일. 선택 즉시 GET /api/places/{id}/sessions?date=&days=1 로 다시 그린다.' },
      { label: '카드 정보', body: '시작 시각 · 소요 시간 · 강습명 · 트레이너 · 강습실 · 종류 · 잔여 자리 · 예약/정원.' },
      { label: '내 예약 표시', body: '로그인 상태면 각 회차에 reservedByMe가 채워져 "예약함" 배지가 붙는다. 회차 수만큼 조회하지 않고 한 번의 IN 쿼리로 가져온다.' },
      { label: '비로그인', body: '지점·시간표 조회는 열려 있다. 예약만 인증을 요구한다.' },
    ],
    proof: [
      '지점 칩을 바꾸면 시간표가 해당 지점 것으로 교체되는 것을 E2E가 확인한다',
      '"예약함" 배지는 서버가 내려준 reservedByMe 값을 그대로 쓴다',
    ],
  },
  {
    section: 'D03 · 예약',
    id: 'GK-020',
    title: '수업 상세 · 예약',
    route: '/session/:id · app/session/[id].tsx',
    shots: [
      { file: '05_session-detail.png', caption: '예약 전' },
      { file: '06_reserve-done.png', caption: '예약 직후 — 정원·잔여 즉시 반영' },
      { file: '07_reserve-duplicate-blocked.png', caption: '중복 예약 불가' },
    ],
    spec: [
      { label: '핵심', body: 'v1 스키마에는 예약을 만드는 로직이 아예 없었다(INSERT INTO class_reservation 0건). 이 화면이 그 흐름을 처음 완성한다.' },
      { label: '트랜잭션', body: '회차 행과 이용권 행을 비관적 락으로 잠그고 → 예약 가능 검사 → 이용권 1회 차감 → 정원 증가 → 예약 생성을 한 트랜잭션에서 처리한다.' },
      { label: '중복 차단', body: 'DB에 UNIQUE(session_id, member_user_id)를 두고, 락을 뚫고 동시에 들어온 요청은 제약 위반을 ALREADY_RESERVED로 변환한다.' },
      { label: '이용권 선택', body: '지정하지 않으면 만료가 임박한 것부터 자동 선택한다. 지점과 수업 종류(그룹/개인)가 모두 맞아야 한다.' },
      { label: '예외 안내', body: 'NO_USABLE_MEMBERSHIP이면 이용권 구매 화면으로 갈지 물어본다. 정원 마감·이미 시작은 버튼 단계에서 막는다.' },
    ],
    proof: [
      'E2E가 예약 전후 GET /api/me/memberships 를 비교해 잔여가 정확히 1 줄어드는 것을 확인한다',
      '예약 후 같은 화면에서 예약 버튼이 사라지고 취소 버튼만 남는다',
    ],
  },
  {
    section: 'D03 · 예약',
    id: 'GK-021',
    title: '예약 취소 · 내 예약',
    route: '/(app)/reservations · app/(app)/reservations.tsx',
    shots: [
      { file: '09_cancel-confirm.png', caption: '취소 확인' },
      { file: '10_cancel-done.png', caption: '취소 후 — 이용권 복원' },
      { file: '08_my-reservations.png', caption: '내 예약 목록' },
    ],
    spec: [
      { label: '취소 기한', body: '수업 시작 2시간 전까지. 기한이 지나면 버튼 대신 사유 문구를 보여준다. 판정은 서버가 내려준 cancelable을 따른다.' },
      { label: '이용권 복원', body: '취소 시 차감했던 이용권을 되돌리고 정원을 줄인다. 노쇼는 복원하지 않는다.' },
      { label: '수업 취소와의 차이', body: '트레이너가 수업을 취소하면 회원 귀책이 아니므로 기한과 무관하게 전원 복원한다.' },
      { label: '목록 구성', body: '예정(RESERVED) / 지난 내역(출석·노쇼·취소) 두 탭.' },
      { label: '확인 다이얼로그', body: 'react-native-web에는 Alert 구현이 없어 웹에서 무반응이었다. 직접 만든 모달로 네이티브·웹 모두에서 같게 동작한다.' },
    ],
    proof: [
      'E2E가 취소 전후 잔여 횟수를 비교해 정확히 1 복원되는 것을 확인한다',
      '취소 확인 다이얼로그가 웹 브라우저에서 실제로 떠서 조작 가능한 상태다',
    ],
  },
  {
    section: 'D04 · 이용권',
    id: 'GK-030',
    title: '이용권 · 환불',
    route: '/(app)/memberships · app/(app)/memberships.tsx',
    shots: [
      { file: '11_memberships.png', caption: '보유 이용권' },
      { file: '12_membership-refunded-no-button.png', caption: '환불 완료 건 — 버튼 없음' },
    ],
    spec: [
      { label: '표시', body: '상품명 · 지점 · 이용 범위 · 잔여/전체 · 사용 비율 · 만료일과 남은 일수. 만료 14일 이내면 경고 문구.' },
      { label: '환불 금액', body: '잔여 횟수 비율로 계산한다. 사용분은 차감된다. 예: 150,000원 10회권에서 7회 남으면 105,000원.' },
      { label: '환불 절차', body: '회원 요청 → 관리자 승인/거절. 승인 시에만 이용권이 REFUNDED로 소멸하고 결제가 취소 처리된다.' },
      { label: '재환불 차단', body: 'v1 회고에 미해결로 남아 있던 문제다. 이미 환불·만료·잔여 0인 이용권은 상태 검사에서 걸러 MEMBERSHIP_NOT_REFUNDABLE로 응답한다.' },
      { label: '차감 시점', body: 'v1은 출석 시점에만 차감해 잔여 0회여도 예약이 무제한이었다. v2는 예약 시점에 차감한다.' },
    ],
    proof: [
      '환불 완료된 이용권에는 환불 버튼 자체가 렌더링되지 않는다(E2E 확인)',
      'API 스모크 테스트 16번이 재환불 요청에 "이미 환불된 이용권입니다."를 반환하는 것을 확인한다',
    ],
  },
  {
    section: 'D04 · 이용권',
    id: 'GK-040',
    title: '지점 상세 · 이용권 구매',
    route: '/place/:id · app/place/[id].tsx',
    shots: [
      { file: '13_place-plans.png', caption: '판매 중인 이용권' },
      { file: '14_purchase-confirm.png', caption: '구매 확인' },
      { file: '15_purchase-done.png', caption: '구매 완료' },
    ],
    spec: [
      { label: '탭 구성', body: '강습·트레이너 / 이용권 / 게시판. 즐겨찾기 토글은 헤더의 별.' },
      { label: '이용권 상품', body: 'v1은 상품이 수업 1회(class_id)에 묶여 10회권이 성립하지 않았다. v2는 지점 + 이용 범위(그룹/개인/전체) 기준이다.' },
      { label: '결제', body: 'PG 연동은 비용이 발생해 붙이지 않았다. 결제 레코드는 만들되 즉시 PAID로 처리한다. 실제 연동 시 PENDING으로 만들고 콜백에서 markPaid를 부르도록 한 곳만 바꾸면 된다.' },
      { label: '구매 스냅샷', body: '구매 시점의 횟수·가격을 이용권에 복사한다. 이후 상품이 바뀌어도 보유 이용권은 영향받지 않는다.' },
      { label: '트레이너', body: '트레이너로 보면 "이 지점에 소속 신청" 버튼이 추가된다.' },
    ],
    proof: [
      'E2E가 이용권 없는 지점에서 구매 → 완료 안내까지 실제로 진행한다',
      '구매 후 이용권 탭과 결제 내역에 즉시 반영된다',
    ],
  },
  {
    section: 'D05 · 커뮤니티',
    id: 'GK-041',
    title: '게시판 · 댓글',
    route: '/place/:id · /post/:id',
    shots: [
      { file: '16_post-form.png', caption: '글쓰기' },
      { file: '17_post-created.png', caption: '등록 결과' },
      { file: '33_trainer-comment.png', caption: '트레이너 댓글' },
    ],
    spec: [
      { label: '작성 권한', body: 'v1은 게시글이 트레이너 전용, 댓글이 회원 전용이었다. v2는 작성자를 app_user로 통일해 세 역할 모두 쓸 수 있다.' },
      { label: '분류', body: '공지 / 자유 / 문의. 공지는 트레이너 이상만 고를 수 있고, 서버도 회원의 공지 작성을 거부한다.' },
      { label: 'v1 결함', body: 'v1의 sp_댓글_작성은 존재하지 않는 coment 테이블을 참조해 항상 실패했다. 트레이너 댓글은 구현 자체가 불가능했다.' },
      { label: '알림 연동', body: '댓글이 달리면 글쓴이에게 알림이 생긴다. 본인 글에 본인이 단 댓글은 알리지 않는다.' },
      { label: '대댓글', body: '1단계까지만 허용한다. 답글에 답글은 서버가 막는다.' },
    ],
    proof: [
      '회원이 문의글을 작성하고 목록에 나타나는 것을 E2E가 확인한다',
      '트레이너 계정으로 댓글을 달아 authorRole=TRAINER로 저장되는 것을 확인한다',
      '회원이 공지 작성을 시도하면 FORBIDDEN이 반환된다(스모크 테스트 15번)',
    ],
  },
  {
    section: 'D06 · 트레이너',
    id: 'GK-050',
    title: '강습 · 회차 개설',
    route: '/(app)/classes · app/(app)/classes.tsx',
    shots: [
      { file: '23_trainer-program-form.png', caption: '강습 개설' },
      { file: '25_trainer-session-form.png', caption: '회차 개설' },
      { file: '26_trainer-session-created.png', caption: '일정에 반영' },
    ],
    spec: [
      { label: '2단 구조', body: '강습(정의)과 회차(실제 예약 대상)를 분리했다. v1의 class는 시각 하나짜리 단일 회차여서 10회권과 모순이었다.' },
      { label: '개설 조건', body: '해당 지점에 ACTIVE로 승인된 트레이너만 개설할 수 있다. 승인 전이면 버튼이 비활성이고 사유를 함께 보여준다.' },
      { label: '종료 시각', body: '강습의 소요 시간으로 자동 계산한다. v1은 종료 시각 컬럼이 없어 진행중 판정을 2시간으로 하드코딩했다.' },
      { label: '강습실 충돌', body: '실제 구간 겹침(start < :end AND end > :start)으로 판정한다. v1은 1시간 고정이었고, room_reserve라는 별도 경로가 있어 같은 방이 이중으로 잡힐 수 있었다.' },
      { label: '반복 개설', body: '매주 같은 요일·시간으로 여러 주를 한 번에 열 수 있다. 충돌하는 주는 건너뛰고 성공한 회차만 반환한다.' },
    ],
    proof: [
      'E2E가 강습을 만들고 그 강습의 회차를 개설해 수업 일정에 나타나는 것까지 확인한다',
      '승인되지 않은 지점은 선택지에 나오지 않는다',
    ],
  },
  {
    section: 'D06 · 트레이너',
    id: 'GK-051',
    title: '출석 관리',
    route: '/roster/:sessionId · app/roster/[sessionId].tsx',
    shots: [
      { file: '27_trainer-roster.png', caption: '예약자 명단' },
      { file: '28_trainer-roster-marked.png', caption: '출석 체크' },
      { file: '29_trainer-attendance-saved.png', caption: '저장 결과' },
    ],
    spec: [
      { label: '명단', body: '해당 회차의 취소되지 않은 예약자. v1은 강습을 만들 때마다 전체 회원을 출석 테이블에 넣고 그 수를 예약 인원으로 표시해 값이 항상 틀렸다.' },
      { label: '상태 3종', body: '출석 / 노쇼 / 미체크. 로컬에 모아두었다가 [N명 저장]으로 한 번에 전송한다. 변경이 없으면 버튼이 비활성이다.' },
      { label: '이중 차감 없음', body: '이용권은 예약 시점에 이미 차감했으므로 출석 처리는 상태만 바꾼다.' },
      { label: '노쇼', body: '차감을 유지한다. 되돌리지 않는 것이 정책이다.' },
      { label: '정정', body: '미체크로 되돌리면 예약 상태로 복귀한다.' },
    ],
    proof: [
      'E2E가 출석으로 표시 → 저장 → "저장 완료" 안내까지 실제로 진행한다',
      '헤더의 "출석 N / 예약 M"이 선택에 따라 즉시 갱신된다',
    ],
  },
  {
    section: 'D06 · 트레이너',
    id: 'GK-050',
    title: '수업 취소 · 소속 지점',
    route: '/(app)/classes',
    shots: [
      { file: '30_trainer-cancel-confirm.png', caption: '수업 취소 확인' },
      { file: '31_trainer-cancel-done.png', caption: '복원 건수 안내' },
      { file: '32_trainer-places.png', caption: '소속 상태' },
    ],
    spec: [
      { label: '수업 취소', body: '예약자 전원의 예약을 취소하고 이용권을 복원한 뒤, 각자에게 알림을 남긴다. 취소된 건수를 그대로 알려준다.' },
      { label: '권한', body: '본인이 개설한 수업만 취소할 수 있다. 서버가 프로그램 소유자를 검사한다.' },
      { label: '소속 신청', body: '지점 상세에서 신청하면 PENDING으로 남고, 관리자가 승인해야 ACTIVE가 된다.' },
      { label: 'v1 결함', body: 'v1은 승인 대기를 ENUM에 없는 값(\'N\')으로 넣으려 해 INSERT 자체가 실패했다. v2는 PENDING/ACTIVE/REJECTED/INACTIVE로 정식 표현한다.' },
      { label: '표시', body: '승인 대기 중인 지점은 배지와 안내 문구로 구분된다.' },
    ],
    proof: [
      'E2E가 수업을 취소하고 "N건의 예약이 취소되고 이용권이 복원되었습니다" 안내를 확인한다',
      '잠실점이 승인 대기 상태로 표시되는 것을 확인한다',
    ],
  },
  {
    section: 'D07 · 관리자',
    id: 'GK-060',
    title: '환불 승인 · 트레이너 승인',
    route: '/(app)/manage · app/(app)/manage.tsx',
    shots: [
      { file: '36_admin-pending-trainers.png', caption: '승인 대기 목록' },
      { file: '37_admin-approve-confirm.png', caption: '승인 확인' },
      { file: '38_admin-approve-done.png', caption: '승인 완료' },
    ],
    spec: [
      { label: '담당 범위', body: 'ADMIN은 자신이 맡은 지점만, SUPER_ADMIN은 전 지점. v1의 admin 테이블에는 place_id가 없어 이 구분 자체가 불가능했다.' },
      { label: '환불 처리', body: '요청 → 승인/거절. 승인 시에만 이용권이 소멸하고 결제가 취소된다. 이미 처리된 요청은 400으로 거절한다.' },
      { label: '트레이너 승인', body: 'PENDING인 소속 신청을 승인하면 그 지점에서 강습을 개설할 수 있게 된다.' },
      { label: '고친 결함', body: '승인 대기 목록이 userId만 내려줘 승인 API(place_trainer PK를 받음)를 호출할 수 없었다. PendingTrainer DTO를 만들어 placeTrainerId를 함께 반환하도록 고쳤다.' },
      { label: '되돌리기', body: '거절해도 이력은 남는다. 트레이너는 다시 신청할 수 있다.' },
    ],
    proof: [
      'E2E가 잠실점의 승인 대기 트레이너를 승인해 목록에서 사라지는 것을 확인한다',
      'API가 placeTrainerId(5)와 userId(4)를 구분해 내려주는 것을 확인했다',
    ],
  },
  {
    section: 'D07 · 관리자',
    id: 'GK-060',
    title: '시설 · 상품 · 지점 등록',
    route: '/(app)/manage — 시설·상품 탭',
    shots: [
      { file: '39_admin-facility.png', caption: '시설·상품' },
      { file: '42_admin-plan-form.png', caption: '상품 등록' },
      { file: '45_admin-place-created.png', caption: '새 지점이 홈에 노출' },
    ],
    spec: [
      { label: '강습실', body: '지점별로 등록한다. 트레이너가 회차를 열 때 이 목록에서 고른다.' },
      { label: '이용권 상품', body: '이용 범위 · 횟수 · 가격 · 유효기간. 등록 즉시 회원의 지점 상세에서 구매할 수 있다.' },
      { label: '지점', body: 'SUPER_ADMIN만 등록할 수 있다. 위경도를 넣으면 "내 주변 지점"에 노출된다. v1 스키마에는 좌표가 없어 이 화면 자체가 불가능했다.' },
      { label: '폐점', body: '물리 삭제가 아니라 deleted_at 기반 소프트 삭제. v1은 DELETE라 FK 참조가 있으면 실패하거나 결제·예약 이력이 사라졌다.' },
      { label: '입력 검증', body: '위도 -90~90, 경도 -180~180, 횟수·가격·기간의 하한을 화면과 서버 양쪽에서 본다.' },
    ],
    proof: [
      'E2E가 강습실·상품·지점을 실제로 등록하고 목록에 반영되는 것을 확인한다',
      '등록한 판교점이 홈 지점 목록에 즉시 나타난다',
    ],
  },
  {
    section: 'D08 · 공통',
    id: 'GK-070',
    title: '알림함 · 권한 분리',
    route: '/(app)/notifications · 권한 검사',
    shots: [
      { file: '18_notifications.png', caption: '알림함' },
      { file: '34_admin-tabs.png', caption: '관리자 탭' },
      { file: '46_member-forbidden-admin.png', caption: '회원의 관리자 화면 접근' },
    ],
    spec: [
      { label: '알림 종류', body: '예약 확정 · 수업 취소 · 이용권 만료 임박 · 결제 · 댓글 · 공지.' },
      { label: '딥링크', body: 'linkType/linkId로 수업 상세, 게시글, 이용권 화면으로 바로 이동한다. 누르면 읽음 처리된다.' },
      { label: '푸시', body: '기기 토큰을 저장하는 자리와 발송 지점은 만들어 두었고, 실제 전송은 붙이지 않았다. 알림함 기록은 전송과 무관하게 남는다.' },
      { label: '역할별 탭', body: '회원은 내 예약·이용권, 트레이너는 내 수업, 관리자는 운영 탭을 본다. 없는 탭은 탭바에서 감춘다.' },
      { label: '서버 검사', body: '탭을 감추는 것만으로는 부족하다. /api/admin/**는 서버에서 ADMIN 이상만 통과시키고, URL로 직접 들어가도 403이 반환된다.' },
    ],
    proof: [
      '회원 계정으로 /manage에 직접 들어가면 "권한이 없습니다."가 표시된다(E2E 확인)',
      '스모크 테스트 12번이 회원 토큰으로 관리자 API 호출 시 403을 확인한다',
      '역할별로 탭 구성이 다른 것을 세 계정으로 각각 확인했다',
    ],
  },
];

/** 콘솔 증적 슬라이드. */
export const consoleShots = [
  {
    file: '01_db-schema-loaded.png',
    title: '스키마 v2 적재',
    note: 'MariaDB 11.4 컨테이너에 테이블 23종과 뷰 2종이 올라간 상태.',
  },
  {
    file: '02_db-seed-counts.png',
    title: '시드 데이터',
    note: '초기화 후 재적재. 강습 회차는 상대 날짜라 언제 실행해도 예정 수업이 있다.',
  },
  {
    file: '03_backend-startup.png',
    title: '스키마 검증 통과',
    note: 'ddl-auto=validate. 엔티티와 DB가 어긋나면 기동 자체가 실패한다.',
  },
  {
    file: '04_verification-code-log.png',
    title: '인증번호 — 콘솔 출력',
    note: 'SMS·메일 발송기는 유료라 붙이지 않았다. 발송 지점만 분리해 두었다.',
  },
  {
    file: '05_api-smoke-test.png',
    title: 'API 스모크 테스트',
    note: '예약·차감·복원·권한·재환불 차단을 서버 단에서 16개 항목으로 확인.',
  },
  {
    file: '06_app-typecheck.png',
    title: '앱 타입 검사',
    note: '서버 DTO와 앱 타입이 어긋나면 여기서 걸린다.',
  },
  {
    file: '07_backend-build.png',
    title: '백엔드 빌드',
    note: '로컬에 JDK가 없어 gradle:8.12-jdk21 컨테이너에서 빌드했다.',
  },
  {
    file: '08_e2e-result.png',
    title: 'E2E 28/28',
    note: '회원·트레이너·관리자 전 시나리오를 실제 브라우저에서 주행한 결과.',
  },
];
