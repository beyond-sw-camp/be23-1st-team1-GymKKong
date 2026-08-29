import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { errorMessage } from '../../src/api/client';
import { useCancelReservation, useMyReservations } from '../../src/api/hooks';
import type { Reservation, ReservationStatus } from '../../src/api/types';
import { useConfirm } from '../../src/components/ConfirmProvider';
import { Badge, Button, EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { formatDate, formatTimeRange } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing } from '../../src/theme';

type Filter = 'UPCOMING' | 'PAST';

const FILTERS: { key: Filter; label: string; statuses: ReservationStatus[] }[] = [
  { key: 'UPCOMING', label: '예정', statuses: ['RESERVED'] },
  { key: 'PAST', label: '지난 내역', statuses: ['ATTENDED', 'NOSHOW', 'CANCELED'] },
];

export default function ReservationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('UPCOMING');
  const statuses = useMemo(
    () => FILTERS.find((f) => f.key === filter)!.statuses,
    [filter],
  );

  const query = useMyReservations(statuses);
  const cancel = useCancelReservation();
  const { confirm, notice } = useConfirm();

  const confirmCancel = async (r: Reservation) => {
    const ok = await confirm({
      title: '예약을 취소할까요?',
      message: `${formatDate(r.startAt)} ${formatTimeRange(r.startAt, r.endAt)}\n${r.programName}\n\n취소하면 이용권 1회가 복원됩니다.`,
      confirmText: '예약 취소',
      destructive: true,
    });
    if (!ok) return;
    cancel.mutate(r.id, {
      onError: (e) => void notice({ title: '취소 실패', message: errorMessage(e) }),
    });
  };

  const items = query.data?.content ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            accessibilityRole="button"
            onPress={() => setFilter(f.key)}
            style={[styles.tab, filter === f.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === f.key && styles.tabTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />
        }
        ListEmptyComponent={
          query.isLoading ? (
            <Loading />
          ) : query.isError ? (
            <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState
              title={filter === 'UPCOMING' ? '예정된 수업이 없어요' : '지난 내역이 없어요'}
              description={filter === 'UPCOMING' ? '홈에서 수업을 예약해보세요.' : undefined}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/session/${item.sessionId}`)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{formatDate(item.startAt)}</Text>
              <Badge value={item.status} />
            </View>

            <Text style={styles.program}>{item.programName}</Text>
            <Text style={styles.meta}>
              {formatTimeRange(item.startAt, item.endAt)} · {item.trainerName}
            </Text>
            <Text style={styles.meta}>
              {item.placeName} · {item.roomNum}번 룸
            </Text>

            {item.status === 'RESERVED' && (
              <View style={styles.actions}>
                {item.cancelable ? (
                  <Button
                    title="예약 취소"
                    variant="secondary"
                    small
                    loading={cancel.isPending && cancel.variables === item.id}
                    onPress={() => confirmCancel(item)}
                  />
                ) : (
                  <Text style={styles.deadlineNote}>
                    수업 시작 2시간 전이 지나 취소할 수 없습니다
                  </Text>
                )}
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    margin: spacing.lg,
    marginBottom: 0,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  date: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  program: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3 },
  actions: { marginTop: spacing.md, alignItems: 'flex-start' },
  deadlineNote: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: spacing.xs },
});
