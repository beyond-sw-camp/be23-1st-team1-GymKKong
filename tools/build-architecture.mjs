/**
 * 시스템 아키텍처 도식을 그린다.
 *
 * 영역 박스 · 아이콘 노드 · 흐름선 · 범례 · 하단 지표 패널로 구성한 한 장짜리 도식이다.
 * 노드는 절대 좌표로 배치하고, 연결선은 브라우저에서 실제 DOM 위치를 읽어
 * 직각 꺾임으로 이어 붙인다. 좌표를 손으로 두 번 관리하지 않기 위해서다.
 *
 *   node tools/build-architecture.mjs
 *   node tools/build-architecture.mjs --html   # 렌더 전 HTML도 남긴다 (디버깅용)
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(ROOT, 'app', 'package.json'));
const { chromium } = require('@playwright/test');

const OUT_DIR = join(ROOT, 'docs');
const OUT_PNG = join(OUT_DIR, 'architecture-overview.png');
const KEEP_HTML = process.argv.includes('--html');

const W = 1662;
const H = 1220;

// ---------------------------------------------------------------- 팔레트
// 앱 테마(app/src/theme.ts)에서 뽑은 브랜드색을 그대로 쓴다.
const C = {
  ink: '#16161D',
  muted: '#6A6D80',
  faint: '#9A9DB0',
  line: '#D9DCE7',

  indigo: '#4C55C2',
  indigoSoft: '#F3F4FD',
  blue: '#2E7DD7',
  blueSoft: '#F5F9FF',
  orange: '#E8842B',
  orangeSoft: '#FFF8F0',
  green: '#1F9D57',
  greenSoft: '#F2FBF6',
  violet: '#7A5FD3',
  violetSoft: '#F9F6FF',
  gray: '#8E93A6',
  graySoft: '#FAFAFC',
  rose: '#D2799B',
};

// ---------------------------------------------------------------- 아이콘
// 24×24 격자, 선 굵기 1.8 — 앱의 아이콘 세트(app/src/components/Icon.tsx)와 같은 규칙.
// 브랜드 마크만 색을 직접 칠하고, 나머지는 currentColor를 따른다.
const STROKE = {
  user: '<circle cx="12" cy="8" r="3.4"/><path d="M5.2 19.6c.6-3.7 3.4-5.6 6.8-5.6s6.2 1.9 6.8 5.6"/>',
  route:
    '<path d="M12 3.4v17.2"/><path d="M12 5.2h6.8l2 2.4-2 2.4H12z"/><path d="M12 13.6H5.2l-2 2.4 2 2.4H12z"/>',
  refresh: '<path d="M20.2 12a8.2 8.2 0 1 1-2.7-6.1"/><path d="M20.4 4.2v4.4h-4.4"/>',
  lock:
    '<rect x="4.6" y="10.4" width="14.8" height="9.6" rx="2.2"/><path d="M8.1 10.4V7.9a3.9 3.9 0 0 1 7.8 0v2.5"/>',
  shield:
    '<path d="M12 3.2 19.4 6v6c0 4.4-3 7.5-7.4 8.8C7.6 19.5 4.6 16.4 4.6 12V6z"/><path d="M9.3 12.1l2 2 3.5-3.9"/>',
  key:
    '<circle cx="8.2" cy="12" r="3.7"/><path d="M11.9 12h9.2"/><path d="M17.8 12v3.1"/><path d="M20.6 12v2.2"/>',
  globe:
    '<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6c2.2 2.5 3.3 5.3 3.3 8.4S14.2 17.9 12 20.4c-2.2-2.5-3.3-5.3-3.3-8.4S9.8 6.1 12 3.6z"/>',
  alert:
    '<path d="M12 4.4 21 19.8H3z"/><path d="M12 9.9v4.3"/><circle cx="12" cy="17.2" r=".9" fill="currentColor" stroke="none"/>',
  layers:
    '<path d="M12 3.4 20.8 7.9 12 12.4 3.2 7.9z"/><path d="M3.2 12.3 12 16.8l8.8-4.5"/><path d="M3.2 16.5 12 21l8.8-4.5"/>',
  cube:
    '<path d="M12 3.4 20 7.7v8.6L12 20.6 4 16.3V7.7z"/><path d="M4 7.7 12 12l8-4.3"/><path d="M12 12v8.6"/>',
  db:
    '<ellipse cx="12" cy="6.3" rx="7.5" ry="2.9"/><path d="M4.5 6.3v11.4c0 1.6 3.4 2.9 7.5 2.9s7.5-1.3 7.5-2.9V6.3"/><path d="M4.5 12c0 1.6 3.4 2.9 7.5 2.9s7.5-1.3 7.5-2.9"/>',
  disk:
    '<rect x="3.6" y="4.4" width="16.8" height="15.2" rx="2.4"/><path d="M7.8 4.4v5.4h8.4V4.4"/><circle cx="12" cy="15" r="2.3"/>',
  filecode:
    '<path d="M13.4 3.4H7.3A2.2 2.2 0 0 0 5.1 5.6v12.8a2.2 2.2 0 0 0 2.2 2.2h9.4a2.2 2.2 0 0 0 2.2-2.2V9z"/><path d="M13.4 3.4V9h5.5"/><path d="M10.6 12.9 8.9 14.7l1.7 1.8"/><path d="M13.4 12.9l1.7 1.8-1.7 1.8"/>',
  check: '<circle cx="12" cy="12" r="8.6"/><path d="M8.2 12.3l2.6 2.6 5-5.5"/>',
  browser:
    '<rect x="3.2" y="4.4" width="17.6" height="15.2" rx="2.2"/><path d="M3.2 9.1h17.6"/><circle cx="6.5" cy="6.8" r=".8" fill="currentColor" stroke="none"/><path d="M10.4 12.2l4.4 2.4-4.4 2.4z"/>',
  braces:
    '<path d="M9.6 4.2c-2 0-2.7 1-2.7 2.6v2.4c0 1.5-.7 2.4-2.2 2.8 1.5.4 2.2 1.3 2.2 2.8v2.4c0 1.6.7 2.6 2.7 2.6"/><path d="M14.4 4.2c2 0 2.7 1 2.7 2.6v2.4c0 1.5.7 2.4 2.2 2.8-1.5.4-2.2 1.3-2.2 2.8v2.4c0 1.6-.7 2.6-2.7 2.6"/>',
  flow:
    '<rect x="8.5" y="3.2" width="7" height="4.6" rx="1.2"/><rect x="2.6" y="16.2" width="7" height="4.6" rx="1.2"/><rect x="14.4" y="16.2" width="7" height="4.6" rx="1.2"/><path d="M12 7.8v4.4"/><path d="M6.1 16.2v-4h11.8v4"/>',
  camera:
    '<rect x="3" y="6.8" width="18" height="13.1" rx="2.4"/><path d="M8.7 6.8 10 4.2h4l1.3 2.6"/><circle cx="12" cy="13.3" r="3.4"/>',
  image:
    '<rect x="3.2" y="4.8" width="17.6" height="14.4" rx="2.2"/><circle cx="8.5" cy="9.7" r="1.5"/><path d="M3.6 16.7l4.9-4.3 3.5 3 3-2.4 5.4 4.3"/>',
  film:
    '<rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="M7.5 5v14M16.5 5v14"/><path d="M3 12h18"/>',
  gear:
    '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.9v2.6M12 18.5v2.6M21.1 12h-2.6M5.5 12H2.9M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6"/>',
  branch:
    '<circle cx="6.6" cy="6" r="2.4"/><circle cx="6.6" cy="18" r="2.4"/><circle cx="17.4" cy="9.4" r="2.4"/><path d="M6.6 8.4v7.2"/><path d="M17.4 11.8c0 3.4-3 4.1-5.6 4.4"/>',
  pr:
    '<circle cx="6.6" cy="6.2" r="2.4"/><circle cx="6.6" cy="18" r="2.4"/><circle cx="17.4" cy="18" r="2.4"/><path d="M6.6 8.6v7"/><path d="M17.4 15.6V10a3 3 0 0 0-3-3h-3"/><path d="M13.6 4.8 11.4 7l2.2 2.2"/>',
  card:
    '<rect x="2.8" y="5.4" width="18.4" height="13.2" rx="2.4"/><path d="M2.8 10h18.4"/><path d="M6.4 14.6h3.6"/>',
  mail: '<rect x="2.8" y="5" width="18.4" height="14" rx="2.4"/><path d="M3.5 7.3 12 13.1l8.5-5.8"/>',
  bell: '<path d="M18 16.4V11a6 6 0 0 0-12 0v5.4L4.4 18.5h15.2z"/><path d="M10 21h4"/>',
  cloud:
    '<path d="M7.4 18.7h9.3a4 4 0 0 0 .7-8 5.9 5.9 0 0 0-11.3 1.2 3.4 3.4 0 0 0 1.3 6.8z"/><path d="M12 15.6V9.9"/><path d="M9.7 12.2 12 9.9l2.3 2.3"/>',
  server:
    '<rect x="3.4" y="4.2" width="17.2" height="6" rx="1.8"/><rect x="3.4" y="13.8" width="17.2" height="6" rx="1.8"/><path d="M7.1 7.2h.1M7.1 16.8h.1"/>',
  scale:
    '<path d="M4.6 19.4V9.2M12 19.4V4.6M19.4 19.4v-6.6"/><circle cx="4.6" cy="7" r="1.7"/><circle cx="12" cy="2.9" r="1.7"/><circle cx="19.4" cy="10.6" r="1.7"/>',
};

const BRAND = {
  react:
    '<g fill="none" stroke="#3AA6C8" stroke-width="1.25"><ellipse cx="12" cy="12" rx="10.2" ry="3.9"/><ellipse cx="12" cy="12" rx="10.2" ry="3.9" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10.2" ry="3.9" transform="rotate(120 12 12)"/></g><circle cx="12" cy="12" r="2" fill="#3AA6C8"/>',
  spring:
    '<path d="M19.8 4.3c1 6.7-2.6 11.5-8.3 12.8-2 .4-3.4 1.2-4.3 2.6l-1.7-1c1-2.4 2.8-4 5.3-4.8 3.4-1.1 5.4-3 6.4-6-2.6 3-5.6 3.7-8.2 4.6-2.4.9-3.9 2.3-4.4 4.6C3.4 13.5 5 10.2 8.7 8.9c3.2-1.1 7.4-1 11.1-4.6z" fill="#6DB33F"/>',
  docker:
    '<g fill="#2496ED"><rect x="3.9" y="10.5" width="2.5" height="2.3" rx=".3"/><rect x="6.9" y="10.5" width="2.5" height="2.3" rx=".3"/><rect x="9.9" y="10.5" width="2.5" height="2.3" rx=".3"/><rect x="6.9" y="7.8" width="2.5" height="2.3" rx=".3"/><rect x="9.9" y="7.8" width="2.5" height="2.3" rx=".3"/><rect x="9.9" y="5.1" width="2.5" height="2.3" rx=".3"/><path d="M2.3 13.4h14.4c.4 1.7-.2 3.2-1.5 4.2-1.5 1.2-3.8 1.8-6.6 1.8-4.2 0-6.6-2-7.3-4.6a4.6 4.6 0 0 1 1-1.4z"/><path d="M16.4 11.6c1-1.3 2.4-1.3 3.5-.3.5-.9 1.4-1.2 2.3-1-.2 1.7-1.3 2.7-2.9 2.7z"/></g>',
  maria:
    '<path d="M4.6 6.3v11.4c0 1.6 3.4 2.9 7.5 2.9s7.5-1.3 7.5-2.9V6.3z" fill="#003545"/><ellipse cx="12.1" cy="6.3" rx="7.5" ry="2.9" fill="#C0765A"/><path d="M7.6 12.4c1.3 1 2.7 1.5 4.5 1.5s3.2-.5 4.5-1.5" fill="none" stroke="#C0765A" stroke-width="1.3" stroke-linecap="round"/>',
  github:
    '<circle cx="12" cy="12" r="9.4" fill="#24292F"/><path d="M12 5.6c-3.6 0-6.5 2.9-6.5 6.5 0 2.9 1.9 5.3 4.4 6.2.3.1.4-.1.4-.3v-1.2c-1.8.4-2.2-.8-2.2-.8-.3-.8-.7-1-.7-1-.6-.4 0-.4 0-.4.7 0 1 .7 1 .7.6 1 1.6.7 2 .6 0-.5.2-.7.4-.9-1.5-.2-3-.7-3-3.2 0-.7.3-1.3.7-1.8-.1-.2-.3-.9.1-1.8 0 0 .6-.2 1.8.7a6 6 0 0 1 3.2 0c1.2-.9 1.8-.7 1.8-.7.4.9.1 1.6.1 1.8.4.5.7 1.1.7 1.8 0 2.5-1.5 3-3 3.2.2.2.4.6.4 1.3v1.9c0 .2.1.4.5.3a6.5 6.5 0 0 0 4.4-6.2c0-3.6-2.9-6.5-6.5-6.5z" fill="#fff"/>',
};

/** 아이콘 하나를 그린다. 브랜드 마크는 자기 색을, 나머지는 지정색을 따른다. */
function icon(name, size = 26, color = C.indigo) {
  if (BRAND[name]) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24">${BRAND[name]}</svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${STROKE[name]}</svg>`;
}

// ---------------------------------------------------------------- 조각
const parts = [];
const push = (html) => parts.push(html);

/** 영역 박스. 안의 노드는 별도로 전역 좌표에 배치한다. */
function region({ id, x, y, w, h, color, fill, title, note, dashed, titleColor }) {
  push(`<div class="region${dashed ? ' dashed' : ''}" id="${id}"
    style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-color:${color};background:${fill}">
    <div class="rhead" style="color:${titleColor ?? color}">${title}</div>
    ${note ? `<div class="rnote">${note}</div>` : ''}
  </div>`);
}

/** 영역 안의 소분류 박스. */
function sub({ id, x, y, w, h, color, fill, title }) {
  push(`<div class="sub" id="${id}"
    style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-color:${color};background:${fill}">
    <div class="shead" style="color:${color}">${title}</div>
  </div>`);
}

/** 아이콘 + 이름 + 부연으로 이뤄진 노드 카드. */
function node({ id, x, y, w, h, ic, color = C.indigo, label, note, size = 26 }) {
  push(`<div class="node" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
    ${icon(ic, size, color)}
    <div class="nlabel">${label}</div>
    ${note ? `<div class="nnote">${note}</div>` : ''}
  </div>`);
}

/** 계층 안에서 이름만 나열하는 작은 칩. */
function chips({ x, y, w, items, perRow, chipH = 27, gap = 7, color }) {
  const cw = (w - gap * (perRow - 1)) / perRow;
  items.forEach((t, i) => {
    const cx = x + (i % perRow) * (cw + gap);
    const cy = y + Math.floor(i / perRow) * (chipH + gap);
    push(`<div class="chip" style="left:${cx}px;top:${cy}px;width:${cw}px;height:${chipH}px;
      border-color:${color}33;background:${color}0F;color:${color}">${t}</div>`);
  });
  return y + Math.ceil(items.length / perRow) * (chipH + gap) - gap;
}

/** 계층 띠 — 왼쪽에 계층 이름, 오른쪽에 구성요소 칩. */
function layer({ id, x, y, w, h, color, name, count, items, perRow }) {
  push(`<div class="layer" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;
    border-color:${color}2E;background:${color}09"></div>`);
  push(`<div class="lname" style="left:${x + 14}px;top:${y + h / 2 - 17}px;color:${color}">
    ${name}<span class="lcount">${count}</span></div>`);
  chips({ x: x + 122, y: y + 11, w: w - 136, items, perRow, color });
}

function text({ x, y, cls, style = '', html }) {
  push(`<div class="${cls}" style="left:${x}px;top:${y}px;${style}">${html}</div>`);
}

// ================================================================ 배치
// 제목
text({
  x: 36, y: 26, cls: 'title',
  html: 'GymKKong 시스템 아키텍처',
});
text({
  x: 36, y: 60, cls: 'subtitle',
  html: '스키마 v2 (23 tables / 2 views) · Spring Boot 3.4 REST API · Expo(React Native) 앱 — 로컬 Docker 환경',
});

// ---------------------------------------------------------------- 클라이언트
node({ id: 'n-user', x: 38, y: 190, w: 48, h: 48, ic: 'user', color: '#fff', label: '', size: 26 });
push(`<div class="userdot" style="left:38px;top:190px"></div>`);
text({ x: 20, y: 243, cls: 'cap', style: 'width:84px;text-align:center', html: '회원 · 트레이너<br/>관리자' });

region({
  id: 'r-client', x: 104, y: 96, w: 318, h: 234,
  color: C.orange, fill: C.orangeSoft,
  title: 'Client — Expo (React Native)',
  note: 'expo-router · TanStack Query',
});
node({ id: 'n-expo', x: 120, y: 152, w: 94, h: 76, ic: 'react', label: 'Expo App', note: 'iOS · Android · Web' });
node({ id: 'n-router', x: 222, y: 152, w: 94, h: 76, ic: 'route', color: C.orange, label: 'expo-router', note: '파일 기반 라우팅' });
node({ id: 'n-query', x: 324, y: 152, w: 82, h: 76, ic: 'refresh', color: C.orange, label: 'TanStack Query', note: '캐시 · 무효화' });
node({ id: 'n-secure', x: 175, y: 240, w: 176, h: 72, ic: 'lock', color: C.orange, label: 'SecureStore + axios 인터셉터', note: '토큰 보관 · 401 시 단일 비행 재발급' });

// ---------------------------------------------------------------- RBAC
region({
  id: 'r-rbac', x: 36, y: 356, w: 386, h: 258,
  color: C.indigo, fill: C.indigoSoft,
  title: '역할 기반 접근 제어 — 4단 방어',
  note: 'MEMBER · TRAINER · ADMIN · SUPER_ADMIN',
});
const rbacRows = [
  ['1', 'URL 패턴', 'SecurityConfig — requestMatchers'],
  ['2', '메서드 권한', '@PreAuthorize — hasRole'],
  ['3', '리소스 범위', '담당 지점 · 본인 소유 검사'],
  ['4', '도메인 불변식', '엔티티 상태 · 잔여 횟수 검사'],
];
rbacRows.forEach(([n, t, d], i) => {
  const y = 420 + i * 45;
  push(`<div class="rbac" style="left:52px;top:${y}px">
    <span class="rbnum">${n}</span>
    <span class="rbt">${t}</span>
    <span class="rbd">${d}</span>
  </div>`);
});

// ---------------------------------------------------------------- CI
region({
  id: 'r-ci', x: 36, y: 640, w: 386, h: 190,
  color: C.blue, fill: '#FFFFFF',
  title: 'CI / 형상',
  note: '배포 파이프라인 없음 — 로컬 실행까지',
});
node({ id: 'n-gh', x: 58, y: 700, w: 106, h: 78, ic: 'github', label: 'GitHub', note: 'beyond-sw-camp' });
node({ id: 'n-branch', x: 178, y: 700, w: 106, h: 78, ic: 'branch', color: C.blue, label: 'feat/rn-app', note: '13 commits' });
node({ id: 'n-pr', x: 298, y: 700, w: 106, h: 78, ic: 'pr', color: C.blue, label: 'PR #1', note: '→ main' });

// ---------------------------------------------------------------- 런타임
region({
  id: 'r-runtime', x: 486, y: 76, w: 744, h: 870,
  color: C.blue, fill: C.blueSoft,
  title: 'Local Runtime — Docker Compose + Spring Boot',
  note: 'http://localhost:8090',
});

push(`<div class="badge" style="left:1140px;top:88px">${icon('docker', 22)}</div>`);
push(`<div class="badge" style="left:1180px;top:88px">${icon('spring', 22)}</div>`);

// 인증 계층
sub({ id: 's-edge', x: 516, y: 122, w: 684, h: 124, color: C.gray, fill: C.graySoft, title: 'Edge / 인증 계층 — Spring Security (stateless)' });
const edgeX = [534, 699, 864, 1029];
node({ id: 'n-chain', x: edgeX[0], y: 158, w: 153, h: 72, ic: 'shield', color: C.gray, label: 'SecurityFilterChain', note: '세션 없음 · CSRF off' });
node({ id: 'n-jwt', x: edgeX[1], y: 158, w: 153, h: 72, ic: 'key', color: C.gray, label: 'JwtAuthenticationFilter', note: 'Bearer 검증 → AuthUser' });
node({ id: 'n-cors', x: edgeX[2], y: 158, w: 153, h: 72, ic: 'globe', color: C.gray, label: 'CORS', note: '앱 오리진 허용' });
node({ id: 'n-exh', x: edgeX[3], y: 158, w: 153, h: 72, ic: 'alert', color: C.gray, label: 'GlobalExceptionHandler', note: 'ErrorCode → 상태코드' });

// 애플리케이션 계층
sub({ id: 's-app', x: 516, y: 262, w: 684, h: 416, color: C.indigo, fill: '#FFFFFF', title: 'Application Layer — Spring Boot 3.4 · Java 21 · JPA' });
layer({
  id: 'l-ctrl', x: 532, y: 300, w: 652, h: 84, color: C.indigo,
  name: 'Controller', count: '7',
  items: ['Auth', 'Me', 'Place', 'Reservation', 'Trainer', 'Admin', 'Post'],
  perRow: 4,
});
layer({
  id: 'l-svc', x: 532, y: 396, w: 652, h: 84, color: C.indigo,
  name: 'Service', count: '8',
  items: ['Auth', 'Membership', 'Reservation', 'Class', 'Place', 'Community', 'Admin', 'Notification'],
  perRow: 4,
});
layer({
  id: 'l-rep', x: 532, y: 492, w: 652, h: 84, color: C.indigo,
  name: 'Persistence', count: 'JPA',
  items: ['Repository 21', 'Domain Entity 21', '@Transactional', 'JOIN FETCH (N+1 회피)'],
  perRow: 4,
});
push(`<div class="cross" id="l-cross" style="left:532px;top:588px;width:652px;height:68px">
  <div class="ctitle">동시성 · 정합성 (ReservationService)</div>
  <div class="crow">
    <span>${icon('lock', 15, C.rose)}회차 행 비관적 락 <b>SELECT … FOR UPDATE</b></span>
    <span>${icon('shield', 15, C.rose)}DB 제약 <b>UNIQUE(session_id, member_user_id)</b></span>
  </div>
  <div class="crow">
    <span>${icon('scale', 15, C.rose)}이용권 차감 · 정원 증가를 한 트랜잭션에서</span>
    <span>${icon('alert', 15, C.rose)}제약 위반 → <b>ALREADY_RESERVED</b></span>
  </div>
</div>`);

// 데이터 계층
sub({ id: 's-data', x: 516, y: 716, w: 684, h: 200, color: C.orange, fill: C.orangeSoft, title: 'Data — Docker Compose' });
node({ id: 'n-maria', x: 540, y: 762, w: 200, h: 128, ic: 'maria', size: 34, label: 'MariaDB 11.4', note: 'gymkkong_v2 · utf8mb4<br/>23 tables · 2 views<br/>21개 매핑 · 2개는 스키마에만<br/>ddl-auto: validate' });
node({ id: 'n-vol', x: 758, y: 762, w: 200, h: 128, ic: 'disk', color: C.orange, size: 34, label: 'gymkkong-db', note: 'named volume<br/>데이터 영속' });
node({ id: 'n-init', x: 976, y: 762, w: 200, h: 128, ic: 'filecode', color: C.orange, size: 34, label: 'db/v2/*.sql', note: '00_reset · 01_schema<br/>02_seed<br/>entrypoint 자동 적재' });

// ---------------------------------------------------------------- 미연동
region({
  id: 'r-ext', x: 1290, y: 76, w: 336, h: 288,
  color: C.violet, fill: C.violetSoft, dashed: true,
  title: '아직 연동하지 않은 것',
  note: '돈 · 외부 계약이 필요해 로컬에서는 대체 동작',
});
node({ id: 'n-pg', x: 1312, y: 148, w: 148, h: 90, ic: 'card', color: C.violet, label: 'PG 결제', note: '결제 성공 가정 후<br/>이용권 발급' });
node({ id: 'n-sms', x: 1470, y: 148, w: 148, h: 90, ic: 'mail', color: C.violet, label: 'SMS / Email', note: '인증코드는<br/>서버 로그로 출력' });
node({ id: 'n-push', x: 1312, y: 250, w: 148, h: 90, ic: 'bell', color: C.violet, label: '푸시 발송', note: 'device_token 적재<br/>알림은 DB까지' });
node({ id: 'n-deploy', x: 1470, y: 250, w: 148, h: 90, ic: 'cloud', color: C.violet, label: '배포', note: '로컬 Docker까지<br/>클라우드 미구성' });

// ---------------------------------------------------------------- 검증
region({
  id: 'r-verify', x: 1290, y: 398, w: 336, h: 438,
  color: C.green, fill: C.greenSoft,
  title: '검증 · 증적 파이프라인',
  note: '전부 로컬에서 실제로 돌려 확인',
});
node({ id: 'n-smoke', x: 1312, y: 452, w: 148, h: 82, ic: 'check', color: C.green, label: 'smoke-test.sh', note: 'API 22 / 22' });
node({ id: 'n-e2e', x: 1470, y: 452, w: 148, h: 82, ic: 'browser', color: C.green, label: 'Playwright E2E', note: '28 / 28 · 실제 브라우저' });
node({ id: 'n-tsc', x: 1312, y: 546, w: 148, h: 82, ic: 'braces', color: C.green, label: 'tsc --noEmit', note: '타입 검사 통과' });
node({ id: 'n-mmd', x: 1470, y: 546, w: 148, h: 82, ic: 'flow', color: C.green, label: 'check-mermaid', note: '다이어그램 34 / 34' });

sub({ id: 's-evi', x: 1306, y: 644, w: 306, h: 176, color: C.green, fill: '#FFFFFF', title: '증적 산출물 — docs/evidence' });
node({ id: 'n-console', x: 1320, y: 682, w: 92, h: 76, ic: 'camera', color: C.green, label: '콘솔', note: '8건' });
node({ id: 'n-shot', x: 1420, y: 682, w: 92, h: 76, ic: 'image', color: C.green, label: '화면', note: '46장' });
node({ id: 'n-video', x: 1520, y: 682, w: 78, h: 76, ic: 'film', color: C.green, label: '녹화', note: '28건' });
push(`<div class="tool" style="left:1320px;top:770px;width:278px">tools/capture-console.mjs · e2e/global-teardown.ts</div>`);

// ---------------------------------------------------------------- 하단 지표
region({
  id: 'r-metrics', x: 36, y: 970, w: 1190, h: 210,
  color: C.green, fill: '#FFFFFF', dashed: true,
  title: '이 구조로 보장하는 것 — 실제로 검증한 항목',
});
const METRICS = [
  ['인증 · 토큰', [
    'JWT 액세스 + 불투명 리프레시',
    '리프레시는 SHA-256 해시로 저장',
    '재발급 시 회전 · 이전 토큰 폐기',
    '앱은 단일 비행으로 중복 재발급 차단',
  ]],
  ['예약 동시성', [
    '회차 행 비관적 락 (FOR UPDATE)',
    'UNIQUE(session_id, member_user_id)',
    '정원 초과 예약 차단',
    '중복 예약 → ALREADY_RESERVED',
  ]],
  ['권한 (RBAC)', [
    'URL · 메서드 · 리소스 · 불변식',
    '이용권 구매/환불 MEMBER 전용',
    'ADMIN은 담당 지점만, SUPER는 전 지점',
    '우회 시도 10건 차단 확인',
  ]],
  ['데이터 무결성', [
    'ddl-auto: validate — 스키마 대조',
    'CHECK 0 ≤ 잔여 ≤ 총 횟수',
    '강습실 시간 겹침 차단',
    '소프트 삭제로 이력 보존',
  ]],
  ['이용권 수명주기', [
    '예약 시 차감 · 취소 시 복원',
    '노쇼는 차감 유지',
    '이미 환불된 이용권 재환불 차단',
    '결제 · 환불 이력 적재',
  ]],
  ['검증 결과', [
    'API 스모크 22 / 22',
    'E2E 시나리오 28 / 28',
    '타입 검사 통과',
    'mermaid 다이어그램 34 / 34',
  ]],
];
METRICS.forEach(([head, items], i) => {
  const x = 58 + i * 195;
  push(`<div class="mcol" style="left:${x}px;top:1014px;width:182px">
    <div class="mhead">${head}</div>
    ${items.map((t) => `<div class="mitem"><span>✓</span>${t}</div>`).join('')}
  </div>`);
});

text({
  x: 58, y: 1146, cls: 'lgnote',
  html: '※ 각 항목은 backend/scripts/smoke-test.sh 와 app/e2e 시나리오로 실제 검증했습니다. 증적은 docs/evidence 에 있습니다.',
});

// ---------------------------------------------------------------- 범례
region({ id: 'r-legend', x: 1250, y: 970, w: 376, h: 210, color: C.line, fill: '#FFFFFF', title: '범례', titleColor: C.muted });
const LEGEND = [
  [C.ink, 'solid', '요청 / 응답 흐름'],
  [C.indigo, 'solid', '계층 호출 (동기)'],
  [C.orange, 'dash', '데이터 / 트랜잭션 흐름'],
  [C.green, 'dash', '검증 / 증적 흐름'],
  [C.blue, 'dash', '형상 / CI 흐름'],
  [C.violet, 'dash', '미연동 (대체 동작 중)'],
];
LEGEND.forEach(([col, kind, label], i) => {
  const y = 1014 + i * 26;
  push(`<div class="lgrow" style="left:1272px;top:${y}px">
    <svg width="52" height="12" viewBox="0 0 52 12">
      <path d="M1 6h40" stroke="${col}" stroke-width="2" ${kind === 'dash' ? 'stroke-dasharray="5 4"' : ''} fill="none"/>
      <path d="M40 2.2 48 6l-8 3.8z" fill="${col}"/>
    </svg>
    <span>${label}</span>
  </div>`);
});
text({
  x: 1272, y: 1160, cls: 'lgnote',
  html: '실선 = 런타임 호출 · 점선 = 부가 / 비동기 흐름',
});

// ---------------------------------------------------------------- 연결선
const LINKS = [
  { from: 'n-user', fs: 'r', to: 'r-client', ts: 'l', type: 'flow' },
  { from: 'r-client', fs: 'r', to: 's-edge', ts: 'l', type: 'flow', fo: [0, -22], label: 'REST / JSON', label2: 'Authorization: Bearer' },
  { from: 's-edge', fs: 'b', to: 's-app', ts: 't', type: 'flow', label: '인증 통과 → AuthUser 주입', side: 'r' },
  { from: 'l-ctrl', fs: 'b', to: 'l-svc', ts: 't', type: 'call', fo: [240, 0], to_: [240, 0] },
  { from: 'l-svc', fs: 'b', to: 'l-rep', ts: 't', type: 'call', fo: [240, 0], to_: [240, 0] },
  { from: 'l-rep', fs: 'b', to: 'l-cross', ts: 't', type: 'call', fo: [240, 0], to_: [240, 0] },
  { from: 's-app', fs: 'b', to: 'n-maria', ts: 't', type: 'data', fo: [-218, 0], label: 'JDBC · HikariCP', lo: [96, 2] },
  { from: 'r-rbac', fs: 'r', to: 's-app', ts: 'l', type: 'call', label: '권한 판정', dash: true },
  { from: 'r-runtime', fs: 'r', to: 'r-ext', ts: 'l', type: 'ext', fo: [0, -291], label: '미연동' },
  { from: 'r-verify', fs: 'l', to: 'r-runtime', ts: 'r', type: 'verify', label: '시나리오 주행', label2: '결과 수집' },
  { from: 'n-tsc', fs: 'b', to: 's-evi', ts: 't', type: 'verify', fo: [40, 0] },
  { from: 'n-gh', fs: 'r', to: 'n-branch', ts: 'l', type: 'ci' },
  { from: 'n-branch', fs: 'r', to: 'n-pr', ts: 'l', type: 'ci' },
];

const LINK_STYLE = {
  flow: { color: C.ink, dash: null },
  call: { color: C.indigo, dash: null },
  data: { color: C.orange, dash: '6 5' },
  verify: { color: C.green, dash: '6 5' },
  ci: { color: C.blue, dash: '6 5' },
  ext: { color: C.violet, dash: '6 5' },
};

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>GymKKong 아키텍처</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #fff; }
  #canvas {
    position: relative; width: ${W}px; height: ${H}px; background: #fff;
    font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Segoe UI', sans-serif;
    color: ${C.ink}; -webkit-font-smoothing: antialiased;
  }
  #canvas > div { position: absolute; }

  .title { font-size: 23px; font-weight: 800; letter-spacing: -.6px; }
  .subtitle { font-size: 12.5px; color: ${C.muted}; letter-spacing: -.2px; }

  .region { border: 2px solid; border-radius: 11px; z-index: 1; }
  .region.dashed { border-style: dashed; }
  .rhead {
    position: absolute; top: 9px; left: 14px;
    font-size: 12.5px; font-weight: 800; letter-spacing: -.3px;
  }
  .rnote {
    position: absolute; top: 26px; left: 14px;
    font-size: 10px; color: ${C.faint}; letter-spacing: -.2px;
  }

  .sub { border: 1.5px solid; border-radius: 9px; z-index: 2; }
  .shead {
    position: absolute; top: 8px; left: 12px;
    font-size: 11px; font-weight: 700; letter-spacing: -.2px;
  }

  .node {
    background: #fff; border: 1px solid ${C.line}; border-radius: 9px;
    box-shadow: 0 1px 3px rgba(22, 24, 45, .07);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; padding: 7px 6px; z-index: 4;
  }
  .nlabel { font-size: 10.5px; font-weight: 700; letter-spacing: -.3px; text-align: center; line-height: 1.25; }
  .nnote { font-size: 9px; color: ${C.faint}; text-align: center; line-height: 1.35; letter-spacing: -.2px; }

  .userdot {
    width: 48px; height: 48px; border-radius: 50%; background: #F97316; z-index: 3;
  }
  #n-user { background: transparent; border: 0; box-shadow: none; }
  .cap { font-size: 9.5px; color: ${C.muted}; line-height: 1.3; z-index: 4; }

  .layer { border: 1px solid; border-radius: 8px; z-index: 3; }
  .lname { font-size: 11.5px; font-weight: 800; letter-spacing: -.3px; z-index: 4; width: 110px; }
  .lcount {
    display: inline-block; margin-left: 5px; padding: 1px 6px; border-radius: 20px;
    background: ${C.indigo}; color: #fff; font-size: 9px; font-weight: 700; vertical-align: 1px;
  }
  .chip {
    z-index: 4; border: 1px solid; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600; letter-spacing: -.2px;
  }

  .cross { border: 1px dashed ${C.rose}66; background: ${C.rose}0A; border-radius: 8px; z-index: 3; padding: 8px 12px; }
  .ctitle { font-size: 10.5px; font-weight: 800; color: ${C.rose}; margin-bottom: 5px; letter-spacing: -.3px; }
  .crow { display: flex; gap: 18px; margin-top: 3px; }
  .crow span {
    display: flex; align-items: center; gap: 5px;
    font-size: 9.5px; color: ${C.muted}; letter-spacing: -.2px; width: 306px;
  }
  .crow b { color: ${C.ink}; font-weight: 700; }

  .rbac {
    display: flex; align-items: center; gap: 9px; z-index: 4;
    width: 354px; height: 36px; padding: 0 11px;
    background: #fff; border: 1px solid ${C.indigo}22; border-radius: 8px;
  }
  .rbnum {
    width: 17px; height: 17px; border-radius: 50%; background: ${C.indigo}; color: #fff;
    font-size: 9.5px; font-weight: 800; display: flex; align-items: center; justify-content: center;
  }
  .rbt { font-size: 10.5px; font-weight: 700; width: 74px; letter-spacing: -.3px; }
  .rbd { font-size: 9.5px; color: ${C.muted}; letter-spacing: -.2px; }

  .badge {
    z-index: 5; width: 34px; height: 34px; border-radius: 8px; background: #fff;
    border: 1px solid ${C.line}; display: flex; align-items: center; justify-content: center;
  }
  .tool {
    z-index: 4; height: 30px; border-radius: 6px; background: ${C.green}0F;
    border: 1px solid ${C.green}33; color: ${C.green};
    display: flex; align-items: center; justify-content: center;
    font-size: 9.5px; font-weight: 600; letter-spacing: -.2px;
  }

  .mcol { z-index: 4; }
  .mhead {
    font-size: 11px; font-weight: 800; color: ${C.indigo}; letter-spacing: -.3px;
    padding-bottom: 6px; margin-bottom: 7px; border-bottom: 1.5px solid ${C.indigo}22;
  }
  .mitem {
    display: flex; gap: 5px; font-size: 9.5px; color: ${C.muted};
    line-height: 1.45; margin-bottom: 5px; letter-spacing: -.3px;
  }
  .mitem span { color: ${C.green}; font-weight: 800; }

  .lgrow { z-index: 4; display: flex; align-items: center; gap: 10px; }
  .lgrow span { font-size: 10.5px; color: ${C.ink}; letter-spacing: -.3px; }
  .lgnote { z-index: 4; font-size: 9.5px; color: ${C.faint}; letter-spacing: -.2px; }

  .alabel {
    position: absolute; z-index: 5; font-size: 9.5px; font-weight: 600;
    letter-spacing: -.3px; white-space: nowrap; background: #fff;
    padding: 1px 4px; border-radius: 3px; transform: translate(-50%, -50%);
  }
  #wires { position: absolute; left: 0; top: 0; z-index: 3; pointer-events: none; }
</style></head>
<body><div id="canvas">
${parts.join('\n')}
<svg id="wires" width="${W}" height="${H}"></svg>
</div>
<script>
const LINKS = ${JSON.stringify(LINKS)};
const STYLE = ${JSON.stringify(LINK_STYLE)};
const svg = document.getElementById('wires');
const NS = 'http://www.w3.org/2000/svg';
const canvas = document.getElementById('canvas').getBoundingClientRect();

function box(id) {
  const r = document.getElementById(id).getBoundingClientRect();
  return { x: r.left - canvas.left, y: r.top - canvas.top, w: r.width, h: r.height };
}
function anchor(r, side, off) {
  const [dx, dy] = off || [0, 0];
  const p = {
    l: { x: r.x, y: r.y + r.h / 2 },
    r: { x: r.x + r.w, y: r.y + r.h / 2 },
    t: { x: r.x + r.w / 2, y: r.y },
    b: { x: r.x + r.w / 2, y: r.y + r.h },
  }[side];
  return { x: p.x + dx, y: p.y + dy };
}
/** 두 앵커를 직각 두 번까지만 꺾어 잇는다. */
function route(a, b, fs, ts) {
  if (Math.abs(a.y - b.y) < 2 || Math.abs(a.x - b.x) < 2) return [a, b];
  const h = (s) => s === 'l' || s === 'r';
  if (h(fs) && h(ts)) { const m = (a.x + b.x) / 2; return [a, { x: m, y: a.y }, { x: m, y: b.y }, b]; }
  if (!h(fs) && !h(ts)) { const m = (a.y + b.y) / 2; return [a, { x: a.x, y: m }, { x: b.x, y: m }, b]; }
  if (h(fs)) return [a, { x: b.x, y: a.y }, b];
  return [a, { x: a.x, y: b.y }, b];
}

const defs = document.createElementNS(NS, 'defs');
Object.entries(STYLE).forEach(([k, s]) => {
  const m = document.createElementNS(NS, 'marker');
  m.setAttribute('id', 'ah-' + k);
  m.setAttribute('viewBox', '0 0 10 10');
  m.setAttribute('refX', '8.5'); m.setAttribute('refY', '5');
  m.setAttribute('markerWidth', '7'); m.setAttribute('markerHeight', '7');
  m.setAttribute('orient', 'auto-start-reverse');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', 'M0 1.2 9 5 0 8.8z');
  p.setAttribute('fill', s.color);
  m.appendChild(p); defs.appendChild(m);
});
svg.appendChild(defs);

for (const l of LINKS) {
  const s = STYLE[l.type];
  const a = anchor(box(l.from), l.fs, l.fo);
  const b = anchor(box(l.to), l.ts, l.to_);
  const pts = route(a, b, l.fs, l.ts);
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', pts.map((p, i) => (i ? 'L' : 'M') + p.x + ' ' + p.y).join(' '));
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', s.color);
  path.setAttribute('stroke-width', '1.9');
  path.setAttribute('stroke-linejoin', 'round');
  if (s.dash || l.dash) path.setAttribute('stroke-dasharray', s.dash || '5 4');
  path.setAttribute('marker-end', 'url(#ah-' + l.type + ')');
  svg.appendChild(path);

  if (l.label) {
    // 라벨은 경로의 가운데 구간 중점에 붙인다.
    const mid = pts.length > 2 ? pts[Math.floor(pts.length / 2) - 1] : pts[0];
    const nxt = pts.length > 2 ? pts[Math.floor(pts.length / 2)] : pts[1];
    const lo = l.lo || [0, 0];
    const cx = (mid.x + nxt.x) / 2 + lo[0], cy = (mid.y + nxt.y) / 2 + lo[1];
    const mk = (t, dy) => {
      const d = document.createElement('div');
      d.className = 'alabel';
      d.textContent = t;
      d.style.left = cx + 'px';
      d.style.top = (cy + dy) + 'px';
      d.style.color = s.color;
      document.getElementById('canvas').appendChild(d);
    };
    if (l.label2) { mk(l.label, -8); mk(l.label2, 6); } else { mk(l.label, -9); }
  }
}
</script></body></html>`;

mkdirSync(OUT_DIR, { recursive: true });
if (KEEP_HTML) writeFileSync(join(OUT_DIR, 'architecture-overview.html'), html, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.locator('#canvas').screenshot({ path: OUT_PNG });
await browser.close();

console.log(`아키텍처 도식을 ${OUT_PNG} 에 저장했습니다 (${W}×${H} @2x).`);
