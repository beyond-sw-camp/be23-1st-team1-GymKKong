import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Session } from '../api/types';
import { formatTimeRange } from '../lib/format';
import { colors, fontSize, radius, shadow, spacing, statusLabel } from '../theme';
import { Badge } from './ui';

interface Props {
  session: Session;
  onPress?: () => void;
  /** 트레이너 화면에서는 예약 인원을 강조하고 '내 예약' 배지를 숨긴다. */
  variant?: 'member' | 'trainer';
}

export function SessionCard({ session, onPress, variant = 'member' }: Props) {
  const full = session.remainSeat <= 0;
  const canceled = session.status === 'CANCELED';
  const past = session.status === 'COMPLETED';
  const dimmed = canceled || past;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, dimmed && styles.dimmed, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.timeCol}>
        <Text style={[styles.time, dimmed && styles.mutedText]}>
          {formatTimeRange(session.startAt, session.endAt).split(' – ')[0]}
        </Text>
        <Text style={styles.duration}>
          {Math.round(
            (new Date(session.endAt).getTime() - new Date(session.startAt).getTime()) / 60000,
          )}
          분
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, dimmed && styles.mutedText]} numberOfLines={1}>
            {session.programName}
          </Text>
          {variant === 'member' && session.reservedByMe && !canceled && (
            <Badge value="RESERVED" label="예약함" />
          )}
          {canceled && <Badge value="CANCELED" />}
          {past && !canceled && <Badge value="COMPLETED" />}
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {session.trainerName} · {session.roomNum}번 룸 · {statusLabel[session.classType]}
        </Text>

        <View style={styles.footerRow}>
          <Text
            style={[
              styles.seats,
              full && !dimmed && { color: colors.danger },
              dimmed && styles.mutedText,
            ]}
          >
            {full ? '정원 마감' : `잔여 ${session.remainSeat}자리`}
          </Text>
          <Text style={styles.seatsTotal}>
            {session.reservedCount}/{session.capacity}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  dimmed: { backgroundColor: colors.surfaceAlt },
  timeCol: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: spacing.md,
    marginRight: spacing.md,
  },
  time: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  duration: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: 2 },
  body: { flex: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  seats: { fontSize: fontSize.sm, fontWeight: '600', color: colors.success },
  seatsTotal: { fontSize: fontSize.xs, color: colors.textFaint },
  mutedText: { color: colors.textFaint },
});
