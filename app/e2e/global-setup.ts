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
 * E2E는 시나리오가 서로 이어지므로(예약 → 취소, 신청 → 승인)
 * 매 실행마다 같은 상태에서 시작해야 한다.
 * 앞선 실행이 남긴 데이터와 증적을 지우고 시드를 다시 넣는다.
 *
 * db/reset-seed.sh와 같은 일을 하지만, Windows에서 `bash`가 WSL로 잡히는 걸
 * 피하려고 docker를 직접 호출한다.
 */
export default function globalSetup() {
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
  console.log('[e2e] 준비 완료');
}
