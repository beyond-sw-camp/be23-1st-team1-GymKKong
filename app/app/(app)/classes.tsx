import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import {
  useCancelSession,
  useTrainerPlaces,
  useTrainerPrograms,
  useTrainerSessions,
} from '../../src/api/hooks';
import { SessionCard } from '../../src/components/SessionCard';
import { Badge, Button, EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { formatDate, toDateParam } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing, statusLabel } from '../../src/theme';

type Tab = 'SESSIONS' | 'PROGRAMS' | 'PLACES';

/** 트레이너 전용 화면. 내 회차 / 강습 목록 / 소속 지점. */
export default function TrainerClassesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('SESSIONS');

  const today = toDateParam(new Date());
  const sessions = useTrainerSessions(today, 14, tab === 'SESSIONS');
  const programs = useTrainerPrograms(tab === 'PROGRAMS');
  const places = useTrainerPlaces(tab === 'PLACES');

  const cancelSession = useCancelSession();

  const confirmCancelSession = (sessionId: number, name: string) => {
    Alert.alert(
      '수업을 취소할까요?',
      `${name}\n\n예약한 회원 전원에게 알림이 가고, 이용권이 모두 복원됩니다.`,
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '수업 취소',
          style: 'destructive',
          onPress: () =>
            cancelSession.mutate(
              { sessionId },
              {
                onSuccess: (data) =>
                  Alert.alert(
                    '취소 완료',
                    `${data.canceledReservations}건의 예약이 취소되고 이용권이 복원되었습니다.`,
                  ),
                onError: (e) => Alert.alert('취소 실패', errorMessage(e)),
              },
            ),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(
          [
            ['SESSIONS', '수업 일정'],
            ['PROGRAMS', '내 강습'],
            ['PLACES', '소속 지점'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'SESSIONS' && (
        <FlatList
          data={sessions.data ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={sessions.isFetching} onRefresh={() => sessions.refetch()} />
          }
          ListEmptyComponent={
            sessions.isLoading ? (
              <Loading />
            ) : sessions.isError ? (
              <ErrorState message={errorMessage(sessions.error)} onRetry={() => sessions.refetch()} />
            ) : (
              <EmptyState
                title="예정된 수업이 없어요"
                description="내 강습 탭에서 강습을 만들고 회차를 개설하세요."
              />
            )
          }
          renderItem={({ item }) => (
            <View>
              <Text style={styles.dateHeader}>{formatDate(item.startAt)}</Text>
              <SessionCard
                session={item}
                variant="trainer"
                onPress={() => router.push(`/roster/${item.id}`)}
              />
              {item.status === 'SCHEDULED' && (
                <View style={styles.rowActions}>
                  <Button
                    title="출석 관리"
                    small
                    onPress={() => router.push(`/roster/${item.id}`)}
                  />
                  <Button
                    title="수업 취소"
                    variant="secondary"
                    small
                    onPress={() => confirmCancelSession(item.id, item.programName)}
                  />
                </View>
              )}
            </View>
          )}
        />
      )}

      {tab === 'PROGRAMS' && (
        <FlatList
          data={programs.data ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={programs.isFetching} onRefresh={() => programs.refetch()} />
          }
          ListEmptyComponent={
            programs.isLoading ? (
              <Loading />
            ) : (
              <EmptyState
                title="개설한 강습이 없어요"
                description="지점 소속이 승인되면 강습을 개설할 수 있습니다."
              />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Badge value={item.classType} />
              </View>
              <Text style={styles.meta}>
                {item.placeName} · {statusLabel[item.level]} · {item.durationMin}분 · 정원{' '}
                {item.defaultCapacity}명
              </Text>
              {!!item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          )}
        />
      )}

      {tab === 'PLACES' && (
        <FlatList
          data={places.data ?? []}
          keyExtractor={(item) => String(item.placeId)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={places.isFetching} onRefresh={() => places.refetch()} />
          }
          ListEmptyComponent={
            places.isLoading ? (
              <Loading />
            ) : (
              <EmptyState
                title="소속 지점이 없어요"
                description="지점 상세 화면에서 소속을 신청하면 관리자 승인 후 활동할 수 있습니다."
              />
            )
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push(`/place/${item.placeId}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.placeName}</Text>
                <Badge value={item.status} />
              </View>
              <Text style={styles.meta}>{item.address}</Text>
              {item.status === 'PENDING' && (
                <Text style={styles.pendingNote}>관리자 승인을 기다리는 중입니다.</Text>
              )}
            </Pressable>
          )}
        />
      )}
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
  dateHeader: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  description: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 20 },
  pendingNote: { fontSize: fontSize.xs, color: colors.warning, marginTop: spacing.sm, fontWeight: '600' },
});
