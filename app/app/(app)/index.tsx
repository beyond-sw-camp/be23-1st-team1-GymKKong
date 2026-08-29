import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import { useFavorites, usePlaces, useTimetable } from '../../src/api/hooks';
import { DateStrip } from '../../src/components/DateStrip';
import { SessionCard } from '../../src/components/SessionCard';
import { EmptyState, ErrorState, Loading } from '../../src/components/ui';
import { useAuth } from '../../src/lib/AuthProvider';
import { toDateParam } from '../../src/lib/format';
import { colors, fontSize, radius, spacing } from '../../src/theme';

/**
 * 홈 = 지점 선택 + 그날의 시간표.
 * 즐겨찾기한 지점이 있으면 그 지점을 기본으로 연다.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [placeId, setPlaceId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());

  const placesQuery = usePlaces();
  const favoritesQuery = useFavorites();

  const places = placesQuery.data?.content ?? [];
  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((f) => f.id)),
    [favoritesQuery.data],
  );

  // 첫 진입 시 즐겨찾기 지점(없으면 첫 지점)을 선택한다.
  useEffect(() => {
    if (placeId !== null || places.length === 0) return;
    const favorite = places.find((p) => favoriteIds.has(p.id));
    setPlaceId(favorite?.id ?? places[0].id);
  }, [places, favoriteIds, placeId]);

  const timetable = useTimetable(placeId ?? 0, toDateParam(date), 1);

  if (placesQuery.isLoading) return <Loading label="지점을 불러오는 중…" />;
  if (placesQuery.isError) {
    return (
      <ErrorState message={errorMessage(placesQuery.error)} onRetry={() => placesQuery.refetch()} />
    );
  }
  if (places.length === 0) {
    return <EmptyState title="등록된 지점이 없습니다" description="관리자가 지점을 추가해야 합니다." />;
  }

  const selectedPlace = places.find((p) => p.id === placeId);
  const sessions = timetable.data ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.placeStrip}
      >
        {places.map((p) => {
          const active = p.id === placeId;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPlaceId(p.id)}
              onLongPress={() => router.push(`/place/${p.id}`)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {favoriteIds.has(p.id) ? '★ ' : ''}
                {p.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <DateStrip selected={date} onSelect={setDate} />

      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={timetable.isFetching} onRefresh={() => timetable.refetch()} />
        }
        ListHeaderComponent={
          selectedPlace ? (
            <Pressable onPress={() => router.push(`/place/${selectedPlace.id}`)}>
              <View style={styles.placeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName}>{selectedPlace.name}</Text>
                  <Text style={styles.placeAddress} numberOfLines={1}>
                    {selectedPlace.address}
                  </Text>
                </View>
                <Text style={styles.placeLink}>상세 ›</Text>
              </View>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          timetable.isLoading ? (
            <Loading label="시간표를 불러오는 중…" />
          ) : timetable.isError ? (
            <ErrorState message={errorMessage(timetable.error)} onRetry={() => timetable.refetch()} />
          ) : (
            <EmptyState
              title="이 날짜에 수업이 없어요"
              description={
                user?.role === 'TRAINER'
                  ? '내 수업 탭에서 회차를 개설할 수 있습니다.'
                  : '다른 날짜나 지점을 선택해보세요.'
              }
            />
          )
        }
        renderItem={({ item }) => (
          <SessionCard session={item} onPress={() => router.push(`/session/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  placeStrip: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
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

  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  placeName: { fontSize: fontSize.md, fontWeight: '700', color: colors.primaryDark },
  placeAddress: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  placeLink: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },

  list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 },
});
