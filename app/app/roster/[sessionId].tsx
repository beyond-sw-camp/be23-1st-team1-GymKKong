import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import { useCheckAttendance, useRoster, useSession } from '../../src/api/hooks';
import type { ReservationStatus } from '../../src/api/types';
import { Button, EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { formatDate, formatTimeRange } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing } from '../../src/theme';

/** 출석 화면에서 고를 수 있는 세 가지 상태. */
const CHOICES: { value: ReservationStatus; label: string; color: string }[] = [
  { value: 'ATTENDED', label: '출석', color: colors.success },
  { value: 'NOSHOW', label: '노쇼', color: colors.warning },
  { value: 'RESERVED', label: '미체크', color: colors.textMuted },
];

/**
 * 트레이너 출석 관리.
 * 로컬에서 상태를 모아두었다가 '저장'에서 한 번에 전송한다.
 * 이용권은 예약 시점에 이미 차감되었으므로 여기서는 상태만 바뀐다.
 */
export default function RosterScreen() {
  const { sessionId: sessionIdParam } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Number(sessionIdParam);

  const sessionQuery = useSession(sessionId);
  const rosterQuery = useRoster(sessionId);
  const check = useCheckAttendance(sessionId);

  const [draft, setDraft] = useState<Record<number, ReservationStatus>>({});

  // 서버 값이 오면 로컬 상태를 초기화한다.
  useEffect(() => {
    if (!rosterQuery.data) return;
    const next: Record<number, ReservationStatus> = {};
    for (const row of rosterQuery.data) next[row.reservationId] = row.status;
    setDraft(next);
  }, [rosterQuery.data]);

  const changed = useMemo(() => {
    if (!rosterQuery.data) return [];
    return rosterQuery.data
      .filter((row) => draft[row.reservationId] && draft[row.reservationId] !== row.status)
      .map((row) => ({ reservationId: row.reservationId, status: draft[row.reservationId] }));
  }, [draft, rosterQuery.data]);

  const save = () => {
    if (changed.length === 0) return;
    check.mutate(changed, {
      onSuccess: () => Alert.alert('저장 완료', `${changed.length}명의 출석 상태를 반영했습니다.`),
      onError: (e) => Alert.alert('저장 실패', errorMessage(e)),
    });
  };

  if (rosterQuery.isLoading || sessionQuery.isLoading) return <Loading />;
  if (rosterQuery.isError) {
    return (
      <ErrorState message={errorMessage(rosterQuery.error)} onRetry={() => rosterQuery.refetch()} />
    );
  }

  const session = sessionQuery.data;
  const rows = rosterQuery.data ?? [];

  const attendedCount = rows.filter((r) => draft[r.reservationId] === 'ATTENDED').length;

  return (
    <View style={styles.container}>
      {!!session && (
        <View style={styles.header}>
          <Text style={styles.title}>{session.programName}</Text>
          <Text style={styles.meta}>
            {formatDate(session.startAt)} {formatTimeRange(session.startAt, session.endAt)} ·{' '}
            {session.roomNum}번 룸
          </Text>
          <Text style={styles.count}>
            출석 {attendedCount} / 예약 {rows.length}명
          </Text>
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.reservationId)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState title="예약자가 없어요" description="아직 이 수업을 예약한 회원이 없습니다." />
        }
        renderItem={({ item }) => {
          const current = draft[item.reservationId] ?? item.status;
          return (
            <View style={styles.card}>
              <View style={styles.memberRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.memberName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{item.memberName}</Text>
                  {!!item.memberPhone && <Text style={styles.phone}>{item.memberPhone}</Text>}
                </View>
              </View>

              <View style={styles.choices}>
                {CHOICES.map((c) => {
                  const active = current === c.value;
                  return (
                    <Pressable
                      key={c.value}
                      onPress={() =>
                        setDraft((prev) => ({ ...prev, [item.reservationId]: c.value }))
                      }
                      style={[
                        styles.choice,
                        active && { backgroundColor: c.color, borderColor: c.color },
                      ]}
                    >
                      <Text style={[styles.choiceText, active && { color: colors.textInverse }]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <Button
          title={changed.length > 0 ? `${changed.length}명 저장` : '변경 사항 없음'}
          disabled={changed.length === 0}
          loading={check.isPending}
          onPress={save}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  count: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '700', marginTop: spacing.sm },

  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  memberName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  phone: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },

  choices: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  choice: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  choiceText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },

  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
