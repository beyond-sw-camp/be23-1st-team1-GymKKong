import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fontSize, radius, shadow, spacing, statusColor, statusLabel } from '../theme';

// ---------------------------------------------------------------- Button

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  small,
  style,
}: ButtonProps) {
  const inactive = disabled || loading;

  const bg: Record<ButtonVariant, string> = {
    primary: inactive ? colors.disabled : colors.primary,
    secondary: colors.surface,
    danger: inactive ? colors.disabled : colors.danger,
    ghost: 'transparent',
  };
  const fg: Record<ButtonVariant, string> = {
    primary: colors.textInverse,
    secondary: inactive ? colors.textFaint : colors.text,
    danger: colors.textInverse,
    ghost: inactive ? colors.textFaint : colors.primary,
  };

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        {
          backgroundColor: bg[variant],
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.borderStrong,
          opacity: pressed && !inactive ? 0.85 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive }}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} size="small" />
      ) : (
        <Text style={[styles.buttonText, small && { fontSize: fontSize.sm }, { color: fg[variant] }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------- Field

interface FieldProps extends TextInputProps {
  label: string;
  error?: string | null;
}

export function Field({ label, error, style, ...rest }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, !!error && { borderColor: colors.danger }, style]}
        {...rest}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------- Card

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ---------------------------------------------------------------- Badge

export function Badge({ value, label }: { value: string; label?: string }) {
  const tone = statusColor[value] ?? { bg: colors.surfaceAlt, fg: colors.textMuted };
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>
        {label ?? statusLabel[value] ?? value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------- 상태 뷰

export function Loading({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.centerText}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!description && <Text style={styles.centerText}>{description}</Text>}
      {!!action && <View style={{ marginTop: spacing.lg }}>{action}</View>}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyTitle}>문제가 발생했어요</Text>
      <Text style={styles.centerText}>{message}</Text>
      {!!onRetry && (
        <Button title="다시 시도" variant="secondary" small style={{ marginTop: spacing.lg }} onPress={onRetry} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------- 기타

export function Divider() {
  return <View style={styles.divider} />;
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

/** 라벨-값 한 줄. 상세 화면에서 반복적으로 쓴다. */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonSmall: { height: 38, borderRadius: radius.sm, paddingHorizontal: spacing.md },
  buttonText: { fontSize: fontSize.md, fontWeight: '600' },

  fieldWrap: { marginBottom: spacing.lg },
  fieldLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  fieldError: { color: colors.danger, fontSize: fontSize.xs, marginTop: spacing.xs },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  centerText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  infoValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
});
