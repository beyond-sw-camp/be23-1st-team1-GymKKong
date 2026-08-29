/**
 * 앱 전체 디자인 토큰.
 *
 * 팔레트는 브랜드 일러스트(폴더 + 덤벨)에서 뽑았다.
 *   폴더 밝은 면 #4A64BC · 어두운 면 #5045A8 · 덤벨 손잡이 #D9B4C0
 * 인디고와 바이올렛 사이를 주색으로 두고, 로즈를 강조색으로 쓴다.
 */

export const colors = {
  // 브랜드
  primary: '#4C55C2',
  primaryDark: '#3A41A0',
  primarySoft: '#ECEEFB',
  indigo: '#4A64BC',
  violet: '#5045A8',

  /** 로즈. 숫자나 배지처럼 시선을 끌어야 하는 작은 요소에만 쓴다. */
  accent: '#D2799B',
  accentSoft: '#FBEEF3',

  // 배경 / 표면
  background: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#EFF0F6',

  // 텍스트
  text: '#16161D',
  textMuted: '#6A6D80',
  textFaint: '#9A9DB0',
  textInverse: '#FFFFFF',

  // 경계
  border: '#E4E5EF',
  borderStrong: '#CFD1E0',

  // 상태
  success: '#12A150',
  successSoft: '#E7F7EE',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#0891B2',
  infoSoft: '#E0F2FE',

  disabled: '#C3C5D4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
} as const;

/** Android는 elevation, iOS는 shadow*를 쓴다. */
export const shadow = {
  card: {
    shadowColor: '#1B1F3B',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;

/** 예약/수업 상태별 배지 색. */
export const statusColor: Record<string, { bg: string; fg: string }> = {
  RESERVED: { bg: colors.primarySoft, fg: colors.primaryDark },
  ATTENDED: { bg: colors.successSoft, fg: colors.success },
  NOSHOW: { bg: colors.warningSoft, fg: colors.warning },
  CANCELED: { bg: colors.surfaceAlt, fg: colors.textMuted },
  SCHEDULED: { bg: colors.primarySoft, fg: colors.primaryDark },
  IN_PROGRESS: { bg: colors.infoSoft, fg: colors.info },
  COMPLETED: { bg: colors.surfaceAlt, fg: colors.textMuted },
  ACTIVE: { bg: colors.successSoft, fg: colors.success },
  EXPIRED: { bg: colors.surfaceAlt, fg: colors.textMuted },
  REFUNDED: { bg: colors.dangerSoft, fg: colors.danger },
  PENDING: { bg: colors.warningSoft, fg: colors.warning },
  GROUP: { bg: colors.primarySoft, fg: colors.primaryDark },
  PERSONAL: { bg: colors.accentSoft, fg: colors.accent },
  NOTICE: { bg: colors.accentSoft, fg: colors.accent },
};

export const statusLabel: Record<string, string> = {
  RESERVED: '예약됨',
  ATTENDED: '출석',
  NOSHOW: '노쇼',
  CANCELED: '취소됨',
  SCHEDULED: '예정',
  IN_PROGRESS: '진행중',
  COMPLETED: '종료',
  ACTIVE: '사용중',
  EXPIRED: '만료',
  REFUNDED: '환불됨',
  SUSPENDED: '정지',
  PENDING: '승인 대기',
  REJECTED: '거절됨',
  INACTIVE: '해제됨',
  GROUP: '그룹',
  PERSONAL: '개인 PT',
  ALL: '전체',
  BEGINNER: '초급',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
  NOTICE: '공지',
  FREE: '자유',
  QNA: '문의',
};
