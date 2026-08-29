import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '../src/lib/AuthProvider';

/**
 * 루트 진입점. 로그인 여부에 따라 그룹을 고른다.
 * (_layout의 AuthGate도 같은 판단을 하지만, 최초 URL이 '/'일 때
 *  머무를 화면이 필요해 명시적으로 리다이렉트한다.)
 */
export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? '/(app)' : '/(auth)/login'} />;
}
