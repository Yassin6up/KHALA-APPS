const API = process.env.NEXT_PUBLIC_API_URL ?? (
  typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.hostname}:4000/v1` 
    : 'http://localhost:4000/v1'
);
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? 'qader-admin-2025';

export { API, ADMIN_KEY };

export const TOKEN_KEY = 'khala_admin_token';
export const USER_KEY = 'khala_admin_user';

/** Strip the trailing /v1 to build absolute upload URLs. */
export const FILE_BASE = API.replace(/\/v1$/, '');

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  // Bearer token preferred; fall back to the bootstrap admin key.
  return token ? { authorization: `Bearer ${token}` } : { 'x-admin-key': ADMIN_KEY };
}

export async function adminFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...authHeaders(), ...opts.headers },
  });
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (!location.pathname.startsWith('/login')) location.href = '/login';
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminUpload(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/admin/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Turn a stored "/uploads/x" path into an absolute, loadable URL. */
export function fileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${FILE_BASE}${url}`;
}
