import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../theme';
import { Button } from './ui';

/**
 * 크로스플랫폼 확인 다이얼로그.
 *
 * react-native-web에는 Alert 구현이 없어 Alert.alert가 아무 일도 하지 않는다.
 * 그 결과 예약 취소·환불 요청·수업 취소 같은 확인이 필요한 동작이
 * 웹에서는 전부 무반응이었다. 직접 모달로 구현해 네이티브와 웹 모두에서
 * 동일하게 동작하게 한다.
 */

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface NoticeOptions {
  title: string;
  message?: string;
}

interface ConfirmState extends ConfirmOptions {
  mode: 'confirm' | 'notice';
  resolve: (ok: boolean) => void;
}

interface ConfirmApi {
  /** 확인/취소 두 버튼. 사용자가 확인을 누르면 true. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** 확인 버튼 하나짜리 알림. */
  notice: (options: NoticeOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmApi | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  // 연속 호출 시 이전 Promise가 매달리지 않도록 마지막 것만 유지한다.
  const pending = useRef<((ok: boolean) => void) | null>(null);

  const close = useCallback((ok: boolean) => {
    pending.current?.(ok);
    pending.current = null;
    setState(null);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        pending.current?.(false);
        pending.current = resolve;
        setState({ ...options, mode: 'confirm', resolve });
      }),
    [],
  );

  const notice = useCallback(
    (options: NoticeOptions) =>
      new Promise<void>((resolve) => {
        pending.current?.(false);
        pending.current = () => resolve();
        setState({ ...options, mode: 'notice', resolve: () => resolve() });
      }),
    [],
  );

  const api = useMemo(() => ({ confirm, notice }), [confirm, notice]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}

      <Modal
        visible={state !== null}
        transparent
        animationType="fade"
        onRequestClose={() => close(false)}
      >
        <View style={styles.backdrop} testID="dialog-backdrop">
          <View style={styles.dialog} testID="dialog">
            <Text style={styles.title} testID="dialog-title">
              {state?.title}
            </Text>
            {!!state?.message && (
              <Text style={styles.message} testID="dialog-message">
                {state.message}
              </Text>
            )}

            <View style={styles.actions}>
              {state?.mode === 'confirm' && (
                <Button
                  title={state?.cancelText ?? '닫기'}
                  variant="secondary"
                  small
                  style={{ flex: 1 }}
                  onPress={() => close(false)}
                />
              )}
              <Button
                title={state?.confirmText ?? '확인'}
                variant={state?.destructive ? 'danger' : 'primary'}
                small
                style={{ flex: 1 }}
                onPress={() => close(true)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmApi {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  message: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
});
