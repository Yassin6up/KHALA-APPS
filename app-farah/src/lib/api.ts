import Constants from 'expo-constants';
import { authStore } from './authStore';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  appKey?: string;
};

const BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  extra.apiUrl ??
  'http://localhost:4000/v1';

const APP_KEY = extra.appKey ?? 'farah';

export type ApiOpts = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

// Prevents multiple simultaneous refresh attempts
let _refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    const refreshToken = authStore.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-app-key': APP_KEY },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json() as { accessToken: string; refreshToken: string };
      await authStore.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
}

async function logout() {
  const [{ router }, { authStore: store }] = await Promise.all([
    import('expo-router'),
    import('./authStore'),
  ]);
  await store.clear();
  router.replace('/login');
}

export async function api<T = unknown>(
  path: string,
  opts: ApiOpts = {},
): Promise<T> {
  const makeRequest = (token: string | null) => {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-app-key': APP_KEY,
    };
    if (opts.auth !== false && token) {
      headers.authorization = `Bearer ${token}`;
    }
    return fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  };

  let res = await makeRequest(authStore.getAccessToken());

  // On 401, try to refresh once then retry
  if (res.status === 401 && opts.auth !== false) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await makeRequest(authStore.getAccessToken());
    }
    if (!refreshed || res.status === 401) {
      await logout();
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

export { BASE, APP_KEY };
