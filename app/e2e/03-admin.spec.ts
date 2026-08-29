import { expect, test } from '@playwright/test';

import { ACCOUNTS, WEB_URL, evidence, gotoTab, login, pressDialog, tab, waitApp } from './helpers';

/** 관리자 시나리오. 권한 분리와 운영 기능. */
test.describe('관리자', () => {
  test('관리자 탭 구성', async ({ page }) => {
    await login(page, ACCOUNTS.admin);

    await expect(tab(page, '운영')).toBeVisible();
    await expect(tab(page, '내 예약')).toHaveCount(0);
    await evidence(page, 'admin-tabs');
  });

  test('환불 요청 목록', async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await gotoTab(page, '운영');
    await page.waitForTimeout(1200);

    await evidence(page, 'admin-refunds');
  });

  test('트레이너 소속 승인', async ({ page }) => {
    await login(page, ACCOUNTS.superAdmin);
    await gotoTab(page, '운영');
    await page.getByTestId('tab-TRAINERS').click();
    await page.waitForTimeout(1000);

    // 잠실점에 최트레이너가 승인 대기 중이다.
    await page.getByText('짐꽁 잠실점').last().click();
    await page.waitForTimeout(1200);
    await expect(page.getByText(ACCOUNTS.trainer.name).first()).toBeVisible();
    await evidence(page, 'admin-pending-trainers');

    await page.getByRole('button', { name: '승인', exact: true }).first().click();
    await expect(page.getByTestId('dialog-title')).toHaveText('소속을 승인할까요?');
    await evidence(page, 'admin-approve-confirm');

    await pressDialog(page, '승인');
    await page.waitForTimeout(1500);
    await expect(page.getByText('승인 대기 중인 트레이너가 없어요')).toBeVisible();
    await evidence(page, 'admin-approve-done');
  });

  test('시설·상품 — 강습실과 이용권 상품 등록', async ({ page }) => {
    await login(page, ACCOUNTS.superAdmin);
    await gotoTab(page, '운영');
    await page.getByTestId('tab-FACILITY').click();
    await page.waitForTimeout(1200);
    await evidence(page, 'admin-facility');

    // 강습실
    await page.getByRole('button', { name: '강습실 등록' }).click();
    await expect(page.getByTestId('form-sheet')).toBeVisible();
    await page.getByPlaceholder('104').fill('104');
    await page.getByPlaceholder('GX룸 B').fill('스트레칭룸');
    await evidence(page, 'admin-room-form');
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByText(/104\s*스트레칭룸/)).toBeVisible();
    await evidence(page, 'admin-room-created');

    // 이용권 상품
    await page.getByRole('button', { name: '상품 등록' }).click();
    await expect(page.getByTestId('form-sheet')).toBeVisible();
    await page.getByPlaceholder('그룹 30회권').fill('그룹 30회권');
    await evidence(page, 'admin-plan-form');
    await page.getByRole('button', { name: '등록', exact: true }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByText(/그룹 30회권/)).toBeVisible();
    await evidence(page, 'admin-plan-created');
  });

  test('지점 등록 — 좌표를 넣으면 내 주변 지점에 뜬다', async ({ page }) => {
    await login(page, ACCOUNTS.superAdmin);
    await gotoTab(page, '운영');
    await page.getByTestId('tab-FACILITY').click();
    await page.waitForTimeout(1200);

    await page.getByRole('button', { name: '지점 등록' }).click();
    await expect(page.getByTestId('form-sheet')).toBeVisible();
    await page.getByPlaceholder('짐꽁 판교점').fill('짐꽁 판교점');
    await page.getByPlaceholder('경기도 성남시 분당구 판교역로 1').fill('경기도 성남시 분당구 판교역로 1');
    await page.getByPlaceholder('37.3947').fill('37.3947');
    await page.getByPlaceholder('127.1112').fill('127.1112');
    await evidence(page, 'admin-place-form');

    await page.getByRole('button', { name: '등록', exact: true }).click();
    await page.waitForTimeout(1800);

    // 홈으로 돌아가면 새 지점이 보인다.
    await gotoTab(page, '홈');
    await expect(page.getByText('짐꽁 판교점').first()).toBeVisible({ timeout: 20_000 });
    await evidence(page, 'admin-place-created');
  });

  test('회원 계정으로는 관리자 화면에 갈 수 없다', async ({ page }) => {
    await login(page, ACCOUNTS.member);
    // 탭 자체가 없다.
    await expect(tab(page, '운영')).toHaveCount(0);

    // URL로 직접 들어가도 데이터를 받지 못한다.
    await page.goto(`${WEB_URL}/manage`);
    await waitApp(page);
    await expect(page.getByText('권한이 없습니다.').first()).toBeVisible({ timeout: 20_000 });
    await evidence(page, 'member-forbidden-admin');
  });
});
