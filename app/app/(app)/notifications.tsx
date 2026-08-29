import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import { useMarkRead, useNotifications } from '../../src/api/hooks';
import type { AppNotification } from '../../src/api/types';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { relativeTime } from '../../src/lib/format';
import { colors, fontSize, radius, shadow, spacing } from '../../src/theme';

const ICONS: Record<string, string> = {
  RESERVATION: '✅',
  CLASS_CANCELED: '⚠️',
  MEMBERSHIP_EXPIRING: '⏳',
  PAYMENT: '💳',
  COMMENT: '💬',
  NOTICE: '📢',
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
          <Text style={styles.icon}>{ICONS[item.type] ?? '🔔'}</Text>
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
  icon: { fontSize: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flexShrink: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  body: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 3, lineHeight: 19 },
  time: { fontSize: fontSize.xs, color: colors.textFaint, marginTop: spacing.xs },
});
