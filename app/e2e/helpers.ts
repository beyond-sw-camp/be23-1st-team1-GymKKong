import { expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const WEB_URL = process.env.WEB_URL ?? 'http://localhost:8081';
export const API_URL = process.env.API_URL ?? 'http://localhost:8090';

/** 증적 이미지가 쌓이는 곳. 화면정의서가 이 파일들을 그대로 쓴다. */
export const EVIDENCE_DIR = join(__dirname, '..', '..', 'docs', 'evidence');

export const ACCOUNTS = {
  member: { email: 'kim@example.com', password: 'gymkkong1234', name: '김철수' },
  member2: { email: 'lee@example.com', password: 'gymkkong1234', name: '이영희' },
  refunded: { email: 'yoon@example.com', password: 'gymkkong1234', name: '윤지아' },
  trainer: { email: 'choi.trainer@gymkkong.com', password: 'gymkkong1234', name: '최트레이너' },
  admin: { email: 'admin.gangnam@gymkkong.com', password: 'gymkkong1234', name: '김매니저' },
  superAdmin: { email: 'super@gymkkong.com', password: 'gymkkong1234', name: '최관리자' },
} as const;

let shotIndex = 0;

/**
 * 증적 캡처.
 * 파일명을 `NN_slug.png`로 매겨 화면정의서에서 순서대로 참조할 수 있게 한다.
 */
export async function evidence(page: Page, slug: string) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  shotIndex += 1;
  const name = `${String(shotIndex).padStart(2, '0')}_${slug}.png`;
  await page.screenshot({ path: join(EVIDENCE_DIR, name), fullPage: false });
  return name;
}

/** 앱이 마운트되어 화면이 그려질 때까지 기다린다. */
export async function waitApp(page: Page) {
  await page.waitForSelector('#root > div', { timeout: 30_000 });
  await page.waitForTimeout(600);
}

/** 로그인. 세션이 남아 있으면 먼저 비운다. */
export async function login(page: Page, account: { email: string; password: string }) {
  await page.goto(`${WEB_URL}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${WEB_URL}/login`);
  await waitApp(page);

  await page.getByPlaceholder('you@example.com').fill(account.email);
  await page.getByPlaceholder('비밀번호').first().fill(account.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  // 홈 탭이 뜨면 진입 성공.
  await expect(page.getByRole('tab', { name: '홈' })).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(800);
}

/** 확인 다이얼로그에서 특정 버튼을 누른다. */
export async function pressDialog(page: Page, buttonText: string) {
  const dialog = page.getByTestId('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await dialog.getByRole('button', { name: buttonText, exact: true }).click();
  await page.waitForTimeout(700);
}

/**
 * 하단 탭으로 이동.
 * expo-router의 탭은 웹에서 <a role="tab">으로 렌더링된다.
 * 화면 제목(h1)에도 같은 문구가 있어 role로 구분해야 한다.
 */
export async function gotoTab(page: Page, label: string) {
  await page.getByRole('tab', { name: label }).click();
  await page.waitForTimeout(1100);
}

/** 탭바에 특정 탭이 있는지. 역할별 탭 구성 검증에 쓴다. */
export function tab(page: Page, label: string) {
  return page.getByRole('tab', { name: label });
}

/** API를 직접 호출해 상태를 검증하거나 정리한다. */
export async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  const body = (await res.json()) as { accessToken: string };
  return body.accessToken;
}

export async function apiGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export async function apiDelete(token: string, path: string): Promise<number> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.status;
}
