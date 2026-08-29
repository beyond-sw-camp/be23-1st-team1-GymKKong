import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../src/api/client';
import { useFavorites, useMyPayments } from '../../src/api/hooks';
import { useConfirm } from '../../src/components/ConfirmProvider';
import { Badge, Button, Card, Divider, InfoRow } from '../../src/components/ui';
import { useAuth } from '../../src/lib/AuthProvider';
import { formatDateTime, formatWon } from '../../src/lib/format';
import { colors, fontSize, radius, spacing, statusLabel } from '../../src/theme';

const ROLE_LABEL: Record<string, string> = {
  MEMBER: '회원',
  TRAINER: '트레이너',
  ADMIN: '지점 관리자',
  SUPER_ADMIN: '최고 관리자',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const favorites = useFavorites();
  const payments = useMyPayments();
  const { confirm } = useConfirm();

  const confirmSignOut = async () => {
    const ok = await confirm({
      title: '로그아웃할까요?',
      message: '이 기기의 로그인 정보가 지워집니다.',
      confirmText: '로그아웃',
      destructive: true,
    });
    if (ok) await signOut();
  };

  if (!user) return null;

  const isMember = user.role === 'MEMBER';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <Badge value={user.role} label={ROLE_LABEL[user.role]} />
        </View>

        <Divider />

        <InfoRow label="휴대폰" value={user.phoneNum ?? '미등록'} />
        <InfoRow label="계정 상태" value={statusLabel[user.status] ?? user.status} />
      </Card>

      {isMember && (
        <>
          <Text style={styles.sectionTitle}>즐겨찾기 지점</Text>
          <Card>
            {(favorites.data ?? []).length === 0 ? (
              <Text style={styles.empty}>즐겨찾기한 지점이 없습니다.</Text>
            ) : (
              (favorites.data ?? []).map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Divider />}
                  <Pressable onPress={() => router.push(`/place/${p.id}`)} style={styles.linkRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkTitle}>{p.name}</Text>
                      <Text style={styles.linkMeta} numberOfLines={1}>
                        {p.address}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                </View>
              ))
            )}
          </Card>

          <Text style={styles.sectionTitle}>결제 내역</Text>
          <Card>
            {(payments.data ?? []).length === 0 ? (
              <Text style={styles.empty}>결제 내역이 없습니다.</Text>
            ) : (
              (payments.data ?? []).map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Divider />}
                  <View style={styles.paymentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkTitle}>{p.planName}</Text>
                      <Text style={styles.linkMeta}>
                        {p.paidAt ? formatDateTime(p.paidAt) : '결제 대기'} · {p.method}
                      </Text>
                    </View>
                    <Text style={styles.amount}>{formatWon(p.amount)}</Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </>
      )}

      <Text style={styles.sectionTitle}>앱 정보</Text>
      <Card>
        <InfoRow label="API 서버" value={API_BASE_URL} />
        <InfoRow label="앱 버전" value="0.1.0" />
      </Card>

      <Button title="로그아웃" variant="secondary" onPress={confirmSignOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },

  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  empty: { fontSize: fontSize.sm, color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.sm },

  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  linkTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  linkMeta: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: fontSize.xl, color: colors.textFaint },

  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  amount: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
});
