import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

import { EVIDENCE_DIR } from './helpers';

const CONTAINER = process.env.DB_CONTAINER ?? 'gymkkong-mariadb';

/** SQL 파일을 컨테이너의 mariadb 클라이언트에 넣는다. */
function runSql(file: string) {
  const sql = readFileSync(file, 'utf8');
  execFileSync(
    'docker',
    ['exec', '-i', CONTAINER, 'mariadb', '-ugymkkong', '-pgymkkong'],
    { input: sql, stdio: ['pipe', 'inherit', 'pipe'] },
  );
}

/**
 * 백엔드를 재시작한 직후 첫 인증 요청은 Hibernate가 쿼리를 처음 컴파일하느라
 * 수십 초까지 걸린다. 그 지연이 테스트 타임아웃으로 나타나면 앱 결함처럼 보이므로,
 * 시나리오를 돌리기 전에 실제 로그인 경로를 한 번 태워 JVM을 데운다.
 */
async function warmUpApi() {
  const base = process.env.API_URL ?? 'http://localhost:8090';
  const started = Date.now();
  for (let i = 0; i < 120; i += 1) {
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // 일부러 틀린 비밀번호 — 로그인 경로(조회 + BCrypt)만 데우고 세션은 만들지 않는다.
        body: JSON.stringify({ email: 'kim@example.com', password: 'not-the-password' }),
      });
      if (res.status === 401 || res.status === 200) {
        console.log(`[e2e] API 예열 완료 (${Date.now() - started}ms)`);
        return;
      }
    } catch {
      // 아직 안 떴다 — 재시도
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`[e2e] ${base} 가 응답하지 않습니다. 백엔드가 떠 있는지 확인하세요.`);
}

/**
 * E2E는 시나리오가 서로 이어지므로(예약 → 취소, 신청 → 승인)
 * 매 실행마다 같은 상태에서 시작해야 한다.
 * 앞선 실행이 남긴 데이터와 증적을 지우고 시드를 다시 넣는다.
 *
 * db/reset-seed.sh와 같은 일을 하지만, Windows에서 `bash`가 WSL로 잡히는 걸
 * 피하려고 docker를 직접 호출한다.
 */
export default async function globalSetup() {
  const repoRoot = join(__dirname, '..', '..');

  // 이전 화면 증적은 번호가 어긋나므로 지운다.
  // 콘솔 증적(console/)과 리포트(_report/)는 별도로 만들어지므로 건드리지 않는다.
  if (existsSync(EVIDENCE_DIR)) {
    for (const f of readdirSync(EVIDENCE_DIR)) {
      if (/^\d{2}_.+\.png$/.test(f)) rmSync(join(EVIDENCE_DIR, f), { force: true });
    }
  }

  console.log('[e2e] 데이터 초기화 + 시드 재적재');
  runSql(join(repoRoot, 'db', 'v2', '00_reset.sql'));
  runSql(join(repoRoot, 'db', 'v2', '02_seed.sql'));

  await warmUpApi();
  console.log('[e2e] 준비 완료');
}
