import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ACCESS = 'khala_access_token';
const KEY_REFRESH = 'khala_refresh_token';

// In-memory cache — fast synchronous reads after initial restore
let _access: string | null = null;
let _refresh: string | null = null;

export const authStore = {
  /** Call once on app startup to restore tokens from storage. */
  async restore(): Promise<void> {
    try {
      _access = await AsyncStorage.getItem(KEY_ACCESS);
      _refresh = await AsyncStorage.getItem(KEY_REFRESH);
    } catch (e) {
      console.warn('Failed to restore auth', e);
    }
  },

  getAccessToken: (): string | null => _access,
  getRefreshToken: (): string | null => _refresh,
  isLoggedIn: (): boolean => !!_access,

  async setTokens(access: string, refresh: string): Promise<void> {
    _access = access;
    _refresh = refresh;
    try {
      await AsyncStorage.setItem(KEY_ACCESS, access);
      await AsyncStorage.setItem(KEY_REFRESH, refresh);
    } catch (e) {
      console.warn('Failed to save auth', e);
    }
  },

  async clear(): Promise<void> {
    _access = null;
    _refresh = null;
    try {
      await AsyncStorage.removeItem(KEY_ACCESS);
      await AsyncStorage.removeItem(KEY_REFRESH);
    } catch (e) {
      console.warn('Failed to clear auth', e);
    }
  },
};
