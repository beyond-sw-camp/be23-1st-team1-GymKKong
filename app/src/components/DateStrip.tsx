import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { addDays, isSameDay, shortWeekday } from '../lib/format';
import { colors, fontSize, radius, spacing } from '../theme';

interface Props {
  selected: Date;
  onSelect: (date: Date) => void;
  /** 오늘부터 표시할 일수. */
  days?: number;
}

/** 가로로 스크롤되는 날짜 선택 스트립. 시간표 화면 상단에 붙는다. */
export function DateStrip({ selected, onSelect, days = 14 }: Props) {
  const today = new Date();
  const dates = Array.from({ length: days }, (_, i) => addDays(today, i));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dates.map((date) => {
        const active = isSameDay(date, selected);
        const isToday = isSameDay(date, today);
        const weekend = date.getDay() === 0 || date.getDay() === 6;

        return (
          <Pressable
            key={date.toISOString()}
            onPress={() => onSelect(date)}
            style={[styles.item, active && styles.itemActive]}
          >
            <Text
              style={[
                styles.weekday,
                weekend && !active && { color: colors.danger },
                active && styles.textActive,
              ]}
            >
              {shortWeekday(date)}
            </Text>
            <Text style={[styles.day, active && styles.textActive]}>{date.getDate()}</Text>
            {isToday && <View style={[styles.dot, active && { backgroundColor: '#fff' }]} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  item: {
    width: 48,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  weekday: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600' },
  day: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: 2 },
  textActive: { color: colors.textInverse },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
});
