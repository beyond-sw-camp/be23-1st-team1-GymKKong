import React from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import { useMyMemberships, useRequestRefund } from '../../src/api/hooks';
import type { Membership } from '../../src/api/types';
import { Badge, Button, EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { daysUntil, formatWon } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing, statusLabel } from '../../src/theme';

export default function MembershipsScreen() {
  const query = useMyMemberships();
  const refund = useRequestRefund();

  const confirmRefund = (m: Membership) => {
    const amount = m.expectedRefundAmount != null ? formatWon(m.expectedRefundAmount) : '금액 계산 중';
    Alert.alert(
      '환불을 요청할까요?',
      `${m.planName}\n잔여 ${m.remainCount}/${m.totalCount}회\n예상 환불액: ${amount}\n\n관리자 승인 후 처리됩니다.`,
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '환불 요청',
          style: 'destructive',
          onPress: () =>
            refund.mutate(
              { membershipId: m.id },
              {
                onSuccess: () => Alert.alert('접수 완료', '환불 요청이 접수되었습니다.'),
                onError: (e) => Alert.alert('요청 실패', errorMessage(e)),
              },
            ),
        },
      ],
    );
  };

  const items = query.data ?? [];

  return (
    <FlatList
      style={styles.container}
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
            title="보유한 이용권이 없어요"
            description="지점 상세 화면에서 이용권을 구매할 수 있습니다."
          />
        )
      }
      renderItem={({ item }) => {
        const remainDays = daysUntil(item.expireDate);
        const usedRatio = item.totalCount > 0 ? 1 - item.remainCount / item.totalCount : 0;
        const active = item.status === 'ACTIVE';

        return (
          <View style={[styles.card, !active && styles.cardInactive]}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{item.planName}</Text>
                <Text style={styles.place}>
                  {item.placeName} · {statusLabel[item.classType]} 이용 가능
                </Text>
              </View>
              <Badge value={item.status} />
            </View>

            <View style={styles.countRow}>
              <Text style={styles.remain}>{item.remainCount}</Text>
              <Text style={styles.total}>/ {item.totalCount}회</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(usedRatio * 100, 100)}%` },
                  !active && { backgroundColor: colors.disabled },
                ]}
              />
            </View>

            <Text style={styles.expire}>
              {item.expireDate} 만료
              {active && remainDays >= 0 ? ` · ${remainDays}일 남음` : ''}
            </Text>

            {active && remainDays >= 0 && remainDays <= 14 && (
              <Text style={styles.warning}>만료가 얼마 남지 않았습니다.</Text>
            )}

            {item.refundable && (
              <View style={styles.actions}>
                <Button
                  title="환불 요청"
                  variant="secondary"
                  small
                  loading={refund.isPending && refund.variables?.membershipId === item.id}
                  onPress={() => confirmRefund(item)}
                />
                {item.expectedRefundAmount != null && (
                  <Text style={styles.refundHint}>
                    예상 {formatWon(item.expectedRefundAmount)}
                  </Text>
                )}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardInactive: { backgroundColor: colors.surfaceAlt },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  planName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  place: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },

  countRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.lg },
  remain: { fontSize: 34, fontWeight: '800', color: colors.primary },
  total: { fontSize: fontSize.md, color: colors.textMuted, marginLeft: spacing.xs },

  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary },

  expire: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
  warning: { fontSize: fontSize.sm, color: colors.warning, marginTop: spacing.xs, fontWeight: '600' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  refundHint: { fontSize: fontSize.xs, color: colors.textFaint },
});
