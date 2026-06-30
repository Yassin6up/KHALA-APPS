import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ACCESS = 'farah_access_token';
const KEY_REFRESH = 'farah_refresh_token';

let _access: string | null = null;
let _refresh: string | null = null;

export const authStore = {
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
