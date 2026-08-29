import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * 토큰 저장소.
 * 네이티브에서는 SecureStore(키체인/키스토어)를, 웹에서는 SecureStore가 없어
 * AsyncStorage로 대체한다.
 */

const ACCESS_KEY = 'gymkkong.accessToken';
const REFRESH_KEY = 'gymkkong.refreshToken';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string) {
  if (isWeb) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
  if (isWeb) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  await Promise.all([
    setItem(ACCESS_KEY, tokens.accessToken),
    setItem(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function getTokens(): Promise<Tokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    getItem(ACCESS_KEY),
    getItem(REFRESH_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY)]);
}
