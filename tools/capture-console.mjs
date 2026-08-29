/**
 * 콘솔 증적 캡처.
 *
 * 개발 중 확인한 것들(스키마 검증, 스모크 테스트, 타입 검사, E2E 결과 등)을
 * 실제로 다시 실행해서 그 출력을 터미널 모양 이미지로 남긴다.
 * 포트폴리오에 "이렇게 확인했다"를 그림으로 붙일 수 있게 하기 위한 것이다.
 *
 *   node tools/capture-console.mjs            # 전체
 *   node tools/capture-console.mjs --quick    # 오래 걸리는 항목 제외
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Playwright는 app/ 아래에만 설치돼 있다. ESM은 NODE_PATH를 보지 않으므로 직접 해석한다.
const require = createRequire(join(ROOT, 'app', 'package.json'));
const { chromium } = require('@playwright/test');
const OUT = join(ROOT, 'docs', 'evidence', 'console');
const APP = join(ROOT, 'app');
const QUICK = process.argv.includes('--quick');
/** 명령을 다시 돌리지 않고, 지난 실행이 남긴 .txt로 이미지만 다시 그린다. */
const RENDER_ONLY = process.argv.includes('--render-only');

/** Windows에서 `bash`는 WSL로 잡히므로 Git Bash를 직접 가리킨다. */
const GIT_BASH = process.env.GIT_BASH ?? 'C:/Program Files/Git/bin/bash.exe';

/**
 * 명령을 실행하고 출력을 그대로 돌려준다.
 * 실패해도 던지지 않는다 — 실패한 출력도 증적이다.
 */
function run(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...opts,
    });
  } catch (e) {
    return `${e.stdout ?? ''}${e.stderr ?? ''}` || String(e);
  }
}

/** API가 다시 응답할 때까지 기다린다. 재시작 직후 바로 호출하면 503이 난다. */
function waitForApi(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const out = run('docker', ['logs', '--tail', '80', 'gymkkong-api']);
    if (out.includes('Started GymkkongApiApplication')) return true;
  }
  return false;
}

/** ANSI 이스케이프 제거 + 과도한 공백 정리. */
function clean(text, maxLines = 60) {
  const stripped = text
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => !l.includes('NO_COLOR') && !l.includes('trace-warnings'))
    .filter((l) => !/^\s*\+\s*~+\s*$/.test(l))
    .filter((l) => !l.startsWith('    + CategoryInfo') && !l.startsWith('    + FullyQualifiedErrorId'));

  if (stripped.length <= maxLines) return stripped.join('\n').trim();
  // 가운데를 접는다. 앞뒤가 중요한 출력이 대부분이다.
  const head = stripped.slice(0, Math.ceil(maxLines * 0.6));
  const tail = stripped.slice(-Math.floor(maxLines * 0.4));
  return [...head, `… (${stripped.length - maxLines}줄 생략)`, ...tail].join('\n').trim();
}

const CAPTURES = [
  {
    slug: 'db-schema-loaded',
    title: '스키마 v2 적재 결과',
    note: 'MariaDB 11.4 컨테이너. db/v2/01_schema.sql 이 만든 테이블과 뷰.',
    cmd: '$ docker exec gymkkong-mariadb mariadb -e "SELECT ... FROM information_schema"',
    get: () =>
      run('docker', [
        'exec', 'gymkkong-mariadb', 'mariadb', '-ugymkkong', '-pgymkkong', 'gymkkong_v2',
        '-e',
        "SELECT table_name AS '테이블', table_rows AS '행(추정)' FROM information_schema.tables WHERE table_schema='gymkkong_v2' AND table_type='BASE TABLE' ORDER BY table_name;",
      ]),
  },
  {
    slug: 'db-seed-counts',
    title: '시드 데이터 적재 확인',
    note: '모든 강습 회차는 CURDATE() 기준 상대 날짜라 언제 실행해도 예정 수업이 있다.',
    cmd: '$ bash db/reset-seed.sh',
    get: () => run(GIT_BASH, [join(ROOT, 'db', 'reset-seed.sh')], { cwd: ROOT }),
  },
  {
    slug: 'backend-startup',
    title: 'Spring Boot 기동 — 스키마 검증 통과',
    note: 'ddl-auto=validate. 엔티티 23종이 db/v2 스키마와 일치하지 않으면 여기서 기동이 실패한다.',
    cmd: '$ docker logs gymkkong-api | grep -E "Tomcat|Started|Hibernate"',
    get: () => {
      const log = run('docker', ['logs', 'gymkkong-api']);
      return log
        .split('\n')
        .filter((l) =>
          /Starting GymkkongApiApplication|Bootstrapping Spring Data|Finished Spring Data|Hibernate ORM core|Tomcat started|Started GymkkongApiApplication|HikariPool-1 - Start completed|Database version/.test(l),
        )
        .join('\n');
    },
  },
  {
    slug: 'verification-code-log',
    title: '인증번호 발송 — 콘솔 출력',
    note: 'SMS/메일 발송기는 유료라 붙이지 않았다. 발송 지점만 분리해두고 개발 중에는 로그로 확인한다.',
    cmd: '$ curl -X POST /api/auth/verification/send  →  docker logs gymkkong-api',
    get: () => {
      run(GIT_BASH, [
        '-c',
        `curl -s -X POST http://localhost:8090/api/auth/verification/send -H 'Content-Type: application/json' -d '{"channel":"EMAIL","target":"kim@example.com","purpose":"RESET_PASSWORD"}'`,
      ]);
      const log = run('docker', ['logs', '--tail', '400', 'gymkkong-api']);
      const lines = log.split('\n').filter((l) => l.includes('[인증코드]'));
      return lines.slice(-3).join('\n') || '(로그 없음)';
    },
  },
  {
    slug: 'api-smoke-test',
    title: 'API 스모크 테스트 16/16',
    note: '예약→차감→중복거부→취소→복원, 역할별 권한, 재환불 차단까지 서버 단에서 확인.',
    cmd: '$ bash backend/scripts/smoke-test.sh',
    get: () =>
      run(GIT_BASH, [join(ROOT, 'backend', 'scripts', 'smoke-test.sh')], {
        cwd: join(ROOT, 'backend', 'scripts'),
      }),
    maxLines: 46,
  },
  {
    slug: 'app-typecheck',
    title: '앱 타입 검사',
    note: 'tsc --noEmit. 서버 DTO와 앱 타입이 어긋나면 여기서 걸린다.',
    cmd: '$ cd app && npx tsc --noEmit && echo "no type errors"',
    get: () => {
      const out = run('npx', ['tsc', '--noEmit'], { cwd: APP, shell: true });
      return out.trim() ? out : '$ npx tsc --noEmit\n(오류 없음)';
    },
  },
  {
    slug: 'backend-build',
    title: '백엔드 빌드',
    note: '로컬에 JDK가 없어 gradle:8.12-jdk21 컨테이너에서 빌드한다.',
    cmd: '$ docker run --rm -v ...:/app gradle:8.12-jdk21 gradle bootJar',
    skipOnQuick: true,
    get: () => {
      const out = run('docker', [
        'run', '--rm',
        '-v', `${join(ROOT, 'backend')}:/app`,
        '-v', 'gymkkong-gradle-cache:/home/gradle/.gradle',
        '-w', '/app',
        'gradle:8.12-jdk21', 'gradle', 'bootJar', '--console=plain',
      ]);
      // 빌드는 실행 중인 API 컨테이너가 마운트한 jar를 덮어쓴다.
      // 그대로 두면 JVM이 클래스를 못 찾아 NoClassDefFoundError로 죽는다.
      run('docker', ['restart', 'gymkkong-api']);
      waitForApi();
      return out;
    },
    maxLines: 24,
  },
  {
    slug: 'e2e-result',
    title: 'E2E 28/28 통과',
    note: 'Playwright로 회원·트레이너·관리자 전 시나리오를 실제 브라우저에서 주행한 결과.',
    cmd: '$ cd app && npx playwright test',
    skipOnQuick: true,
    get: () => run('npx', ['playwright', 'test'], { cwd: APP, shell: true }),
    maxLines: 44,
  },
];

// ---------------------------------------------------------------- 렌더링

const shell = (title, note, cmd, body) => `<!doctype html>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Noto+Sans+KR:wght@400;600;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px; background: #eef0f3;
         font-family: 'Noto Sans KR', system-ui, sans-serif; }
  .wrap { max-width: 1000px; margin: 0 auto; }
  h1 { font-size: 19px; margin: 0 0 4px; color: #14161a; font-weight: 700; }
  .note { font-size: 13px; color: #6b7280; margin: 0 0 14px; line-height: 1.55; }
  .term { background: #14161a; border-radius: 10px; overflow: hidden;
          box-shadow: 0 8px 28px rgba(0,0,0,.16); }
  .bar { display: flex; align-items: center; gap: 7px; padding: 10px 14px;
         background: #22252b; }
  .dot { width: 11px; height: 11px; border-radius: 50%; }
  .bar span { margin-left: 10px; font: 600 11px 'JetBrains Mono', monospace; color: #8b919b; }
  pre { margin: 0; padding: 18px 20px; color: #d7dbe0; white-space: pre-wrap;
        word-break: break-word; font: 400 12.5px/1.65 'JetBrains Mono', monospace; }
  .cmd { color: #7cc4ff; display: block; margin-bottom: 10px; font-weight: 600; }
  .pass { color: #57d18b; }
  .fail { color: #ff6b6b; }
  .warn { color: #ffc861; }
  .dim  { color: #8b919b; }
</style>
<div class="wrap">
  <h1>${title}</h1>
  <p class="note">${note}</p>
  <div class="term">
    <div class="bar">
      <i class="dot" style="background:#ff5f57"></i>
      <i class="dot" style="background:#febc2e"></i>
      <i class="dot" style="background:#28c840"></i>
      <span>gymkkong — 검증 로그</span>
    </div>
    <pre><code class="cmd">${esc(cmd)}</code>${colorize(body)}</pre>
  </div>
</div>`;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 통과/실패를 눈에 띄게. 로그 내용 자체는 바꾸지 않는다.
 * LOGIN_FAILED 같은 식별자 안의 FAIL을 물들이지 않도록 경계를 둔다.
 */
function colorize(text) {
  return esc(text)
    .replace(/^(\s*)(PASS)\b/gm, '$1<span class="pass">$2</span>')
    .replace(/^(\s*)(ok\s+\d+)\b/gm, '$1<span class="pass">$2</span>')
    .replace(/\b(BUILD SUCCESSFUL|\d+ passed|Started GymkkongApiApplication)/g,
      '<span class="pass">$1</span>')
    .replace(/(완료\.|오류 없음)/g, '<span class="pass">$1</span>')
    // 실패 0건은 초록으로 둔다 — 빨간 0은 오해를 부른다.
    .replace(/\bFAIL: 0\b/g, '<span class="pass">FAIL: 0</span>')
    .replace(/^(\s*)(FAIL)\b/gm, '$1<span class="fail">$2</span>')
    .replace(/\bFAIL: ([1-9]\d*)\b/g, '<span class="fail">FAIL: $1</span>')
    .replace(/\b(\d+ failed|BUILD FAILED)\b/g, '<span class="fail">$1</span>')
    .replace(/(생략\))/g, '<span class="warn">$1</span>')
    .replace(/^(\s*….*)$/gm, '<span class="dim">$1</span>');
}

// ---------------------------------------------------------------- 실행

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1060, height: 800 },
  deviceScaleFactor: 2,
});

let n = 0;
for (const c of CAPTURES) {
  if (QUICK && c.skipOnQuick && !RENDER_ONLY) {
    console.log(`skip  ${c.slug}`);
    continue;
  }
  n += 1;
  process.stdout.write(`run   ${c.slug} … `);

  const name = `${String(n).padStart(2, '0')}_${c.slug}`;
  const txtPath = join(OUT, `${name}.txt`);

  let raw;
  if (RENDER_ONLY && existsSync(txtPath)) {
    raw = readFileSync(txtPath, 'utf8');
  } else {
    raw = c.get();
    writeFileSync(txtPath, raw, 'utf8');
  }
  const body = clean(raw, c.maxLines ?? 40);

  await page.setContent(shell(c.title, c.note, c.cmd, body), { waitUntil: 'networkidle' });
  // 화면정의서 슬라이드가 제목과 설명을 따로 붙이므로 터미널 영역만 담는다.
  const el = await page.$('.term');
  await el.screenshot({ path: join(OUT, `${name}.png`) });

  console.log('captured');
}

await browser.close();
console.log(`\n${n}건을 ${OUT} 에 저장했습니다.`);
