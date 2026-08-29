/**
 * 앱 전체 디자인 토큰.
 * 색상은 라이트 테마 하나만 정의한다(다크 모드는 후속 작업).
 */

export const colors = {
  // 브랜드
  primary: '#2F6BFF',
  primaryDark: '#1F4FD8',
  primarySoft: '#EAF0FF',

  // 배경 / 표면
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F6',

  // 텍스트
  text: '#14161A',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  textInverse: '#FFFFFF',

  // 경계
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // 상태
  success: '#12A150',
  successSoft: '#E7F7EE',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#0891B2',
  infoSoft: '#E0F2FE',

  disabled: '#C7CBD1',
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
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
