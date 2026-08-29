import { expect, test } from '@playwright/test';

import { ACCOUNTS, WEB_URL, evidence, gotoTab, login, pressDialog, tab, waitApp } from './helpers';

/** 트레이너 시나리오. 역할에 따라 탭 구성이 달라지는 것부터 확인한다. */
test.describe('트레이너', () => {
  test('역할에 따라 탭이 달라진다', async ({ page }) => {
    await login(page, ACCOUNTS.trainer);

    // 트레이너에게는 회원 전용 탭이 없다.
    await expect(tab(page, '내 수업')).toBeVisible();
    await expect(tab(page, '내 예약')).toHaveCount(0);
    await expect(tab(page, '이용권')).toHaveCount(0);
    await evidence(page, 'trainer-tabs');
  });

  test('내 수업 일정', async ({ page }) => {
    await login(page, ACCOUNTS.trainer);
    await gotoTab(page, '내 수업');

    await expect(page.getByText('아침 요가').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '출석 관리' }).first()).toBeVisible();
    await evidence(page, 'trainer-sessions');
  });

  test('강습 개설', async ({ page }) => {
    await login(page, ACCOUNTS.trainer);
    await gotoTab(page, '내 수업');

    await page.getByTestId('tab-PROGRAMS').click();
    await page.waitForTimeout(900);
    await evidence(page, 'trainer-programs');

    await page.getByRole('button', { name: '강습 개설' }).click();
    await expect(page.getByTestId('form-sheet')).toBeVisible();

    await page.getByPlaceholder('아침 요가').fill('저녁 스트레칭');
    await page.getByPlaceholder('하루를 여는 60분 빈야사 요가.').fill('하루를 정리하는 40분 스트레칭.');
    await evidence(page, 'trainer-program-form');

    await page.getByRole('button', { name: '개설', exact: true }).click();
    await page.waitForTimeout(1800);
    await expect(page.getByText('저녁 스트레칭').first()).toBeVisible();
    await evidence(page, 'trainer-program-created');
  });

  test('회차 개설 — 종료 시각은 소요 시간으로 자동 계산', async ({ page }) => {
    await login(page, ACCOUNTS.trainer);
    await gotoTab(page, '내 수업');
    await page.getByTestId('tab-PROGRAMS').click();
    await page.waitForTimeout(900);

    // 방금 만든 강습의 회차를 연다.
    // 방금 만든 강습 카드의 '회차 개설'을 누른다. 목록은 생성 역순이라 첫 번째다.
    await page.getByRole('button', { name: '회차 개설' }).first().click();
    await expect(page.getByTestId('form-sheet')).toBeVisible();
    await evidence(page, 'trainer-session-form');

    await page.getByPlaceholder('19:00').fill('21:30');
    await page.getByRole('button', { name: '개설', exact: true }).click();
    await page.waitForTimeout(1800);

    await page.getByTestId('tab-SESSIONS').click();
    await page.waitForTimeout(1200);
    await expect(page.getByText('저녁 스트레칭').first()).toBeVisible();
    await evidence(page, 'trainer-session-created');
  });

  test('출석 관리 — 예약자 명단에 상태를 기록한다', async ({ page }) => {
    await login(page, ACCOUNTS.trainer);
    await page.goto(`${WEB_URL}/roster/2`);
    await waitApp(page);

    await expect(page.getByText('아침 요가').first()).toBeVisible();
    await expect(page.getByText(ACCOUNTS.member.name).first()).toBeVisible();
    await evidence(page, 'trainer-roster');

    // 시드의 예약은 "지금보다 뒤인 첫 회차"에 붙는다. 07:00을 지난 시각에 돌리면
    // 이 회차가 이미 출석 처리된 상태여서 [출석]을 눌러도 변경이 없다.
    // 어느 쪽이든 변경이 생기도록 한 번 더 분기한다.
    // 저장 버튼은 변경이 있을 때만 "N명 저장"으로 라벨이 바뀐다.
    // 라벨로 집으면 변경이 없을 때 영영 기다리게 되므로 testID로 집는다.
    const save = page.getByTestId('save-attendance');
    await page.getByRole('button', { name: '출석', exact: true }).first().click();
    await page.waitForTimeout(400);
    if (!/명 저장/.test((await save.textContent()) ?? '')) {
      await page.getByRole('button', { name: '노쇼', exact: true }).first().click();
      await page.waitForTimeout(400);
    }
    await expect(save).toBeEnabled();
    await evidence(page, 'trainer-roster-marked');

    await expect(save).toHaveText(/명 저장/);
    await save.click();
    await expect(page.getByTestId('dialog-title')).toHaveText('저장 완료');
    await evidence(page, 'trainer-attendance-saved');
    await pressDialog(page, '확인');
  });

  test('수업 취소 — 예약자 이용권이 복원된다', async ({ page }) => {
    await login(page, ACCOUNTS.trainer);
    await gotoTab(page, '내 수업');

    await page.getByRole('button', { name: '수업 취소' }).first().click();
    await expect(page.getByTestId('dialog-title')).toHaveText('수업을 취소할까요?');
    await evidence(page, 'trainer-cancel-confirm');

    await pressDialog(page, '수업 취소');
    await expect(page.getByTestId('dialog-title')).toHaveText('취소 완료');
    await evidence(page, 'trainer-cancel-done');
    await pressDialog(page, '확인');
  });

  test('소속 지점 — 승인 상태가 보인다', async ({ page }) => {
    await login(page, ACCOUNTS.trainer);
    await gotoTab(page, '내 수업');
    await page.getByTestId('tab-PLACES').click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('짐꽁 강남점').first()).toBeVisible();
    await expect(page.getByText('승인 대기').first()).toBeVisible(); // 잠실점
    await evidence(page, 'trainer-places');
  });

  test('트레이너도 게시판에 댓글을 쓸 수 있다', async ({ page }) => {
    // v1에서는 comment.member_id가 NOT NULL이라 불가능했던 동작.
    await login(page, ACCOUNTS.trainer);
    await page.goto(`${WEB_URL}/post/1`);
    await waitApp(page);

    await page.getByPlaceholder('댓글을 입력하세요').fill('12월 프로그램은 매트만 준비하시면 됩니다.');
    await page.getByRole('button', { name: '등록' }).click();
    await page.waitForTimeout(1500);

    await expect(page.getByText('12월 프로그램은 매트만 준비하시면 됩니다.').first()).toBeVisible();
    await evidence(page, 'trainer-comment');
  });
});
