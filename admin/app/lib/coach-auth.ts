import { API } from './api';

export const COACH_TOKEN_KEY = 'khala_coach_token';
export const COACH_KEY = 'khala_coach_data';

export type CoachUser = {
  id: string; nameAr: string; avatarUrl: string | null; email: string | null; appId: string;
};

export function getCoachToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COACH_TOKEN_KEY);
}

export function getCoachUser(): CoachUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(COACH_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as CoachUser; } catch { return null; }
}

export function isCoachAuthed(): boolean {
  return !!getCoachToken();
}

export async function coachLogin(email: string, password: string): Promise<CoachUser> {
  const res = await fetch(`${API}/coach-portal/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const txt = await res.text();
    let msg = 'فشل تسجيل الدخول';
    try {
      const json = JSON.parse(txt);
      msg = json.message ?? msg;
    } catch { msg = txt || msg; }
    throw new Error(msg);
  }
  const data = await res.json();
  localStorage.setItem(COACH_TOKEN_KEY, data.token);
  localStorage.setItem(COACH_KEY, JSON.stringify(data.coach));
  return data.coach as CoachUser;
}

export function coachLogout() {
  localStorage.removeItem(COACH_TOKEN_KEY);
  localStorage.removeItem(COACH_KEY);
  location.href = '/start';
}

export async function coachFetch<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getCoachToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (res.status === 401 && typeof window !== 'undefined') {
    coachLogout();
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function coachUpload(file: File): Promise<{ url: string }> {
  const token = getCoachToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/admin/upload`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
