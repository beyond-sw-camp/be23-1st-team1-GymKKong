import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, fontSize, radius, spacing } from '../theme';
import { Button } from './ui';

/**
 * 생성/수정 폼을 담는 바텀시트형 모달.
 * 화면을 새로 만들 만큼 크지 않은 입력(강습 개설, 상품 등록 등)에 쓴다.
 */
export function FormSheet({
  visible,
  title,
  description,
  submitText = '저장',
  submitting,
  disabled,
  error,
  onSubmit,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  description?: string;
  submitText?: string;
  submitting?: boolean;
  disabled?: boolean;
  error?: string | null;
  onSubmit: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* 바깥을 누르면 닫힌다. 입력 중 오조작을 막으려 시트 자체는 눌러도 닫히지 않는다. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet} testID="form-sheet">
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            {!!description && <Text style={styles.description}>{description}</Text>}

            <ScrollView
              style={styles.body}
              contentContainerStyle={{ paddingBottom: spacing.md }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
              {!!error && <Text style={styles.error}>{error}</Text>}
            </ScrollView>

            <View style={styles.actions}>
              <Button title="닫기" variant="secondary" style={{ flex: 1 }} onPress={onClose} />
              <Button
                title={submitText}
                style={{ flex: 2 }}
                loading={submitting}
                disabled={disabled}
                onPress={onSubmit}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/** 여러 값 중 하나를 고르는 칩 그룹. 드롭다운 대신 쓴다. */
export function ChoiceGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.choiceWrap}>
      <Text style={styles.choiceLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(o.value)}
              style={[styles.choice, active && styles.choiceActive]}
            >
              <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  description: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  body: { marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },

  choiceWrap: { marginBottom: spacing.lg },
  choiceLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choice: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '600' },
  choiceTextActive: { color: colors.textInverse },
});
