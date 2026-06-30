'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { adminFetch } from './api';

export type AppStats = {
  users: number;
  rooms: number;
  messages: number;
  assets: number;
  subscriptions: number;
  activeSubs: number;
};

export type AppItem = {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  status: string;
  stats: AppStats;
};

type Ctx = {
  apps: AppItem[];
  appKey: string;
  setAppKey: (k: string) => void;
  currentApp: AppItem | null;
  loading: boolean;
  reloadApps: () => Promise<void>;
};

const AppContext = createContext<Ctx | null>(null);
const STORAGE = 'khala_admin_app';

/** Deterministic brand color per app key for logos/avatars. */
export function appColor(key: string): string {
  const palette = ['#2EC5B6', '#6C8BFF', '#F59E0B', '#EC4899', '#8B5CF6', '#10B981'];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % palette.length;
  return palette[h];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [appKey, setAppKeyState] = useState<string>('qader');
  const [loading, setLoading] = useState(true);

  async function reloadApps() {
    try {
      const data: AppItem[] = await adminFetch('/admin/apps');
      setApps(data);
      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE) : null;
      const exists = data.find((a) => a.key === saved);
      if (saved && exists) setAppKeyState(saved);
      else if (data[0]) setAppKeyState(data[0].key);
    } catch {
      /* unauthenticated pages handle their own redirect */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadApps();
  }, []);

  function setAppKey(k: string) {
    setAppKeyState(k);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE, k);
  }

  const currentApp = apps.find((a) => a.key === appKey) ?? null;

  return (
    <AppContext.Provider value={{ apps, appKey, setAppKey, currentApp, loading, reloadApps }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
