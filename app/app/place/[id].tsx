import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { errorMessage } from '../../src/api/client';
import {
  useJoinPlace,
  usePlace,
  usePlacePlans,
  usePlacePrograms,
  usePlaceTrainers,
  useCreatePost,
  usePosts,
  usePurchase,
  useToggleFavorite,
} from '../../src/api/hooks';
import type { PostType } from '../../src/api/types';
import { useConfirm } from '../../src/components/ConfirmProvider';
import { Icon } from '../../src/components/Icon';
import { ChoiceGroup, FormSheet } from '../../src/components/FormSheet';
import { Badge, Button, Card, Divider, ErrorState, Field, InfoRow, Loading } from '../../src/components/ui';
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
  const [postForm, setPostForm] = useState(false);

  const placeQuery = usePlace(placeId);
  const trainers = usePlaceTrainers(placeId);
  const programs = usePlacePrograms(placeId);
  const plans = usePlacePlans(placeId);
  const posts = usePosts(placeId);

  const toggleFavorite = useToggleFavorite();
  const purchase = usePurchase();
  const joinPlace = useJoinPlace();
  const { confirm, notice } = useConfirm();

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

  const confirmPurchase = async (planId: number, name: string, price: number, count: number) => {
    const ok = await confirm({
      title: '이용권을 구매할까요?',
      message: `${name}\n${count}회 · ${formatWon(price)}\n\n결제 연동 전이라 즉시 발급됩니다.`,
      confirmText: '구매',
    });
    if (!ok) return;
    purchase.mutate(
      { planId },
      {
        onSuccess: () =>
          void notice({ title: '구매 완료', message: '이용권 탭에서 확인할 수 있습니다.' }),
        onError: (e) => void notice({ title: '구매 실패', message: errorMessage(e) }),
      },
    );
  };

  const confirmJoin = async () => {
    const ok = await confirm({
      title: '소속을 신청할까요?',
      message: '관리자 승인 후 이 지점에서 강습을 개설할 수 있습니다.',
      confirmText: '신청',
    });
    if (!ok) return;
    joinPlace.mutate(placeId, {
      onSuccess: () => void notice({ title: '신청 완료', message: '관리자 승인을 기다려주세요.' }),
      onError: (e) => void notice({ title: '신청 실패', message: errorMessage(e) }),
    });
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
            <Icon
              name="star"
              size={26}
              filled={place.favorite}
              color={place.favorite ? colors.warning : colors.textFaint}
            />
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
            accessibilityRole="button"
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
        <>
        <Button
          title="글쓰기"
          small
          style={{ alignSelf: 'flex-start', marginBottom: spacing.md }}
          onPress={() => setPostForm(true)}
        />
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
                      {p.isPinned && <Icon name="pin" size={14} filled color={colors.accent} />}
                      <Badge value={p.postType} />
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {p.title}
                      </Text>
                    </View>
                    <Text style={styles.itemMeta}>
                      {p.authorName} · {relativeTime(p.createdAt)} · 댓글 {p.commentCount}
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color={colors.textFaint} />
                </Pressable>
              </View>
            ))
          )}
        </Card>
        </>
      )}

      <PostFormSheet
        visible={postForm}
        placeId={placeId}
        canWriteNotice={!isMember}
        onClose={() => setPostForm(false)}
        onCreated={() => {
          setPostForm(false);
          void posts.refetch();
        }}
      />
    </ScrollView>
  );
}

/** 지점 게시판 글쓰기. 공지는 트레이너 이상만 고를 수 있다. */
function PostFormSheet({
  visible,
  placeId,
  canWriteNotice,
  onClose,
  onCreated,
}: {
  visible: boolean;
  placeId: number;
  canWriteNotice: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const create = useCreatePost(placeId);
  const [postType, setPostType] = useState<PostType>(canWriteNotice ? 'NOTICE' : 'QNA');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const options: { value: PostType; label: string }[] = canWriteNotice
    ? [
        { value: 'NOTICE', label: '공지' },
        { value: 'FREE', label: '자유' },
        { value: 'QNA', label: '문의' },
      ]
    : [
        { value: 'QNA', label: '문의' },
        { value: 'FREE', label: '자유' },
      ];

  const submit = () => {
    if (!title.trim()) return setError('제목을 입력해주세요.');
    if (!content.trim()) return setError('내용을 입력해주세요.');
    setError(null);
    create.mutate(
      { postType, title: title.trim(), content: content.trim() },
      {
        onSuccess: () => {
          setTitle('');
          setContent('');
          onCreated();
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <FormSheet
      visible={visible}
      title="글쓰기"
      submitText="등록"
      submitting={create.isPending}
      error={error}
      onSubmit={submit}
      onClose={onClose}
    >
      <ChoiceGroup label="분류" value={postType} options={options} onChange={setPostType} />
      <Field label="제목" value={title} onChangeText={setTitle} placeholder="제목을 입력하세요" />
      <Field
        label="내용"
        value={content}
        onChangeText={setContent}
        placeholder="내용을 입력하세요"
        multiline
        style={{ height: 120, textAlignVertical: 'top', paddingTop: 12 }}
      />
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  address: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
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
