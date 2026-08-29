/**
 * 화면정의서 생성.
 *
 * 1920x1080 슬라이드를 HTML로 만들고, Playwright로 PDF와 PNG를 뽑는다.
 * 캡처 이미지는 docs/evidence/ 에 있는 실제 E2E 산출물을 data URI로 박아
 * 파일 하나만 열어도 그대로 보이게 한다.
 *
 *   node tools/build-spec.mjs
 *
 * 산출물: docs/화면정의서.pdf, docs/화면정의서.html, docs/spec-slides/*.png
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { consoleShots, idMap, meta, scope, screens } from './spec-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'app', 'package.json'));
const { chromium } = require('@playwright/test');

const EV = join(ROOT, 'docs', 'evidence');
const OUT_DIR = join(ROOT, 'docs');
const SLIDE_DIR = join(OUT_DIR, 'spec-slides');

const W = 1920;
const H = 1080;

/** 이미지를 data URI로. 없으면 null을 돌려주고 자리표시자를 그린다. */
function dataUri(relPath) {
  const p = join(EV, relPath);
  if (!existsSync(p)) {
    console.warn(`  ! 캡처 없음: ${relPath}`);
    return null;
  }
  return `data:image/png;base64,${readFileSync(p).toString('base64')}`;
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------- 슬라이드

let pageNo = 0;
const slides = [];
let total = 0;

function slide(inner, kind = '') {
  pageNo += 1;
  slides.push(
    `<section class="slide ${kind}" data-page="${pageNo}">${inner}
      <div class="pageno">S${String(pageNo).padStart(2, '0')} <i>/</i> ${total}</div>
    </section>`,
  );
}

function header(section, title, sub) {
  return `<div class="hd">
    <div class="eyebrow">${esc(section)}</div>
    <h1>${esc(title)}</h1>
    ${sub ? `<div class="route">${esc(sub)}</div>` : ''}
  </div>`;
}

function specCard(title, rows, proof) {
  return `<aside class="spec">
    <div class="spec-eyebrow">SCREEN SPEC</div>
    <h2>${esc(title)}</h2>
    <hr>
    ${rows
      .map(
        (r) => `<div class="row">
          <div class="row-label">${esc(r.label)}</div>
          <div class="row-body">${esc(r.body)}</div>
        </div>`,
      )
      .join('')}
    ${
      proof?.length
        ? `<div class="row">
             <div class="row-label">검증 근거</div>
             <ul class="proof">${proof.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
           </div>`
        : ''
    }
  </aside>`;
}

function shotStrip(shots) {
  return `<div class="shots shots-${shots.length}">
    ${shots
      .map((s, i) => {
        const uri = dataUri(s.file);
        return `<figure>
          <figcaption><i>${i + 1}</i> ${esc(s.caption)}</figcaption>
          ${
            uri
              ? `<img src="${uri}" alt="${esc(s.caption)}">`
              : `<div class="missing">캡처 없음<br><small>${esc(s.file)}</small></div>`
          }
        </figure>`;
      })
      .join('')}
  </div>`;
}

// 총 페이지 수를 먼저 센다(표지 + 요약 + ID맵 + 화면들 + 콘솔들 + 마무리).
total = 3 + screens.length + Math.ceil(consoleShots.length / 2) + 1;

// --- 표지
slide(
  `<div class="cover">
     <div class="cover-eyebrow">SCREEN DEFINITION</div>
     <h1>${esc(meta.title)}</h1>
     <p class="cover-sub">${esc(meta.subtitle)}</p>
     <div class="cover-meta">
       <div><span>저장소</span>${esc(meta.repo)}</div>
       <div><span>스택</span>${esc(meta.stack)}</div>
       <div><span>캡처</span>Playwright E2E 28/28 주행 중 자동 수집 · 실제 화면</div>
     </div>
   </div>`,
  'cover-slide',
);

// --- 전수 범위
slide(
  `${header('SUMMARY · 전수 범위', '전수 범위 매트릭스', `화면 ${idMap.length}개 · 캡처 ${scope.reduce((a, s) => a + s.shots, 0)}장 — 영역별 매핑`)}
   <table class="grid">
     <thead><tr><th>영역</th><th>라우트</th><th class="num">화면</th><th class="num">캡처</th><th class="num">상태</th></tr></thead>
     <tbody>
       ${scope
         .map(
           (s) => `<tr>
             <td class="strong">${esc(s.area)}</td>
             <td class="mono">${s.routes.map(esc).join(' · ')}</td>
             <td class="num">${s.screens}</td>
             <td class="num">${s.shots}장</td>
             <td class="num ok">전수</td>
           </tr>`,
         )
         .join('')}
     </tbody>
   </table>`,
);

// --- 화면 ID 맵
slide(
  `${header('ID · IA 맵', '화면 ID와 라우트', 'app/ 디렉터리의 expo-router 파일 기준')}
   <table class="grid tight">
     <thead><tr><th>ID</th><th>라우트</th><th>화면</th><th>역할</th><th>파일</th></tr></thead>
     <tbody>
       ${idMap
         .map(
           (s) => `<tr>
             <td class="mono strong">${esc(s.id)}</td>
             <td class="mono">${esc(s.route)}</td>
             <td>${esc(s.name)}</td>
             <td class="dim">${esc(s.role)}</td>
             <td class="mono dim">${esc(s.file)}</td>
           </tr>`,
         )
         .join('')}
     </tbody>
   </table>`,
);

// --- 화면별
for (const s of screens) {
  slide(
    `${header(s.section, s.title, `${s.id} · ${s.route}`)}
     <div class="body">
       ${shotStrip(s.shots)}
       ${specCard(s.title, s.spec, s.proof)}
     </div>`,
  );
}

// --- 콘솔 증적 (2개씩)
for (let i = 0; i < consoleShots.length; i += 2) {
  const pair = consoleShots.slice(i, i + 2);
  slide(
    `${header('EVIDENCE · 콘솔', '개발 중 확인한 것들', '아래는 실제 명령을 다시 실행해 남긴 출력이다')}
     <div class="console-pair">
       ${pair
         .map((c) => {
           const uri = dataUri(join('console', c.file));
           return `<figure class="console">
             <figcaption><strong>${esc(c.title)}</strong><span>${esc(c.note)}</span></figcaption>
             ${uri ? `<img src="${uri}" alt="${esc(c.title)}">` : `<div class="missing">캡처 없음<br><small>${esc(c.file)}</small></div>`}
           </figure>`;
         })
         .join('')}
     </div>`,
  );
}

// --- 마무리
slide(
  `${header('CLOSING · 남은 것', '붙이지 않은 것과 그 이유', '동작을 흉내내지 않고, 연동 지점만 분리해 두었다')}
   <div class="closing">
     <div class="close-col">
       <h3>비용이 드는 것</h3>
       <div class="close-item"><b>PG 결제</b><span>이용권 구매는 결제 레코드를 만들되 즉시 PAID로 처리한다. 실제 연동 시 PENDING으로 만들고 콜백에서 markPaid를 부르도록 MembershipService.purchase 한 곳만 바꾸면 된다.</span></div>
       <div class="close-item"><b>SMS · 이메일 발송</b><span>인증번호는 DB에 해시로 저장되고 콘솔에 출력된다. AuthService.sendVerificationCode의 발송 한 줄만 교체하면 된다.</span></div>
       <div class="close-item"><b>푸시 전송</b><span>기기 토큰 저장과 알림함 기록은 동작한다. Expo Push 호출만 NotificationService.sendPush에 비워 두었다.</span></div>
     </div>
     <div class="close-col">
       <h3>로컬에서 전부 동작하는 것</h3>
       <div class="close-item"><b>예약 전 과정</b><span>정원·중복·이용권을 한 트랜잭션에서 검증하고 차감·복원까지. v1에는 예약 생성 로직 자체가 없었다.</span></div>
       <div class="close-item"><b>3역할 운영</b><span>회원 예약·구매·환불요청, 트레이너 개설·출석, 관리자 승인·등록이 모두 화면에서 끝난다.</span></div>
       <div class="close-item"><b>반복 가능한 검증</b><span>E2E가 매 실행 전 DB를 시드로 되돌린다. 몇 번을 돌려도 28/28이 같은 결과를 낸다.</span></div>
     </div>
   </div>`,
);

// ---------------------------------------------------------------- 문서

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>${esc(meta.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  /* 브랜드 팔레트 — 앱 로고(폴더+덤벨)에서 뽑은 인디고·바이올렛·로즈 */
  :root{
    --ink:#16161d; --muted:#6a6d80; --faint:#9a9db0;
    --line:#e4e5ef; --bg:#fff; --soft:#f5f6fa;
    --brand:#4c55c2; --brand-dark:#3a41a0; --indigo:#4a64bc; --violet:#5045a8;
    --accent:#5045a8;      /* 스펙 카드 테두리·라벨 */
    --rose:#d2799b;        /* 강조 */
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#4a4d55;font-family:'Noto Sans KR',system-ui,sans-serif;color:var(--ink)}
  .slide{
    position:relative;width:${W}px;height:${H}px;background:var(--bg);
    padding:64px 76px;margin:0 auto 24px;overflow:hidden;
    display:flex;flex-direction:column;
  }
  @media print{ body{background:#fff} .slide{margin:0;page-break-after:always} }

  .pageno{position:absolute;top:64px;right:76px;
    font:500 15px 'JetBrains Mono',monospace;color:var(--faint);letter-spacing:.02em}
  .pageno i{font-style:normal;color:#d1d5db}

  .hd{margin-bottom:34px;flex:none}
  .eyebrow{font:700 15px 'JetBrains Mono',monospace;color:var(--accent);letter-spacing:.08em}
  .hd h1{font-size:46px;font-weight:900;letter-spacing:-.02em;margin:8px 0 0;line-height:1.1}
  .route{margin-top:9px;font:500 17px 'JetBrains Mono',monospace;color:var(--brand)}

  /* 표지 */
  .cover-slide{justify-content:center;color:#fff;
    background:linear-gradient(150deg,#20214a 0%,#3a3a8f 46%,#5045a8 100%)}
  .cover-slide .pageno{color:#8d8fc4}
  .cover-eyebrow{font:700 17px 'JetBrains Mono',monospace;color:#b9bffc;letter-spacing:.16em}
  .cover h1{font-size:104px;font-weight:900;letter-spacing:-.035em;margin:22px 0 0;line-height:1}
  .cover-sub{font-size:27px;color:#c3c6ef;margin-top:20px;font-weight:500}
  .cover-meta{margin-top:72px;display:flex;flex-direction:column;gap:15px;
    font:500 18px 'JetBrains Mono',monospace;color:#a4a7de}
  .cover-meta span{display:inline-block;width:88px;color:#7477b4}

  /* 본문 2단 */
  .body{display:grid;grid-template-columns:minmax(0,1fr) 690px;gap:48px;flex:1;min-height:0}

  /* 캡처는 390x844 비율이다. 폭이 아니라 높이에 맞춰야 여백이 생기지 않는다. */
  .shots{display:flex;gap:30px;align-items:flex-start;justify-content:center;
    min-height:0;min-width:0}
  .shots-3{gap:22px}
  figure{display:flex;flex-direction:column;gap:11px;flex:0 0 auto}
  figcaption{font:500 14px 'JetBrains Mono',monospace;color:var(--muted);white-space:nowrap;
    overflow:hidden;text-overflow:ellipsis;max-width:100%}
  figcaption i{font-style:normal;display:inline-block;width:19px;height:19px;line-height:19px;
    text-align:center;border-radius:50%;background:var(--soft);color:var(--muted);
    font-size:11px;margin-right:6px;vertical-align:1px}
  .shots img{height:800px;width:auto;display:block;border:1px solid var(--line);
    border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,.07)}
  .shots-3 img{height:675px}
  .missing{height:420px;width:340px;display:flex;align-items:center;justify-content:center;
    text-align:center;border:1px dashed var(--line);border-radius:12px;color:var(--faint);
    font-size:14px;background:var(--soft)}

  /* 스펙 카드 */
  .spec{border:1.5px solid var(--accent);border-radius:18px;padding:34px 36px;
    align-self:start;max-height:100%;overflow:hidden}
  .spec-eyebrow{font:700 13px 'JetBrains Mono',monospace;color:var(--accent);letter-spacing:.13em}
  .spec h2{font-size:29px;font-weight:800;margin-top:9px;letter-spacing:-.01em}
  .spec hr{border:0;border-top:1px solid var(--line);margin:19px 0 6px}
  .row{margin-top:17px}
  .row-label{font:700 13.5px 'JetBrains Mono',monospace;color:var(--accent);
    letter-spacing:.04em;margin-bottom:5px}
  .row-body{font-size:16px;line-height:1.62;color:#242830}
  .proof{list-style:none;margin-top:3px}
  .proof li{position:relative;padding-left:19px;font-size:15.5px;line-height:1.6;
    color:#242830;margin-top:8px}
  .proof li::before{content:'';position:absolute;left:0;top:8px;width:8px;height:8px;
    border-radius:2px;background:var(--rose)}

  /* 표 */
  table.grid{width:100%;border-collapse:collapse;font-size:19px}
  table.grid.tight{font-size:17px}
  table.grid thead th{background:var(--soft);color:var(--muted);font-weight:500;font-size:15px;
    text-align:left;padding:17px 20px}
  table.grid thead th:first-child{border-radius:10px 0 0 10px}
  table.grid thead th:last-child{border-radius:0 10px 10px 0}
  table.grid td{padding:17px 20px;border-bottom:1px solid var(--line)}
  table.grid.tight td{padding:12px 20px}
  table.grid .num{text-align:right;width:110px}
  table.grid thead .num{text-align:right}
  .mono{font-family:'JetBrains Mono',monospace;font-size:.87em;color:var(--brand)}
  .strong{font-weight:700}
  .dim{color:var(--muted)}
  .ok{color:var(--accent);font-weight:700}

  /* 콘솔 */
  .console-pair{display:grid;grid-template-columns:1fr 1fr;gap:44px;flex:1;min-height:0}
  figure.console{gap:14px}
  figure.console figcaption{white-space:normal;display:flex;flex-direction:column;gap:5px}
  figure.console figcaption strong{font-family:'Noto Sans KR';font-size:20px;font-weight:700;color:var(--ink)}
  figure.console figcaption span{font-family:'Noto Sans KR';font-size:14.5px;color:var(--muted);line-height:1.5}
  figure.console img{width:100%;border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,.09);
    object-fit:contain;object-position:top;max-height:730px}

  /* 마무리 */
  .closing{display:grid;grid-template-columns:1fr 1fr;gap:56px;flex:1}
  .close-col h3{font-size:23px;font-weight:800;margin-bottom:22px;
    padding-bottom:13px;border-bottom:2px solid var(--line)}
  .close-item{margin-bottom:26px}
  .close-item b{display:block;font-size:18.5px;font-weight:700;color:var(--brand-dark);margin-bottom:6px}
  .close-item span{display:block;font-size:16.5px;line-height:1.65;color:#242830}
</style></head>
<body>${slides.join('\n')}</body></html>`;

mkdirSync(SLIDE_DIR, { recursive: true });
const htmlPath = join(OUT_DIR, '화면정의서.html');
writeFileSync(htmlPath, html, 'utf8');
console.log(`HTML  ${htmlPath}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html, { waitUntil: 'networkidle' });

// PDF — 슬라이드 한 장이 한 페이지
await page.pdf({
  path: join(OUT_DIR, '화면정의서.pdf'),
  width: `${W}px`,
  height: `${H}px`,
  printBackground: true,
  pageRanges: `1-${slides.length}`,
});
console.log(`PDF   ${join(OUT_DIR, '화면정의서.pdf')} (${slides.length}장)`);

// PNG — Figma·PPT로 가져다 쓰기 좋게 장당 파일로
const els = await page.$$('.slide');
for (let i = 0; i < els.length; i++) {
  await els[i].screenshot({ path: join(SLIDE_DIR, `S${String(i + 1).padStart(2, '0')}.png`) });
}
console.log(`PNG   ${SLIDE_DIR} (${els.length}장)`);

await browser.close();
