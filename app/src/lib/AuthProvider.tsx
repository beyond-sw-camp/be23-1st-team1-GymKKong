import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, setSessionExpiredHandler } from '../api/client';
import type { Role, TokenResponse, User } from '../api/types';
import { clearTokens, getTokens, saveTokens } from './tokenStore';

interface AuthState {
  user: User | null;
  /** 앱 시작 시 저장된 토큰으로 세션을 복구하는 동안 true. */
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUpMember: (input: SignUpInput) => Promise<User>;
  signUpTrainer: (input: TrainerSignUpInput) => Promise<User>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  phoneNum?: string;
}

export interface TrainerSignUpInput extends SignUpInput {
  specialty?: string;
  careerYears?: number;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  const queryClient = useQueryClient();

  const applySession = useCallback(async (data: TokenResponse) => {
    await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    setUser(data.user);
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      // 서버 측 리프레시 토큰도 폐기한다. 실패해도 로컬은 반드시 비운다.
      const tokens = await getTokens();
      if (tokens?.refreshToken) {
        await api.post('/api/auth/logout', { refreshToken: tokens.refreshToken });
      }
    } catch {
      // 네트워크 문제로 실패해도 로그아웃은 진행한다.
    } finally {
      await clearTokens();
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  // 리프레시까지 실패하면 세션을 정리한다.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      void clearTokens().then(() => {
        setUser(null);
        queryClient.clear();
      });
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  // 앱 시작 시 저장된 토큰으로 세션 복구
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokens = await getTokens();
        if (!tokens) return;
        const { data } = await api.get<User>('/api/me');
        if (!cancelled) setUser(data);
      } catch {
        await clearTokens();
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<TokenResponse>('/api/auth/login', {
        email: email.trim(),
        password,
      });
      return applySession(data);
    },
    [applySession],
  );

  const signUpMember = useCallback(
    async (input: SignUpInput) => {
      const { data } = await api.post<TokenResponse>('/api/auth/signup/member', {
        ...input,
        email: input.email.trim(),
      });
      return applySession(data);
    },
    [applySession],
  );

  const signUpTrainer = useCallback(
    async (input: TrainerSignUpInput) => {
      const { data } = await api.post<TokenResponse>('/api/auth/signup/trainer', {
        ...input,
        email: input.email.trim(),
      });
      return applySession(data);
    },
    [applySession],
  );

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<User>('/api/me');
    setUser(data);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user],
  );

  const value = useMemo(
    () => ({ user, restoring, signIn, signUpMember, signUpTrainer, signOut, refreshUser, hasRole }),
    [user, restoring, signIn, signUpMember, signUpTrainer, signOut, refreshUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
