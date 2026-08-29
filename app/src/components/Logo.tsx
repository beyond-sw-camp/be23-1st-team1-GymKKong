import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '../theme';

/**
 * 브랜드 마크.
 *
 * 원본 일러스트(3D 폴더 위에 덤벨이 얹힌 그림)를 앱 아이콘 크기에서도 읽히도록
 * 평면 기하로 정리했다. 남긴 것은 세 가지다.
 *   1) 폴더 실루엣 — 기록·관리
 *   2) 덤벨 글리프 — 운동
 *   3) 인디고→바이올렛 그라데이션과 로즈 손잡이 — 원본의 색 대비
 *
 * 원본처럼 덤벨을 폴더 "위에" 얹으면 26px 헤더 크기에서 검은 점 두 개로 뭉개진다.
 * 그래서 폴더 면 안에 흰 글리프로 넣고, 손잡이만 로즈로 남겼다.
 *
 * 회전은 SVG 표준 transform 문자열로 준다. react-native-svg의 rotation/origin
 * 프로퍼티는 웹에서 transform-origin을 그대로 DOM에 흘려 경고를 낸다.
 */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="gkBody" x1="6" y1="14" x2="56" y2="58">
          <Stop offset="0" stopColor="#5B6BD0" />
          <Stop offset="0.55" stopColor={colors.indigo} />
          <Stop offset="1" stopColor={colors.violet} />
        </LinearGradient>
      </Defs>

      {/* 폴더 — 왼쪽 위 탭이 달린 실루엣 */}
      <Path
        d="M4 17a7 7 0 0 1 7-7h12.7a4 4 0 0 1 2.83 1.17l3.66 3.66A4 4 0 0 0 33.02 16H53a7 7 0 0 1 7 7v24a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V17Z"
        fill="url(#gkBody)"
      />

      {/* 덤벨 — 폴더 면에 얹힌 흰 글리프. 살짝 기울여 원본의 인상을 남긴다. */}
      <G transform="rotate(-14 32 37)">
        {/* 손잡이 (로즈) */}
        <Rect x="26.5" y="35.2" width="11" height="3.6" rx="1.8" fill="#F0C3D0" />
        {/* 안쪽 원판 */}
        <Rect x="21.6" y="28.6" width="6.2" height="16.8" rx="2.6" fill="#FFFFFF" />
        <Rect x="36.2" y="28.6" width="6.2" height="16.8" rx="2.6" fill="#FFFFFF" />
        {/* 바깥 원판 */}
        <Rect x="16.9" y="31.9" width="4.4" height="10.2" rx="2" fill="#FFFFFF" opacity={0.85} />
        <Rect x="42.7" y="31.9" width="4.4" height="10.2" rx="2" fill="#FFFFFF" opacity={0.85} />
      </G>
    </Svg>
  );
}

/**
 * 마크 + 워드마크.
 * `stacked`는 로그인 화면처럼 넓게 쓸 때, 기본값은 헤더용 가로 배치.
 */
export function Logo({
  size = 44,
  stacked = false,
  showTagline = false,
  style,
}: {
  size?: number;
  stacked?: boolean;
  showTagline?: boolean;
  style?: ViewStyle;
}) {
  const wordSize = size * (stacked ? 0.52 : 0.6);

  return (
    <View style={[stacked ? styles.stacked : styles.row, style]}>
      <LogoMark size={size} />
      <View style={stacked ? styles.wordStacked : styles.word}>
        <Text style={[styles.korean, { fontSize: wordSize }]}>짐꽁</Text>
        <Text style={[styles.latin, { fontSize: Math.max(wordSize * 0.3, 9) }]}>GYMKKONG</Text>
      </View>
      {showTagline && <Text style={styles.tagline}>수업 예약부터 출석까지 한 번에</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  stacked: { alignItems: 'center', gap: 14 },
  word: { justifyContent: 'center' },
  wordStacked: { alignItems: 'center' },
  korean: {
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  latin: {
    fontWeight: '700',
    color: colors.indigo,
    letterSpacing: 3,
    marginTop: 3,
    opacity: 0.7,
  },
  tagline: {
    marginTop: 2,
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
