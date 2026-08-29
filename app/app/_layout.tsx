import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConfirmProvider } from '../src/components/ConfirmProvider';
import { Loading } from '../src/components/ui';
import { AuthProvider, useAuth } from '../src/lib/AuthProvider';
import { colors } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * 로그인 여부에 따라 (auth) 그룹과 (app) 그룹 사이를 자동으로 이동시킨다.
 * 세션 복구가 끝나기 전에는 아무 데도 보내지 않는다.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, restoring } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastRedirect = useRef<string | null>(null);

  useEffect(() => {
    if (restoring) return;

    const inAuthGroup = segments[0] === '(auth)';
    const target = !user && !inAuthGroup ? '/(auth)/login' : user && inAuthGroup ? '/(app)' : null;

    // 같은 목적지로 반복 이동하지 않도록 막는다.
    if (target && lastRedirect.current !== target) {
      lastRedirect.current = target;
      router.replace(target as never);
    } else if (!target) {
      lastRedirect.current = null;
    }
  }, [user, restoring, segments, router]);

  if (restoring) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Loading label="세션을 확인하는 중…" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ConfirmProvider>
              <StatusBar style="dark" />
            <AuthGate>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.surface },
                  headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '700' },
                  headerTintColor: colors.primary,
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
                <Stack.Screen name="place/[id]" options={{ title: '지점 상세' }} />
                <Stack.Screen name="session/[id]" options={{ title: '수업 상세' }} />
                <Stack.Screen name="post/[id]" options={{ title: '게시글' }} />
                <Stack.Screen name="roster/[sessionId]" options={{ title: '출석 관리' }} />
              </Stack>
            </AuthGate>
            </ConfirmProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
