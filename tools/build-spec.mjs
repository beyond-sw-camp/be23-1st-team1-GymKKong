/**
 * 화면정의서 생성.
 *
 * 1920x1080 슬라이드를 HTML로 조립하고, Playwright로 PDF를 뽑는다.
 * 캡처 이미지는 docs/evidence/screens/ 에 있는 실제 E2E 산출물을 data URI로 박아
 * 파일 하나만 열어도 그대로 보이게 한다.
 *
 * 산출물: docs/화면정의서.pdf
 *
 * --preview 를 주면 장당 PNG를 PREVIEW_DIR(기본 docs/.preview)에 남긴다.
 * 저장소에 넣지 않고 눈으로 확인할 때만 쓴다.
 *
 * 산출물: docs/화면정의서.pdf
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { architecture, consoleShots, idMap, meta, scope, screens } from './spec-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'app', 'package.json'));
const { chromium } = require('@playwright/test');

const EV = join(ROOT, 'docs', 'evidence');
const OUT_DIR = join(ROOT, 'docs');

const W = 1920;
const H = 1080;

/** 이미지를 data URI로. 없으면 null을 돌려주고 자리표시자를 그린다. */
function dataUri(relPath, base = EV) {
  const p = join(base, relPath);
  if (!existsSync(p)) {
    console.warn(`  ! 캡처 없음: ${relPath}`);
    return null;
  }
  return `data:image/png;base64,${readFileSync(p).toString('base64')}`;
}

/** 브랜드 마크 — app/src/components/Logo.tsx 와 같은 도형이다. */
const LOGO_SVG = `<svg width="46" height="46" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="gk" x1="6" y1="14" x2="56" y2="58" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#5B6BD0"/><stop offset="0.55" stop-color="#4A64BC"/><stop offset="1" stop-color="#5045A8"/></linearGradient></defs>
<path d="M4 17a7 7 0 0 1 7-7h12.7a4 4 0 0 1 2.83 1.17l3.66 3.66A4 4 0 0 0 33.02 16H53a7 7 0 0 1 7 7v24a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V17Z" fill="url(#gk)"/>
<g transform="rotate(-14 32 37)">
<rect x="26.5" y="35.2" width="11" height="3.6" rx="1.8" fill="#F0C3D0"/>
<rect x="21.6" y="28.6" width="6.2" height="16.8" rx="2.6" fill="#FFFFFF"/>
<rect x="36.2" y="28.6" width="6.2" height="16.8" rx="2.6" fill="#FFFFFF"/>
<rect x="16.9" y="31.9" width="4.4" height="10.2" rx="2" fill="#FFFFFF" opacity="0.85"/>
<rect x="42.7" y="31.9" width="4.4" height="10.2" rx="2" fill="#FFFFFF" opacity="0.85"/></g></svg>`;

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
        const uri = dataUri(join('screens', s.file));
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

// 총 페이지 수를 먼저 센다(표지 + 아키텍처 + 요약 + ID맵 + 화면들 + 콘솔들 + 마무리).
total = 4 + screens.length + Math.ceil(consoleShots.length / 2) + 1;

// --- 표지
// Figma 덱 표지와 같은 구성이다. 두 문서가 같은 얼굴을 갖도록 좌표까지 맞춘다.
{
  const ph = (file) => dataUri(join('screens', file));
  slide(
    `<div class="cv-tile">${LOGO_SVG}</div>
     <div class="cv-word">짐꽁</div>
     <div class="cv-latin">GYMKKONG</div>
     <div class="cv-eyebrow">SCREEN DEFINITION</div>
     <div class="cv-t1">GymKKong</div>
     <div class="cv-t2">화면정의서</div>
     <div class="cv-bar"></div>
     <div class="cv-sub">${esc(meta.subtitle)}</div>
     <div class="cv-meta">
       <div><span>저장소</span>${esc(meta.repo)}</div>
       <div><span>스택</span>${esc(meta.stack)}</div>
       <div><span>캡처</span>Playwright E2E 주행 중 자동 수집 — 목업이 아닌 실제 화면</div>
     </div>
     <div class="cv-pills">
       ${['화면 14', '캡처 46장', '녹화 28건', 'E2E 28 / 28', '스모크 22 / 22']
         .map((t) => `<span>${t}</span>`).join('')}
     </div>
     <img class="cv-ph cv-ph1" src="${ph('11_memberships.png')}" alt="이용권">
     <img class="cv-ph cv-ph3" src="${ph('27_trainer-roster.png')}" alt="출석 관리">
     <img class="cv-ph cv-ph2" src="${ph('03_home-timetable.png')}" alt="홈">
     <div class="cv-cap">회원 이용권  ·  회원 홈  ·  트레이너 출석 관리</div>`,
    'cover-slide',
  );
}

// --- 아키텍처
{
  const uri = dataUri('architecture-overview.png', OUT_DIR);
  slide(
    `${header('ARCHITECTURE · 시스템 구성', '시스템 아키텍처', 'Expo 앱 · Spring Boot REST API · MariaDB — 로컬 Docker 환경')}
     <div class="arch">
       ${uri ? `<img src="${uri}" alt="시스템 아키텍처">` : '<div class="missing">도식 없음<br><small>node tools/build-architecture.mjs</small></div>'}
       <div class="arch-col">
         ${architecture
           .map(
             (a) => `<div class="arch-item" style="border-color:${a.color}">
               <h3>${esc(a.label)}</h3>
               <p>${esc(a.body)}</p>
             </div>`,
           )
           .join('')}
       </div>
     </div>`,
  );
}

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

  /* 아키텍처 */
  .arch{display:flex;gap:56px;flex:1;min-height:0}
  .arch img{height:100%;width:auto;align-self:flex-start;
    border:1px solid var(--line);border-radius:8px}
  .arch-col{flex:1;display:flex;flex-direction:column;justify-content:flex-start;gap:26px;padding-top:4px}
  .arch-item{border-left:3px solid;padding-left:17px}
  .arch-item h3{margin:0;font-size:19px;font-weight:700;letter-spacing:-.01em}
  .arch-item p{margin:7px 0 0;font-size:15px;line-height:1.66;color:var(--muted)}

  /* 표지 — 좌표는 Figma 덱 표지와 동일하다 */
  .cover-slide{padding:0;color:#fff;overflow:hidden;
    background:linear-gradient(150deg,#191a3e 0%,#322d7a 58%,#5a4cbe 100%)}
  .cover-slide .pageno{color:#8d8fc4}
  .cover-slide > div,.cover-slide > img{position:absolute}
  .cv-tile{left:110px;top:132px;width:72px;height:72px;border-radius:18px;background:#fff;
    display:flex;align-items:center;justify-content:center}
  .cv-word{left:188px;top:136px;font-size:30px;font-weight:900;letter-spacing:-.03em}
  .cv-latin{left:190px;top:176px;font:700 15px 'JetBrains Mono',monospace;
    letter-spacing:.24em;color:#b9bffc}
  .cv-eyebrow{left:110px;top:298px;font:700 17px 'JetBrains Mono',monospace;
    color:#b9bffc;letter-spacing:.14em}
  .cv-t1{left:110px;top:330px;font-size:104px;font-weight:900;letter-spacing:-.035em;line-height:1.08}
  .cv-t2{left:110px;top:446px;font-size:104px;font-weight:900;letter-spacing:-.035em;
    line-height:1.08;color:#a9aeef}
  .cv-bar{left:110px;top:600px;width:96px;height:6px;border-radius:3px;background:#d2799b}
  .cv-sub{left:110px;top:632px;width:840px;font-size:26px;font-weight:500;color:#c3c6ef;line-height:1.45}
  .cv-meta{left:110px;top:722px;display:flex;flex-direction:column;gap:14px;
    font:500 17px 'JetBrains Mono',monospace;color:#a4a7de}
  .cv-meta span{display:inline-block;width:96px;color:#7477b4}
  .cv-pills{left:110px;top:868px;display:flex;gap:10px}
  .cv-pills span{padding:9px 16px;border-radius:20px;background:rgba(255,255,255,.10);
    border:1px solid rgba(255,255,255,.24);font:500 15px 'JetBrains Mono',monospace;color:#fff}
  .cv-ph{border-radius:20px;border:1px solid rgba(255,255,255,.2);
    box-shadow:0 18px 46px rgba(8,6,32,.5);object-fit:cover}
  .cv-ph1{left:1000px;top:248px;width:270px;height:584px;opacity:.9}
  .cv-ph3{left:1530px;top:248px;width:270px;height:584px;opacity:.9}
  .cv-ph2{left:1250px;top:205px;width:310px;height:671px}
  .cv-cap{left:1000px;top:900px;width:800px;text-align:center;
    font:500 14px 'JetBrains Mono',monospace;color:#8a8dc6}

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


if (process.argv.includes('--preview')) {
  const dir = process.env.PREVIEW_DIR ?? join(OUT_DIR, '.preview');
  mkdirSync(dir, { recursive: true });
  const els = await page.$$('.slide');
  for (let i = 0; i < els.length; i++) {
    await els[i].screenshot({ path: join(dir, `S${String(i + 1).padStart(2, '0')}.png`) });
  }
  console.log(`PNG   ${dir} (${els.length}장)`);
}

await browser.close();
