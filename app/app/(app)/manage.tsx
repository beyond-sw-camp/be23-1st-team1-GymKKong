import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { api, errorMessage } from '../../src/api/client';
import {
  useAdminPendingTrainers,
  useAdminRefunds,
  useDecideRefund,
  usePlacePlans,
  usePlaceRooms,
  usePlaces,
} from '../../src/api/hooks';
import { PlaceFormSheet, PlanFormSheet, RoomFormSheet } from '../../src/components/AdminForms';
import { useConfirm } from '../../src/components/ConfirmProvider';
import { Badge, Button, EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { formatDateTime, formatWon } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing } from '../../src/theme';

type Tab = 'REFUNDS' | 'TRAINERS' | 'FACILITY';

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
  const { confirm, notice } = useConfirm();

  // 시설·상품 탭
  const rooms = usePlaceRooms(placeId ?? 0, tab === 'FACILITY' && placeId != null);
  const plans = usePlacePlans(placeId ?? 0);
  const [placeForm, setPlaceForm] = useState(false);
  const [roomForm, setRoomForm] = useState(false);
  const [planForm, setPlanForm] = useState(false);

  const confirmDecision = async (refundId: number, approve: boolean, label: string) => {
    const ok = await confirm({
      title: approve ? '환불을 승인할까요?' : '환불을 거절할까요?',
      message: approve
        ? `${label}\n\n승인하면 이용권이 즉시 소멸하고 결제가 취소 처리됩니다.`
        : `${label}\n\n거절하면 이용권은 그대로 유지됩니다.`,
      confirmText: approve ? '승인' : '거절',
      destructive: !approve,
    });
    if (!ok) return;
    decide.mutate(
      { refundId, approve },
      { onError: (e) => void notice({ title: '처리 실패', message: errorMessage(e) }) },
    );
  };

  const decideTrainer = async (placeTrainerId: number, approve: boolean, name: string) => {
    const ok = await confirm({
      title: approve ? '소속을 승인할까요?' : '소속을 거절할까요?',
      message: approve
        ? `${name}\n\n승인하면 이 지점에서 강습을 개설할 수 있습니다.`
        : `${name}\n\n거절하면 다시 신청해야 합니다.`,
      confirmText: approve ? '승인' : '거절',
      destructive: !approve,
    });
    if (!ok) return;
    try {
      await api.post(`/api/admin/place-trainers/${placeTrainerId}/decision?approve=${approve}`);
      await pending.refetch();
    } catch (e) {
      await notice({ title: '처리 실패', message: errorMessage(e) });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(
          [
            ['REFUNDS', '환불 요청'],
            ['TRAINERS', '트레이너 승인'],
            ['FACILITY', '시설 · 상품'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.tabActive]}
            testID={`tab-${key}`}
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
                    onPress={() => decideTrainer(item.placeTrainerId, true, item.name)}
                  />
                  <Button
                    title="거절"
                    variant="secondary"
                    small
                    style={{ flex: 1 }}
                    onPress={() => decideTrainer(item.placeTrainerId, false, item.name)}
                  />
                </View>
              </View>
            )}
          />
        </View>
      )}

      {tab === 'FACILITY' && placeId != null && (
        <ScrollView contentContainerStyle={styles.list}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chipStrip, { paddingHorizontal: 0, paddingTop: 0 }]}
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

          <View style={[styles.card, { marginTop: spacing.lg }]}>
            <Text style={styles.cardTitle}>강습실</Text>
            {(rooms.data ?? []).length === 0 ? (
              <Text style={styles.meta}>등록된 강습실이 없습니다.</Text>
            ) : (
              (rooms.data ?? []).map((r) => (
                <Text key={r.id} style={styles.meta}>
                  {r.roomNum} {r.name ?? ''} · 수용 {r.capacity}명
                </Text>
              ))
            )}
            <View style={styles.rowActions}>
              <Button title="강습실 등록" small onPress={() => setRoomForm(true)} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>이용권 상품</Text>
            {(plans.data ?? []).length === 0 ? (
              <Text style={styles.meta}>등록된 상품이 없습니다.</Text>
            ) : (
              (plans.data ?? []).map((p) => (
                <Text key={p.id} style={styles.meta}>
                  {p.name} · {p.totalCount}회 · {formatWon(p.price)} · {p.validDays}일
                </Text>
              ))
            )}
            <View style={styles.rowActions}>
              <Button title="상품 등록" small onPress={() => setPlanForm(true)} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>지점</Text>
            <Text style={styles.meta}>
              신규 지점 등록은 최고 관리자만 가능합니다. 등록 즉시 앱 홈에 노출됩니다.
            </Text>
            <View style={styles.rowActions}>
              <Button title="지점 등록" small onPress={() => setPlaceForm(true)} />
            </View>
          </View>
        </ScrollView>
      )}

      <PlaceFormSheet
        visible={placeForm}
        onClose={() => setPlaceForm(false)}
        onCreated={() => {
          setPlaceForm(false);
          void placesQuery.refetch();
        }}
      />
      <RoomFormSheet
        placeId={placeId ?? 0}
        visible={roomForm}
        onClose={() => setRoomForm(false)}
        onCreated={() => {
          setRoomForm(false);
          void rooms.refetch();
        }}
      />
      <PlanFormSheet
        placeId={placeId ?? 0}
        visible={planForm}
        onClose={() => setPlanForm(false)}
        onCreated={() => {
          setPlanForm(false);
          void plans.refetch();
        }}
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

  chipStrip: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
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
