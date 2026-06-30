'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { coachLogin } from '../lib/coach-auth';

export default function CoachLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await coachLogin(email, password);
      router.replace('/coach/dashboard');
    } catch (err: any) {
      setError(err.message ?? 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.root}>
      <div style={S.card}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoCircle}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'Cairo, sans-serif' }}>ق</span>
          </div>
          <div>
            <div style={S.logoTitle}>بوابة المدرب</div>
            <div style={S.logoSub}>منصة قادر · KHALA</div>
          </div>
        </div>

        <div style={S.heading}>تسجيل الدخول</div>
        <div style={S.sub}>أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحتك</div>

        {error && <div style={S.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@example.com" required autoFocus />
          </div>
          <div className="field">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" style={{ marginTop: 4, height: 48, fontSize: 16 }} disabled={loading}>
            {loading ? 'جارٍ الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>

        <div style={S.footer}>
          لديك مشكلة في الدخول؟ تواصل مع الإدارة
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0F1729 0%, #1a2744 100%)',
    padding: 20,
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420,
    boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 },
  logoCircle: {
    width: 52, height: 52, borderRadius: 16,
    background: 'linear-gradient(135deg, #2EC5B6, #6C8BFF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoTitle: { fontWeight: 800, fontSize: 18, color: '#131826', fontFamily: 'Cairo, sans-serif' },
  logoSub: { fontSize: 12, color: '#98A2B3', marginTop: 2 },
  heading: { fontWeight: 800, fontSize: 22, color: '#131826', fontFamily: 'Cairo, sans-serif' },
  sub: { fontSize: 14, color: '#5A6473', marginTop: -10 },
  errorBox: {
    background: '#FEECEC', border: '1px solid #FECACA', borderRadius: 10,
    padding: '10px 14px', color: '#EF4444', fontSize: 13.5, fontWeight: 600,
  },
  footer: { textAlign: 'center', fontSize: 13, color: '#98A2B3', marginTop: 4 },
};
