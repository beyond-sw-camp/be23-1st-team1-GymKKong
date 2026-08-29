import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import { useMarkRead, useNotifications } from '../../src/api/hooks';
import type { AppNotification } from '../../src/api/types';
import { Icon, type IconName } from '../../src/components/Icon';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { relativeTime } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing } from '../../src/theme';

/** 알림 종류별 아이콘과 색. 종류를 색으로도 구분한다. */
const ICONS: Record<string, { name: IconName; color: string }> = {
  RESERVATION: { name: 'check-circle', color: colors.success },
  CLASS_CANCELED: { name: 'alert-triangle', color: colors.danger },
  MEMBERSHIP_EXPIRING: { name: 'clock', color: colors.warning },
  PAYMENT: { name: 'card', color: colors.primary },
  COMMENT: { name: 'message', color: colors.accent },
  NOTICE: { name: 'megaphone', color: colors.indigo },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const query = useNotifications();
  const markRead = useMarkRead();

  /** 알림을 누르면 읽음 처리하고 딥링크 대상으로 이동한다. */
  const open = (n: AppNotification) => {
    if (!n.read) markRead.mutate(n.id);
    if (!n.linkId) return;

    switch (n.linkType) {
      case 'SESSION':
        router.push(`/session/${n.linkId}`);
        break;
      case 'POST':
        router.push(`/post/${n.linkId}`);
        break;
      case 'MEMBERSHIP':
        router.push('/(app)/memberships');
        break;
      default:
        break;
    }
  };

  return (
    <FlatList
      style={styles.container}
      data={query.data?.content ?? []}
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
          <EmptyState title="알림이 없어요" description="예약이나 공지가 생기면 여기에 표시됩니다." />
        )
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => open(item)}
          style={({ pressed }) => [
            styles.card,
            !item.read && styles.unread,
            pressed && { opacity: 0.9 },
          ]}
        >
          <View style={styles.iconWrap}>
            <Icon
              name={(ICONS[item.type] ?? { name: 'bell' }).name}
              size={20}
              color={ICONS[item.type]?.color ?? colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read && <View style={styles.dot} />}
            </View>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{relativeTime(item.createdAt)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.card,
  },
  unread: { backgroundColor: colors.primarySoft },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  body: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3, lineHeight: 19 },
  time: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: spacing.xs },
});
