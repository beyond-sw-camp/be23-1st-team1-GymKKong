import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { clearTokens, getTokens, saveTokens } from '../lib/tokenStore';
import type { ApiErrorBody, TokenResponse } from './types';

/**
 * API 베이스 URL 결정.
 *
 * Android 에뮬레이터에서 localhost는 에뮬레이터 자신을 가리키므로 10.0.2.2를 쓴다.
 * 실기기(Expo Go)는 개발 PC의 LAN IP가 필요한데, Expo가 알려주는 debuggerHost에서
 * 호스트를 뽑아 쓴다. 필요하면 app.json의 extra.apiBaseUrl로 직접 지정할 수 있다.
 */
function resolveBaseUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (configured) return configured;

  const port = 8081;

  // Expo 개발 서버 호스트에서 PC의 IP를 추출한다.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${port}`;
    }
  }

  if (Platform.OS === 'android') return `http://10.0.2.2:${port}`;
  return `http://localhost:${port}`;
}

export const API_BASE_URL = resolveBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** 401 시 토큰을 재발급받고, 그 사이 들어온 요청은 큐에 세워 한 번만 갱신한다. */
let refreshPromise: Promise<string | null> | null = null;

/** 인증 만료로 로그아웃해야 할 때 AuthProvider가 걸어두는 콜백. */
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const code = error.response?.data?.code;

    const isExpired = error.response?.status === 401 && code === 'TOKEN_EXPIRED';
    const isAuthCall = original?.url?.includes('/api/auth/');

    if (isExpired && original && !original._retried && !isAuthCall) {
      original._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api.request(original);
      }
      onSessionExpired?.();
    }

    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const tokens = await getTokens();
      if (!tokens?.refreshToken) return null;

      // 인터셉터 재귀를 피하려고 별도 인스턴스로 호출한다.
      const { data } = await axios.post<TokenResponse>(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken: tokens.refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
      );
      await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data.accessToken;
    } catch {
      await clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** 서버가 준 사람이 읽을 수 있는 메시지를 뽑아낸다. */
export function errorMessage(error: unknown, fallback = '요청을 처리하지 못했습니다.'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (body?.errors?.length) return body.errors[0].reason ?? body.message;
    if (body?.message) return body.message;
    if (!error.response) return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
  }
  return fallback;
}

export function errorCode(error: unknown): string | null {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.code ?? null;
  }
  return null;
}
