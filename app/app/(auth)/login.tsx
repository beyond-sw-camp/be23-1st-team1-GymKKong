import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '../../src/api/client';
import { Button, Field } from '../../src/components/ui';
import { useAuth } from '../../src/lib/AuthProvider';
import { colors, fontSize, spacing } from '../../src/theme';

/** 개발 편의를 위한 시드 계정. 운영 빌드에서는 제거한다. */
const DEMO_ACCOUNTS = [
  { label: '회원', email: 'kim@example.com' },
  { label: '트레이너', email: 'choi.trainer@gymkkong.com' },
  { label: '관리자', email: 'admin.gangnam@gymkkong.com' },
];

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // 로그인 성공 시 _layout의 AuthGate가 (app)으로 이동시킨다.
    } catch (e) {
      setError(errorMessage(e, '로그인에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('gymkkong1234');
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>짐꽁</Text>
            <Text style={styles.tagline}>수업 예약부터 출석까지 한 번에</Text>
          </View>

          <Field
            label="이메일"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Field
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Button title="로그인" onPress={submit} loading={loading} />

          <View style={styles.links}>
            <Link href="/(auth)/signup" style={styles.link}>
              회원가입
            </Link>
            <Text style={styles.linkDivider}>·</Text>
            <Link href="/(auth)/find-account" style={styles.link}>
              계정 찾기
            </Link>
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>테스트 계정 (비밀번호 gymkkong1234)</Text>
            <View style={styles.demoRow}>
              {DEMO_ACCOUNTS.map((a) => (
                <Button
                  key={a.email}
                  title={a.label}
                  variant="secondary"
                  small
                  style={{ flex: 1, marginHorizontal: 2 }}
                  onPress={() => fillDemo(a.email)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: { fontSize: 44, fontWeight: '800', color: colors.primary, letterSpacing: -1 },
  tagline: { marginTop: spacing.sm, color: colors.textMuted, fontSize: fontSize.md },
  error: {
    color: colors.danger,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  linkDivider: { color: colors.textFaint, marginHorizontal: spacing.sm },
  demoBox: {
    marginTop: spacing.xxl,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
  },
  demoTitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  demoRow: { flexDirection: 'row' },
});
