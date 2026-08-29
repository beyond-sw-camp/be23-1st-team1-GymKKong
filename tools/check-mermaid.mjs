/**
 * 문서에 들어간 mermaid 다이어그램의 문법을 검사한다.
 *
 * GitHub은 문법이 틀리면 다이어그램 자리에 오류 상자를 그린다.
 * 문서를 올리기 전에 실제 mermaid 파서로 한 번 돌려본다.
 *
 *   node tools/check-mermaid.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'app', 'package.json'));
const { chromium } = require('@playwright/test');

const DOCS = join(ROOT, 'docs');
const MERMAID = require.resolve('mermaid/dist/mermaid.min.js');

/** ```mermaid 블록을 파일별로 뽑는다. */
function collect() {
  const out = [];
  for (const f of readdirSync(DOCS)) {
    if (!f.endsWith('.md')) continue;
    const text = readFileSync(join(DOCS, f), 'utf8');
    const lines = text.split('\n');
    let buf = null;
    let startLine = 0;
    lines.forEach((line, i) => {
      if (buf === null && /^```mermaid\s*$/.test(line)) {
        buf = [];
        startLine = i + 1;
      } else if (buf !== null && /^```\s*$/.test(line)) {
        out.push({ file: f, line: startLine, code: buf.join('\n') });
        buf = null;
      } else if (buf !== null) {
        buf.push(line);
      }
    });
    if (buf !== null) out.push({ file: f, line: startLine, code: buf.join('\n'), unclosed: true });
  }
  return out;
}

const blocks = collect();
if (blocks.length === 0) {
  console.log('mermaid 블록이 없습니다.');
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>');
await page.addScriptTag({ path: MERMAID });
await page.evaluate(() => window.mermaid.initialize({ startOnLoad: false }));

const failures = [];
for (const b of blocks) {
  if (b.unclosed) {
    failures.push(`${b.file}:${b.line}  닫히지 않은 코드 블록`);
    continue;
  }
  const err = await page.evaluate(async (code) => {
    try {
      await window.mermaid.parse(code);
      return null;
    } catch (e) {
      return String(e && e.message ? e.message : e).split('\n').slice(0, 3).join(' | ');
    }
  }, b.code);
  if (err) failures.push(`${b.file}:${b.line}  ${err}`);
}

await browser.close();

const byFile = blocks.reduce((a, b) => ({ ...a, [b.file]: (a[b.file] ?? 0) + 1 }), {});
for (const [f, n] of Object.entries(byFile)) console.log(`  ${f.padEnd(24)} ${n}개`);
console.log(`\n총 ${blocks.length}개 — 통과 ${blocks.length - failures.length} / 실패 ${failures.length}`);

if (failures.length) {
  console.error('\n실패:\n  ' + failures.join('\n  '));
  process.exit(1);
}
