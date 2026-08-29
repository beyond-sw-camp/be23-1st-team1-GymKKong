import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { EVIDENCE_DIR } from './helpers';

const VIDEO_DIR = join(EVIDENCE_DIR, 'video');
const RAW_DIR = join(VIDEO_DIR, '_raw');

/**
 * mp4 변환용 ffmpeg.
 *
 * Playwright도 ffmpeg를 번들하지만 png와 libvpx만 들어 있는 최소 빌드라
 * h264로 인코딩할 수 없다. 그래서 ffmpeg-static을 devDependency로 둔다.
 * 없으면 webm만 남기고 넘어간다.
 */
function findFfmpeg(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bin = require('ffmpeg-static') as string | null;
    if (bin && existsSync(bin)) return bin;
  } catch {
    // 설치돼 있지 않으면 webm만 남긴다.
  }
  return null;
}

/** `01-member-회원-로그인-화면-chromium` → `member-로그인-화면` */
function prettify(dirName: string): string {
  return dirName
    .replace(/^\d+-/, '')
    .replace(/-chromium$/, '')
    .replace(/\.spec-/, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * 시나리오별 녹화본을 사람이 읽을 수 있는 이름으로 정리한다.
 *
 * Playwright는 테스트마다 `outputDir/<제목-슬러그>/video.webm` 을 남긴다.
 * 그대로 두면 폴더가 28개로 흩어지므로, 실행 순서대로 번호를 붙여
 * `docs/evidence/video/` 아래에 평평하게 모은다.
 * ffmpeg가 있으면 mp4로도 변환한다 — 문서나 포트폴리오에 붙이기 쉽다.
 */
export default function globalTeardown() {
  if (!existsSync(RAW_DIR)) return;

  // 실행 순서 = 생성 순서. mtime으로 정렬하면 시나리오 순서가 유지된다.
  const entries = readdirSync(RAW_DIR)
    .map((name) => ({ name, path: join(RAW_DIR, name) }))
    .filter((e) => statSync(e.path).isDirectory())
    .map((e) => {
      const video = readdirSync(e.path).find((f) => f.endsWith('.webm'));
      return video ? { ...e, video: join(e.path, video), mtime: statSync(join(e.path, video)).mtimeMs } : null;
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => a.mtime - b.mtime);

  if (entries.length === 0) {
    rmSync(RAW_DIR, { recursive: true, force: true });
    return;
  }

  mkdirSync(VIDEO_DIR, { recursive: true });
  // 이전 실행분을 지운다. 번호가 어긋나면 문서와 대응이 깨진다.
  for (const f of readdirSync(VIDEO_DIR)) {
    if (/\.(webm|mp4)$/.test(f) || f === 'INDEX.md') rmSync(join(VIDEO_DIR, f), { force: true });
  }

  const ffmpeg = findFfmpeg();
  const index: string[] = [];
  const failures: string[] = [];

  entries.forEach((e, i) => {
    const base = `${String(i + 1).padStart(2, '0')}_${prettify(e.name)}`;
    const webm = join(VIDEO_DIR, `${base}.webm`);
    renameSync(e.video, webm);

    let mp4Made = false;
    if (ffmpeg) {
      try {
        execFileSync(
          ffmpeg,
          [
            '-y', '-loglevel', 'error',
            '-i', webm,
            // 짝수 해상도로 맞춰야 h264가 인코딩된다.
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26',
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            join(VIDEO_DIR, `${base}.mp4`),
          ],
          { stdio: ['ignore', 'ignore', 'pipe'] },
        );
        mp4Made = true;
      } catch (err) {
        // 변환에 실패해도 webm은 남는다. 다만 조용히 넘기면 원인을 못 찾으므로 알린다.
        const detail = (err as { stderr?: Buffer }).stderr?.toString().trim().split('\n')[0];
        failures.push(`${base}: ${detail ?? String(err)}`);
      }
    }
    index.push(`| ${i + 1} | ${prettify(e.name)} | \`${base}.webm\`${mp4Made ? ` · \`${base}.mp4\`` : ''} |`);
  });

  writeFileSync(
    join(VIDEO_DIR, 'INDEX.md'),
    [
      '# E2E 시나리오 녹화',
      '',
      '`npx playwright test` 가 전 시나리오를 주행하며 자동으로 남긴 화면 녹화다.',
      '캡처 이미지(`docs/evidence/*.png`)와 같은 실행에서 나온 것이라 서로 대응된다.',
      '',
      '| # | 시나리오 | 파일 |',
      '| --- | --- | --- |',
      ...index,
      '',
    ].join('\n'),
    'utf8',
  );

  rmSync(RAW_DIR, { recursive: true, force: true });

  const mp4Count = readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.mp4')).length;
  console.log(
    `[e2e] 녹화 ${entries.length}건을 ${VIDEO_DIR} 에 정리했습니다 (webm ${entries.length} · mp4 ${mp4Count})`,
  );
  if (failures.length) {
    console.warn(
      `[e2e] mp4 변환 실패 ${failures.length}건\n  ` + failures.slice(0, 3).join('\n  '),
    );
  }
}
