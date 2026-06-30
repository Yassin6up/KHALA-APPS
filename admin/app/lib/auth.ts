import { API, TOKEN_KEY, USER_KEY } from './api';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'viewer';
};

export const ROLE_LABEL: Record<string, string> = {
  super_admin: 'مدير عام',
  admin: 'مدير',
  viewer: 'مشاهد',
};

export function getStoredUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function isAuthed(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<AdminUser> {
  const res = await fetch(`${API}/admin/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt.includes('غير صحيحة') ? 'بيانات الدخول غير صحيحة' : 'فشل تسجيل الدخول');
  }
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user as AdminUser;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  location.href = '/login';
}
