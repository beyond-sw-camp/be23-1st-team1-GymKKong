import { expect, test } from '@playwright/test';

import {
  ACCOUNTS,
  WEB_URL,
  apiGet,
  apiLogin,
  evidence,
  gotoTab,
  login,
  pressDialog,
  waitApp,
} from './helpers';

/**
 * 회원 시나리오.
 * 각 단계에서 서버 상태까지 확인해, 화면만 그럴듯한 게 아니라
 * 실제로 데이터가 바뀌었는지 본다.
 */
/** 강남점(placeId=1) 활성 이용권의 잔여 횟수. */
async function gangnamRemain(token: string): Promise<number> {
  const list = await apiGet<{ placeId: number; status: string; remainCount: number }[]>(
    token,
    '/api/me/memberships',
  );
  return list.find((m) => m.placeId === 1 && m.status === 'ACTIVE')!.remainCount;
}

test.describe('회원', () => {
  test('로그인 화면', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${WEB_URL}/login`);
    await waitApp(page);

    await expect(page.getByText('수업 예약부터 출석까지 한 번에')).toBeVisible();
    await evidence(page, 'login');
  });

  test('잘못된 비밀번호는 화면에 머문 채 사유를 알려준다', async ({ page }) => {
    await page.goto(`${WEB_URL}/login`);
    await waitApp(page);

    await page.getByPlaceholder('you@example.com').fill(ACCOUNTS.member.email);
    await page.getByPlaceholder('비밀번호').first().fill('wrong-password');
    await page.getByRole('button', { name: '로그인', exact: true }).click();

    await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeVisible();
    await evidence(page, 'login-failed');
  });

  test('홈 — 지점 선택과 날짜별 시간표', async ({ page }) => {
    await login(page, ACCOUNTS.member);

    await expect(page.getByText('짐꽁 강남점').first()).toBeVisible();
    await expect(page.getByText('아침 요가').first()).toBeVisible();
    await evidence(page, 'home-timetable');

    // 다른 지점으로 전환하면 시간표가 그 지점 것으로 바뀐다.
    await page.getByText('짐꽁 홍대점').first().click();
    await page.waitForTimeout(1200);
    await expect(page.getByText('필라테스 기구').first()).toBeVisible();
    await evidence(page, 'home-place-switched');
  });

  test('수업 상세 — 예약 현황과 사용할 이용권', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    await page.goto(`${WEB_URL}/session/7`);
    await waitApp(page);

    await expect(page.getByText('근력 스트렝스')).toBeVisible();
    await expect(page.getByText('사용할 이용권')).toBeVisible();
    await expect(page.getByRole('button', { name: '예약하기' })).toBeVisible();
    await evidence(page, 'session-detail');
  });

  test('예약하면 정원과 이용권 잔여가 동시에 움직인다', async ({ page }) => {
    const token = await apiLogin(ACCOUNTS.member.email, ACCOUNTS.member.password);
    // 이 회원은 지점별로 이용권을 여러 개 가질 수 있으므로 강남점(placeId=1) 것만 본다.
    const remainBefore = await gangnamRemain(token);

    await login(page, ACCOUNTS.member);
    await page.goto(`${WEB_URL}/session/7`);
    await waitApp(page);

    await page.getByRole('button', { name: '예약하기' }).click();
    await pressDialog(page, '확인');

    // 화면 반영 확인
    await expect(page.getByRole('button', { name: '예약 취소' })).toBeVisible();
    await evidence(page, 'reserve-done');

    // 서버 상태 확인 — 화면만 바뀐 게 아니어야 한다.
    expect(await gangnamRemain(token)).toBe(remainBefore - 1);
  });

  test('같은 수업을 두 번 예약할 수 없다', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    // 이미 예약한 상태이므로 예약 버튼이 사라지고 취소 버튼만 남는다.
    await page.goto(`${WEB_URL}/session/7`);
    await waitApp(page);

    await expect(page.getByRole('button', { name: '예약하기' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '예약 취소' })).toBeVisible();
    await evidence(page, 'reserve-duplicate-blocked');
  });

  test('내 예약 목록에 새 예약이 보인다', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    await gotoTab(page, '내 예약');

    await expect(page.getByText('근력 스트렝스').first()).toBeVisible();
    await evidence(page, 'my-reservations');
  });

  test('예약을 취소하면 이용권이 복원된다', async ({ page }) => {
    const token = await apiLogin(ACCOUNTS.member.email, ACCOUNTS.member.password);
    const remainBefore = await gangnamRemain(token);

    await login(page, ACCOUNTS.member);
    await page.goto(`${WEB_URL}/session/7`);
    await waitApp(page);

    await page.getByRole('button', { name: '예약 취소' }).click();
    await expect(page.getByTestId('dialog-title')).toHaveText('예약을 취소할까요?');
    await evidence(page, 'cancel-confirm');

    await pressDialog(page, '예약 취소');
    await expect(page.getByRole('button', { name: '예약하기' })).toBeVisible();
    await evidence(page, 'cancel-done');

    expect(await gangnamRemain(token)).toBe(remainBefore + 1);
  });

  test('이용권 화면 — 잔여 횟수와 예상 환불액', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    await gotoTab(page, '이용권');

    await expect(page.getByText('그룹 10회권').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '환불 요청' }).first()).toBeVisible();
    await evidence(page, 'memberships');
  });

  test('이미 환불된 이용권은 다시 환불되지 않는다', async ({ page }) => {
    // v1 회고에 미해결로 남아 있던 케이스.
    await login(page, ACCOUNTS.refunded);
    await gotoTab(page, '이용권');

    await expect(page.getByText('환불됨').first()).toBeVisible();
    // 환불된 이용권에는 환불 버튼 자체가 뜨지 않는다.
    await expect(page.getByRole('button', { name: '환불 요청' })).toHaveCount(0);
    await evidence(page, 'membership-refunded-no-button');
  });

  test('이용권 구매 — 지점 상세에서 즉시 발급', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    await page.goto(`${WEB_URL}/place/2`); // 홍대점 — 이 회원은 이용권이 없다
    await waitApp(page);

    await page.getByText('이용권', { exact: true }).first().click();
    await page.waitForTimeout(700);
    await evidence(page, 'place-plans');

    await page.getByRole('button', { name: '구매' }).first().click();
    await expect(page.getByTestId('dialog-title')).toHaveText('이용권을 구매할까요?');
    await evidence(page, 'purchase-confirm');

    await pressDialog(page, '구매');
    await expect(page.getByTestId('dialog-title')).toHaveText('구매 완료');
    await evidence(page, 'purchase-done');
    await pressDialog(page, '확인');
  });

  test('게시글 작성과 댓글', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    await page.goto(`${WEB_URL}/place/1`);
    await waitApp(page);

    await page.getByText('게시판', { exact: true }).click();
    await page.waitForTimeout(700);

    await page.getByRole('button', { name: '글쓰기' }).click();
    await expect(page.getByTestId('form-sheet')).toBeVisible();

    await page.getByPlaceholder('제목을 입력하세요').fill('샤워실 이용 시간 문의');
    await page.getByPlaceholder('내용을 입력하세요').fill('수업 끝나고 몇 시까지 쓸 수 있나요?');
    await evidence(page, 'post-form');

    await page.getByRole('button', { name: '등록' }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByText('샤워실 이용 시간 문의').first()).toBeVisible();
    await evidence(page, 'post-created');
  });

  test('알림함 — 예약·결제 알림이 쌓인다', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    await gotoTab(page, '알림');

    await expect(page.getByText('예약이 확정되었습니다').first()).toBeVisible();
    await evidence(page, 'notifications');
  });

  test('내 정보 — 프로필과 결제 내역', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    await gotoTab(page, '내 정보');

    await expect(page.getByText(ACCOUNTS.member.name).first()).toBeVisible();
    await expect(page.getByText('결제 내역')).toBeVisible();
    await evidence(page, 'profile');
  });
});
