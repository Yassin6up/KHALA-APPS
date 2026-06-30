'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, ShieldCheck, BarChart3, Boxes } from 'lucide-react';
import { login, isAuthed } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthed()) router.replace('/');
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1.1fr 1fr', background: 'var(--bg)' }}>
      {/* Brand panel */}
      <div
        style={{
          background: 'linear-gradient(150deg, #0F1729 0%, #15233F 55%, #1FA193 160%)',
          color: '#fff', padding: '56px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,197,182,0.35), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,139,255,0.28), transparent 70%)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #2EC5B6, #6C8BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>KH</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19 }}>KHALA</div>
            <div style={{ fontSize: 12, color: '#8A94A8' }}>منصة التطبيقات</div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.3, margin: '0 0 16px', letterSpacing: '-0.5px' }}>
            لوحة تحكم موحّدة<br />لكل تطبيقاتك
          </h1>
          <p style={{ fontSize: 15, color: '#B6BFD0', lineHeight: 1.8, maxWidth: 380, margin: 0 }}>
            أدِر المجتمعات والمكتبة والمستخدمين والاشتراكات عبر جميع التطبيقات من مكان واحد.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32 }}>
            {[
              { icon: Boxes, t: 'إدارة متعددة التطبيقات' },
              { icon: BarChart3, t: 'إحصائيات لحظية لكل تطبيق' },
              { icon: ShieldCheck, t: 'صلاحيات وأدوار آمنة' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14.5, color: '#D6DCE6' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <f.icon size={18} color="#2EC5B6" />
                </div>
                {f.t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#6A748A', position: 'relative' }}>© {new Date().getFullYear()} KHALA · جميع الحقوق محفوظة</div>
      </div>

      {/* Form panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 25, fontWeight: 800, margin: '0 0 6px' }}>تسجيل الدخول</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 28px' }}>أدخل بياناتك للوصول إلى لوحة التحكم</p>

          {error && <div className="alert-error">{error}</div>}

          <div className="field">
            <label>البريد الإلكتروني</label>
            <div className="search-box" style={{ maxWidth: '100%', height: 46 }}>
              <Mail size={18} color="var(--text-3)" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@khala.app" required autoFocus />
            </div>
          </div>

          <div className="field">
            <label>كلمة المرور</label>
            <div className="search-box" style={{ maxWidth: '100%', height: 46 }}>
              <Lock size={18} color="var(--text-3)" />
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              <div onClick={() => setShow((v) => !v)} style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-3)' }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: 46, marginTop: 6, fontSize: 15 }}>
            {loading ? 'جارٍ الدخول…' : <>دخول <ArrowLeft size={17} /></>}
          </button>

          <div style={{ marginTop: 24, padding: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>بيانات افتراضية:</strong><br />
            admin@khala.app · admin123
          </div>
        </form>
      </div>
    </div>
  );
}
