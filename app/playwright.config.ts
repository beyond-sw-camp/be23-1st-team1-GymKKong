import { defineConfig, devices } from '@playwright/test';

/**
 * Expo 웹으로 띄운 앱을 모바일 뷰포트에서 주행한다.
 * 서버(Metro + API)는 미리 떠 있어야 한다 — docs/getting-started.md 참고.
 *
 * 시나리오 간에 데이터가 이어지므로(예약 -> 취소, 신청 -> 승인)
 * 순차 실행하고 재시도하지 않는다.
 */
export default defineConfig({
  testDir: './e2e',
  // 매 실행 전에 DB를 시드 상태로 되돌린다. 없으면 두 번째 실행부터 어긋난다.
  globalSetup: './e2e/global-setup.ts',
  // 녹화본을 시나리오별 파일로 정리하고 mp4로도 남긴다.
  globalTeardown: './e2e/global-teardown.ts',
  // 원본 녹화(webm)가 쌓이는 곳. 정리 후 지워진다.
  outputDir: '../docs/evidence/video/_raw',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: '../docs/evidence/_report', open: 'never' }]],
  use: {
    baseURL: process.env.WEB_URL ?? 'http://localhost:8081',
    ...devices['iPhone 13'],
    // Expo 웹은 터치 이벤트를 쓰지만, 데스크톱 크롬으로 돌리므로 마우스로 둔다.
    isMobile: false,
    hasTouch: false,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
    // 전 시나리오를 녹화한다. 캡처(이미지)와 함께 증적으로 남긴다.
    video: { mode: 'on', size: { width: 390, height: 844 } },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
