import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorCode, errorMessage } from '../../src/api/client';
import {
  useCancelReservation,
  useMyMemberships,
  useMyReservations,
  useReserve,
  useSession,
} from '../../src/api/hooks';
import { Badge, Button, Card, Divider, ErrorState, InfoRow, Loading } from '../../src/components/ui';
import { useAuth } from '../../src/lib/AuthProvider';
import { formatDate, formatTimeRange } from '../../src/lib/format';
import { colors, fontSize, radius, spacing, statusLabel } from '../../src/theme';

/**
 * 수업 상세 + 예약 실행 화면.
 *
 * 예약 가능 여부는 서버가 최종 판단하지만, 버튼을 누르기 전에 미리 걸러줄 수 있는
 * 조건(정원 마감, 이미 시작, 사용 가능한 이용권 없음)은 여기서 안내한다.
 */
export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const router = useRouter();
  const { user } = useAuth();

  const sessionQuery = useSession(sessionId);
  const membershipsQuery = useMyMemberships();
  const reservationsQuery = useMyReservations(['RESERVED']);

  const reserve = useReserve();
  const cancel = useCancelReservation();

  const session = sessionQuery.data;

  /** 이 수업에 쓸 수 있는 이용권. 지점과 수업 종류가 모두 맞아야 한다. */
  const usableMembership = useMemo(() => {
    if (!session) return null;
    return (
      (membershipsQuery.data ?? []).find(
        (m) =>
          m.status === 'ACTIVE' &&
          m.remainCount > 0 &&
          m.placeId === session.placeId &&
          (m.classType === 'ALL' || m.classType === session.classType),
      ) ?? null
    );
  }, [membershipsQuery.data, session]);

  /** 취소하려면 예약 ID가 필요하다. */
  const myReservation = useMemo(
    () => (reservationsQuery.data?.content ?? []).find((r) => r.sessionId === sessionId) ?? null,
    [reservationsQuery.data, sessionId],
  );

  if (sessionQuery.isLoading) return <Loading />;
  if (sessionQuery.isError || !session) {
    return (
      <ErrorState
        message={errorMessage(sessionQuery.error, '수업을 찾을 수 없습니다.')}
        onRetry={() => sessionQuery.refetch()}
      />
    );
  }

  const isMember = user?.role === 'MEMBER';
  const started = new Date(session.startAt).getTime() <= Date.now();
  const canceled = session.status === 'CANCELED';
  const full = session.remainSeat <= 0;

  const onReserve = () => {
    reserve.mutate(
      { sessionId, membershipId: usableMembership?.id },
      {
        onSuccess: () =>
          Alert.alert(
            '예약 완료',
            `${formatDate(session.startAt)} ${formatTimeRange(session.startAt, session.endAt)}\n${session.programName}`,
          ),
        onError: (e) => {
          // 서버 코드별로 다음 행동을 안내한다.
          const code = errorCode(e);
          if (code === 'NO_USABLE_MEMBERSHIP') {
            Alert.alert('이용권이 필요해요', errorMessage(e), [
              { text: '닫기', style: 'cancel' },
              { text: '이용권 보러가기', onPress: () => router.push(`/place/${session.placeId}`) },
            ]);
            return;
          }
          Alert.alert('예약 실패', errorMessage(e));
        },
      },
    );
  };

  const onCancel = () => {
    if (!myReservation) return;
    Alert.alert('예약을 취소할까요?', '취소하면 이용권 1회가 복원됩니다.', [
      { text: '닫기', style: 'cancel' },
      {
        text: '예약 취소',
        style: 'destructive',
        onPress: () =>
          cancel.mutate(myReservation.id, {
            onError: (e) => Alert.alert('취소 실패', errorMessage(e)),
          }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{session.programName}</Text>
            <Badge value={session.status} />
          </View>
          <Text style={styles.subtitle}>
            {statusLabel[session.classType]} · {statusLabel[session.level]}
          </Text>

          <Divider />

          <InfoRow label="날짜" value={formatDate(session.startAt)} />
          <InfoRow label="시간" value={formatTimeRange(session.startAt, session.endAt)} />
          <InfoRow label="트레이너" value={session.trainerName} />
          <InfoRow label="지점" value={session.placeName} />
          <InfoRow label="강습실" value={`${session.roomNum}번 룸`} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>예약 현황</Text>
          <View style={styles.seatRow}>
            <Text style={styles.seatBig}>{session.reservedCount}</Text>
            <Text style={styles.seatTotal}>/ {session.capacity}명</Text>
            <View style={{ flex: 1 }} />
            <Text style={[styles.seatRemain, full && { color: colors.danger }]}>
              {full ? '정원 마감' : `${session.remainSeat}자리 남음`}
            </Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.min((session.reservedCount / session.capacity) * 100, 100)}%` },
                full && { backgroundColor: colors.danger },
              ]}
            />
          </View>
        </Card>

        {isMember && (
          <Card>
            <Text style={styles.sectionTitle}>사용할 이용권</Text>
            {usableMembership ? (
              <>
                <Text style={styles.membershipName}>{usableMembership.planName}</Text>
                <Text style={styles.membershipMeta}>
                  잔여 {usableMembership.remainCount}/{usableMembership.totalCount}회 ·{' '}
                  {usableMembership.expireDate} 만료
                </Text>
              </>
            ) : (
              <Text style={styles.noMembership}>
                이 수업에 사용할 수 있는 이용권이 없습니다.
                {'\n'}
                {session.placeName}의 {statusLabel[session.classType]} 이용권이 필요합니다.
              </Text>
            )}
          </Card>
        )}
      </ScrollView>

      {isMember && (
        <View style={styles.footer}>
          {canceled ? (
            <Text style={styles.footerNote}>취소된 수업입니다.</Text>
          ) : session.reservedByMe ? (
            myReservation?.cancelable ? (
              <Button
                title="예약 취소"
                variant="secondary"
                loading={cancel.isPending}
                onPress={onCancel}
              />
            ) : (
              <Text style={styles.footerNote}>
                예약됨 · 수업 시작 2시간 전이 지나 취소할 수 없습니다
              </Text>
            )
          ) : started ? (
            <Text style={styles.footerNote}>이미 시작한 수업입니다.</Text>
          ) : (
            <Button
              title={full ? '정원이 마감되었습니다' : '예약하기'}
              disabled={full || !usableMembership}
              loading={reserve.isPending}
              onPress={onReserve}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { flex: 1, fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  seatRow: { flexDirection: 'row', alignItems: 'baseline' },
  seatBig: { fontSize: 30, fontWeight: '800', color: colors.primary },
  seatTotal: { fontSize: fontSize.md, color: colors.textMuted, marginLeft: spacing.xs },
  seatRemain: { fontSize: fontSize.sm, fontWeight: '700', color: colors.success },
  track: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.primary },

  membershipName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  membershipMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  noMembership: { fontSize: fontSize.sm, color: colors.warning, lineHeight: 20 },

  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerNote: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingVertical: spacing.md,
  },
});
