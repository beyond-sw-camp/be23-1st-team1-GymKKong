import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import {
  useJoinPlace,
  usePlace,
  usePlacePlans,
  usePlacePrograms,
  usePlaceTrainers,
  usePosts,
  usePurchase,
  useToggleFavorite,
} from '../../src/api/hooks';
import { Badge, Button, Card, Divider, ErrorState, InfoRow, Loading } from '../../src/components/ui';
import { useAuth } from '../../src/lib/AuthProvider';
import { formatWon, relativeTime } from '../../src/lib/format';
import { colors, fontSize, radius, spacing, statusLabel } from '../../src/theme';

type Tab = 'INFO' | 'PLANS' | 'BOARD';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = Number(id);
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('INFO');

  const placeQuery = usePlace(placeId);
  const trainers = usePlaceTrainers(placeId);
  const programs = usePlacePrograms(placeId);
  const plans = usePlacePlans(placeId);
  const posts = usePosts(placeId);

  const toggleFavorite = useToggleFavorite();
  const purchase = usePurchase();
  const joinPlace = useJoinPlace();

  const place = placeQuery.data;

  if (placeQuery.isLoading) return <Loading />;
  if (placeQuery.isError || !place) {
    return (
      <ErrorState
        message={errorMessage(placeQuery.error, '지점을 찾을 수 없습니다.')}
        onRetry={() => placeQuery.refetch()}
      />
    );
  }

  const isMember = user?.role === 'MEMBER';
  const isTrainer = user?.role === 'TRAINER';

  const confirmPurchase = (planId: number, name: string, price: number, count: number) => {
    Alert.alert(
      '이용권을 구매할까요?',
      `${name}\n${count}회 · ${formatWon(price)}\n\n결제 연동 전이라 즉시 발급됩니다.`,
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '구매',
          onPress: () =>
            purchase.mutate(
              { planId },
              {
                onSuccess: () => Alert.alert('구매 완료', '이용권 탭에서 확인할 수 있습니다.'),
                onError: (e) => Alert.alert('구매 실패', errorMessage(e)),
              },
            ),
        },
      ],
    );
  };

  const confirmJoin = () => {
    Alert.alert('소속을 신청할까요?', '관리자 승인 후 이 지점에서 강습을 개설할 수 있습니다.', [
      { text: '닫기', style: 'cancel' },
      {
        text: '신청',
        onPress: () =>
          joinPlace.mutate(placeId, {
            onSuccess: () => Alert.alert('신청 완료', '관리자 승인을 기다려주세요.'),
            onError: (e) => Alert.alert('신청 실패', errorMessage(e)),
          }),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{place.name}</Text>
            <Text style={styles.address}>
              {place.address}
              {place.addressDetail ? ` ${place.addressDetail}` : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => toggleFavorite.mutate(placeId)}
            hitSlop={10}
            accessibilityLabel={place.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <Text style={styles.star}>{place.favorite ? '★' : '☆'}</Text>
          </Pressable>
        </View>

        {!!place.description && <Text style={styles.description}>{place.description}</Text>}

        <Divider />

        <InfoRow label="전화" value={place.phoneNum ?? '미등록'} />
        <InfoRow
          label="운영 시간"
          value={
            place.openTime && place.closeTime
              ? `${place.openTime.slice(0, 5)} – ${place.closeTime.slice(0, 5)}`
              : '미등록'
          }
        />

        {isTrainer && (
          <Button
            title="이 지점에 소속 신청"
            variant="secondary"
            small
            style={{ marginTop: spacing.md }}
            loading={joinPlace.isPending}
            onPress={confirmJoin}
          />
        )}
      </Card>

      <View style={styles.tabs}>
        {(
          [
            ['INFO', '강습·트레이너'],
            ['PLANS', '이용권'],
            ['BOARD', '게시판'],
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

      {tab === 'INFO' && (
        <>
          <Text style={styles.sectionTitle}>강습 프로그램</Text>
          <Card>
            {(programs.data ?? []).length === 0 ? (
              <Text style={styles.empty}>등록된 강습이 없습니다.</Text>
            ) : (
              (programs.data ?? []).map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.rowItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{p.name}</Text>
                      <Text style={styles.itemMeta}>
                        {p.trainerName} · {p.durationMin}분 · 정원 {p.defaultCapacity}명
                      </Text>
                    </View>
                    <Badge value={p.classType} />
                  </View>
                </View>
              ))
            )}
          </Card>

          <Text style={styles.sectionTitle}>소속 트레이너</Text>
          <Card>
            {(trainers.data ?? []).length === 0 ? (
              <Text style={styles.empty}>소속 트레이너가 없습니다.</Text>
            ) : (
              (trainers.data ?? []).map((t, i) => (
                <View key={t.userId}>
                  {i > 0 && <Divider />}
                  <View style={styles.rowItem}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{t.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{t.name}</Text>
                      <Text style={styles.itemMeta}>
                        {t.specialty ?? '전문 분야 미등록'}
                        {t.careerYears != null ? ` · 경력 ${t.careerYears}년` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card>
        </>
      )}

      {tab === 'PLANS' && (
        <Card>
          {(plans.data ?? []).length === 0 ? (
            <Text style={styles.empty}>판매 중인 이용권이 없습니다.</Text>
          ) : (
            (plans.data ?? []).map((p, i) => (
              <View key={p.id}>
                {i > 0 && <Divider />}
                <View style={styles.planItem}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planTitleRow}>
                      <Text style={styles.itemTitle}>{p.name}</Text>
                      <Badge value={p.classType} />
                    </View>
                    <Text style={styles.itemMeta}>
                      {p.totalCount}회 · 유효기간 {p.validDays}일
                    </Text>
                    <Text style={styles.price}>{formatWon(p.price)}</Text>
                  </View>
                  {isMember && (
                    <Button
                      title="구매"
                      small
                      loading={purchase.isPending && purchase.variables?.planId === p.id}
                      onPress={() => confirmPurchase(p.id, p.name, p.price, p.totalCount)}
                    />
                  )}
                </View>
              </View>
            ))
          )}
        </Card>
      )}

      {tab === 'BOARD' && (
        <Card>
          {(posts.data?.content ?? []).length === 0 ? (
            <Text style={styles.empty}>게시글이 없습니다.</Text>
          ) : (
            (posts.data?.content ?? []).map((p, i) => (
              <View key={p.id}>
                {i > 0 && <Divider />}
                <Pressable onPress={() => router.push(`/post/${p.id}`)} style={styles.rowItem}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planTitleRow}>
                      {p.isPinned && <Text style={styles.pin}>📌</Text>}
                      <Badge value={p.postType} />
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {p.title}
                      </Text>
                    </View>
                    <Text style={styles.itemMeta}>
                      {p.authorName} · {relativeTime(p.createdAt)} · 댓글 {p.commentCount}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              </View>
            ))
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  address: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  star: { fontSize: 26, color: colors.warning },
  description: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.md, lineHeight: 20 },

  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  empty: { fontSize: fontSize.sm, color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.sm },

  rowItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  itemTitle: { flexShrink: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  itemMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: fontSize.xl, color: colors.textFaint },
  pin: { fontSize: fontSize.sm },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },

  planItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  price: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginTop: spacing.xs },
});
