import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '../../src/api/client';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/lib/AuthProvider';
import { colors, fontSize, radius, spacing } from '../../src/theme';

type Tab = 'MEMBER' | 'TRAINER';

export default function SignUpScreen() {
  const { signUpMember, signUpTrainer } = useAuth();
  const [tab, setTab] = useState<Tab>('MEMBER');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [careerYears, setCareerYears] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!email.trim()) return '이메일을 입력해주세요.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return '이메일 형식이 올바르지 않습니다.';
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    if (!name.trim()) return '이름을 입력해주세요.';
    // 서버 정규식(^01[0-9]-?\d{3,4}-?\d{4}$)과 맞춘다.
    if (phoneNum && !/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phoneNum.trim())) {
      return '휴대폰 번호 형식이 올바르지 않습니다.';
    }
    return null;
  };

  const submit = async () => {
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const base = {
        email: email.trim(),
        password,
        name: name.trim(),
        phoneNum: phoneNum.trim() || undefined,
      };
      if (tab === 'MEMBER') {
        await signUpMember(base);
      } else {
        await signUpTrainer({
          ...base,
          specialty: specialty.trim() || undefined,
          careerYears: careerYears ? Number(careerYears) : undefined,
        });
      }
    } catch (e) {
      setError(errorMessage(e, '가입에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.tabs}>
          {(['MEMBER', 'TRAINER'] as Tab[]).map((t) => (
            <Text
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              {t === 'MEMBER' ? '회원' : '트레이너'}
            </Text>
          ))}
        </View>

        <Field
          label="이메일"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="비밀번호 (8자 이상)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="비밀번호"
        />
        <Field
          label="비밀번호 확인"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
          placeholder="비밀번호 재입력"
        />
        <Field label="이름" value={name} onChangeText={setName} placeholder="홍길동" />
        <Field
          label="휴대폰 번호 (선택)"
          value={phoneNum}
          onChangeText={setPhoneNum}
          placeholder="010-1234-5678"
          keyboardType="phone-pad"
        />

        {tab === 'TRAINER' && (
          <>
            <Field
              label="전문 분야 (선택)"
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="요가, 필라테스"
            />
            <Field
              label="경력 (년, 선택)"
              value={careerYears}
              onChangeText={setCareerYears}
              placeholder="5"
              keyboardType="number-pad"
            />
            <Text style={styles.hint}>
              가입 후 지점에 소속을 신청하면 관리자 승인 뒤 강습을 개설할 수 있습니다.
            </Text>
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button title="가입하기" onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingBottom: spacing.xxl },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    color: colors.textMuted,
    fontWeight: '600',
    overflow: 'hidden',
  },
  tabActive: { backgroundColor: colors.surface, color: colors.primary },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
