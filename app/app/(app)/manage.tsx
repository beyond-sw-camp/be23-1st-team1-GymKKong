import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api, errorMessage } from '../../src/api/client';
import {
  useAdminPendingTrainers,
  useAdminRefunds,
  useDecideRefund,
  usePlaces,
} from '../../src/api/hooks';
import { Badge, Button, EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { formatDateTime, formatWon } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing } from '../../src/theme';

type Tab = 'REFUNDS' | 'TRAINERS';

/** 관리자 운영 화면. 환불 승인과 트레이너 소속 승인. */
export default function ManageScreen() {
  const [tab, setTab] = useState<Tab>('REFUNDS');
  const [placeId, setPlaceId] = useState<number | null>(null);

  const placesQuery = usePlaces();
  const places = placesQuery.data?.content ?? [];

  useEffect(() => {
    if (placeId === null && places.length > 0) setPlaceId(places[0].id);
  }, [places, placeId]);

  const refunds = useAdminRefunds();
  const decide = useDecideRefund();
  const pending = useAdminPendingTrainers(placeId ?? 0);

  const confirmDecision = (refundId: number, approve: boolean, label: string) => {
    Alert.alert(
      approve ? '환불을 승인할까요?' : '환불을 거절할까요?',
      approve
        ? `${label}\n\n승인하면 이용권이 즉시 소멸하고 결제가 취소 처리됩니다.`
        : `${label}\n\n거절하면 이용권은 그대로 유지됩니다.`,
      [
        { text: '닫기', style: 'cancel' },
        {
          text: approve ? '승인' : '거절',
          style: approve ? 'default' : 'destructive',
          onPress: () =>
            decide.mutate(
              { refundId, approve },
              { onError: (e) => Alert.alert('처리 실패', errorMessage(e)) },
            ),
        },
      ],
    );
  };

  const decideTrainer = async (placeTrainerId: number, approve: boolean) => {
    try {
      await api.post(`/api/admin/place-trainers/${placeTrainerId}/decision?approve=${approve}`);
      await pending.refetch();
    } catch (e) {
      Alert.alert('처리 실패', errorMessage(e));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(
          [
            ['REFUNDS', '환불 요청'],
            ['TRAINERS', '트레이너 승인'],
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

      {tab === 'REFUNDS' && (
        <FlatList
          data={refunds.data?.content ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refunds.isFetching} onRefresh={() => refunds.refetch()} />
          }
          ListEmptyComponent={
            refunds.isLoading ? (
              <Loading />
            ) : refunds.isError ? (
              <ErrorState message={errorMessage(refunds.error)} onRetry={() => refunds.refetch()} />
            ) : (
              <EmptyState title="대기 중인 환불 요청이 없어요" />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.memberName}</Text>
                <Badge value={item.status} />
              </View>
              <Text style={styles.meta}>{item.planName}</Text>
              <Text style={styles.amount}>{formatWon(item.amount)}</Text>
              {!!item.reason && <Text style={styles.reason}>사유: {item.reason}</Text>}
              <Text style={styles.timestamp}>{formatDateTime(item.requestedAt)} 요청</Text>

              <View style={styles.rowActions}>
                <Button
                  title="승인"
                  small
                  style={{ flex: 1 }}
                  loading={decide.isPending && decide.variables?.refundId === item.id}
                  onPress={() =>
                    confirmDecision(item.id, true, `${item.memberName} · ${formatWon(item.amount)}`)
                  }
                />
                <Button
                  title="거절"
                  variant="secondary"
                  small
                  style={{ flex: 1 }}
                  onPress={() =>
                    confirmDecision(item.id, false, `${item.memberName} · ${formatWon(item.amount)}`)
                  }
                />
              </View>
            </View>
          )}
        />
      )}

      {tab === 'TRAINERS' && (
        <View style={{ flex: 1 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipStrip}
          >
            {places.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setPlaceId(p.id)}
                style={[styles.chip, placeId === p.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, placeId === p.id && styles.chipTextActive]}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <FlatList
            data={pending.data ?? []}
            keyExtractor={(item) => String(item.placeTrainerId)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={pending.isFetching} onRefresh={() => pending.refetch()} />
            }
            ListEmptyComponent={
              pending.isLoading ? (
                <Loading />
              ) : pending.isError ? (
                <ErrorState
                  message={errorMessage(pending.error)}
                  onRetry={() => pending.refetch()}
                />
              ) : (
                <EmptyState title="승인 대기 중인 트레이너가 없어요" />
              )
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Badge value="PENDING" />
                </View>
                <Text style={styles.meta}>{item.email}</Text>
                {!!item.specialty && (
                  <Text style={styles.meta}>
                    {item.specialty}
                    {item.careerYears != null ? ` · 경력 ${item.careerYears}년` : ''}
                  </Text>
                )}
                <Text style={styles.timestamp}>{formatDateTime(item.requestedAt)} 신청</Text>
                <View style={styles.rowActions}>
                  <Button
                    title="승인"
                    small
                    style={{ flex: 1 }}
                    onPress={() => decideTrainer(item.placeTrainerId, true)}
                  />
                  <Button
                    title="거절"
                    variant="secondary"
                    small
                    style={{ flex: 1 }}
                    onPress={() => decideTrainer(item.placeTrainerId, false)}
                  />
                </View>
              </View>
            )}
          />
        </View>
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

  chipStrip: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.textInverse },

  list: { padding: spacing.lg, flexGrow: 1 },
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
  amount: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  reason: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  timestamp: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: spacing.xs },
  rowActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});
