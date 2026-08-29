import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { api, errorMessage } from '../../src/api/client';
import { Button, Card, Field } from '../../src/components/ui';
import { colors, fontSize, spacing } from '../../src/theme';

type Step = 'FIND' | 'RESET';

/**
 * 계정 찾기 + 비밀번호 재설정.
 * 서버는 인증번호 확인을 통과해야 재설정을 허용하므로, 발송 → 확인 → 재설정 순서로 진행한다.
 * 개발 환경에서는 인증번호가 서버 로그에 출력된다.
 */
export default function FindAccountScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('FIND');

  const [phoneNum, setPhoneNum] = useState('');
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const findAccount = () =>
    run(async () => {
      const { data } = await api.get<{ maskedEmail: string }>('/api/auth/find-account', {
        params: { phoneNum: phoneNum.trim() },
      });
      setMaskedEmail(data.maskedEmail);
      setNotice(null);
    });

  const sendCode = () =>
    run(async () => {
      await api.post('/api/auth/verification/send', {
        channel: 'EMAIL',
        target: email.trim(),
        purpose: 'RESET_PASSWORD',
      });
      setCodeSent(true);
      setNotice('인증번호를 발송했습니다. (개발 환경에서는 서버 로그에서 확인)');
    });

  const confirmCode = () =>
    run(async () => {
      await api.post('/api/auth/verification/confirm', {
        channel: 'EMAIL',
        target: email.trim(),
        purpose: 'RESET_PASSWORD',
        code: code.trim(),
      });
      setVerified(true);
      setNotice('본인 확인이 완료되었습니다. 새 비밀번호를 입력해주세요.');
    });

  const resetPassword = () =>
    run(async () => {
      if (newPassword.length < 8) {
        throw new Error('비밀번호는 8자 이상이어야 합니다.');
      }
      await api.post('/api/auth/password/reset', {
        channel: 'EMAIL',
        target: email.trim(),
        newPassword,
      });
      router.replace('/(auth)/login');
    });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.tabs}>
          {(
            [
              ['FIND', '이메일 찾기'],
              ['RESET', '비밀번호 재설정'],
            ] as [Step, string][]
          ).map(([key, label]) => (
            <Text
              key={key}
              onPress={() => {
                setStep(key);
                setError(null);
                setNotice(null);
              }}
              style={[styles.tab, step === key && styles.tabActive]}
            >
              {label}
            </Text>
          ))}
        </View>

        {step === 'FIND' ? (
          <>
            <Field
              label="가입한 휴대폰 번호"
              value={phoneNum}
              onChangeText={setPhoneNum}
              placeholder="010-1234-5678"
              keyboardType="phone-pad"
            />
            <Button title="이메일 찾기" onPress={findAccount} loading={loading} />

            {!!maskedEmail && (
              <Card style={{ marginTop: spacing.xl }}>
                <Text style={styles.resultLabel}>가입된 이메일</Text>
                <Text style={styles.resultValue}>{maskedEmail}</Text>
              </Card>
            )}
          </>
        ) : (
          <>
            <Field
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!verified}
            />
            {!verified && (
              <Button
                title={codeSent ? '인증번호 다시 보내기' : '인증번호 받기'}
                variant="secondary"
                onPress={sendCode}
                loading={loading}
                style={{ marginBottom: spacing.lg }}
              />
            )}

            {codeSent && !verified && (
              <>
                <Field
                  label="인증번호 6자리"
                  value={code}
                  onChangeText={setCode}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Button title="인증 확인" onPress={confirmCode} loading={loading} />
              </>
            )}

            {verified && (
              <>
                <Field
                  label="새 비밀번호 (8자 이상)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="새 비밀번호"
                />
                <Button title="비밀번호 변경" onPress={resetPassword} loading={loading} />
              </>
            )}
          </>
        )}

        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    color: colors.textMuted,
    fontWeight: '600',
    overflow: 'hidden',
  },
  tabActive: { backgroundColor: colors.surface, color: colors.primary },
  resultLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  resultValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
  notice: {
    marginTop: spacing.lg,
    color: colors.info,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 19,
  },
  error: { marginTop: spacing.lg, color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
});
