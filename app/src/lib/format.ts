/** 날짜/숫자 표시 헬퍼. 서버는 ISO-8601 로컬 시각(오프셋 없음)을 내려준다. */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** '2026-08-30T07:00:00' 같은 문자열을 로컬 Date로 읽는다. */
export function parseServerDate(iso: string): Date {
  return new Date(iso);
}

export function formatTime(iso: string): string {
  const d = parseServerDate(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

export function formatDate(iso: string): string {
  const d = parseServerDate(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

/** yyyy-MM-dd. 서버 쿼리 파라미터로 그대로 쓴다. */
export function toDateParam(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function shortWeekday(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`;
}

/** '3일 남음' 같은 상대 표기. 만료 임박 안내에 쓴다. */
export function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function relativeTime(iso: string): string {
  const diffMin = Math.floor((Date.now() - parseServerDate(iso).getTime()) / 60_000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return formatDate(iso);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
