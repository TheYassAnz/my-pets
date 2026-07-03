import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SecureStore n'existe pas sur web → fallback localStorage (dev uniquement)
const isWeb = Platform.OS === 'web';

export async function getToken(key: string): Promise<string | null> {
  if (isWeb) {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

export async function setToken(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteToken(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const ACCESS_TOKEN_KEY = 'mypets.accessToken';
export const REFRESH_TOKEN_KEY = 'mypets.refreshToken';
