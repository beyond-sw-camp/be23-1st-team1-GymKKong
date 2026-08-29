import { Stack } from 'expo-router';
import React from 'react';

import { colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '700' },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ title: '회원가입' }} />
      <Stack.Screen name="find-account" options={{ title: '계정 찾기' }} />
    </Stack>
  );
}
