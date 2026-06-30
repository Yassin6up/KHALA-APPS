'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Lock, Upload, Save } from 'lucide-react';
import { coachFetch, coachUpload, coachLogout } from '../../lib/coach-auth';
import { fileUrl } from '../../lib/api';

type CoachProfile = {
  id: string; nameAr: string; bioAr?: string; avatarUrl?: string;
  specialtyAr?: string; email?: string; priceSAR?: number;
};

export default function CoachSettingsPage() {
  const [profile, setProfile] = useState<CoachProfile | null>(null);
  const [form, setForm] = useState({ nameAr: '', bioAr: '', specialtyAr: '', avatarUrl: '', priceSAR: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [upAvatar, setUpAvatar] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    coachFetch<CoachProfile>('/coach-portal/me').then((d) => {
      setProfile(d);
      setForm({ nameAr: d.nameAr, bioAr: d.bioAr ?? '', specialtyAr: d.specialtyAr ?? '', avatarUrl: d.avatarUrl ?? '', priceSAR: d.priceSAR?.toString() ?? '' });
    }).catch(() => null);
  }, []);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUpAvatar(true);
    try { const { url } = await coachUpload(file); setForm((f) => ({ ...f, avatarUrl: fileUrl(url) })); }
    catch (err) { alert('فشل رفع الصورة: ' + (err as Error).message); } finally { setUpAvatar(false); }
  }

  async function saveProfile() {
    setSaving(true); setMsg('');
    try {
      await coachFetch('/coach-portal/me', {
        method: 'PATCH',
        body: JSON.stringify({
          nameAr: form.nameAr, bioAr: form.bioAr || undefined,
          specialtyAr: form.specialtyAr || undefined,
          avatarUrl: form.avatarUrl || undefined,
          priceSAR: form.priceSAR ? Number(form.priceSAR) : undefined,
        }),
      });
      setMsg('تم حفظ البيانات بنجاح ✓');
      // Update cached name in localStorage
      const raw = localStorage.getItem('khala_coach_data');
      if (raw) {
        const d = JSON.parse(raw);
        localStorage.setItem('khala_coach_data', JSON.stringify({ ...d, nameAr: form.nameAr, avatarUrl: form.avatarUrl }));
      }
    } catch (e) { setMsg('خطأ: ' + (e as Error).message); } finally { setSaving(false); }
  }

  async function savePassword() {
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('كلمتا المرور غير متطابقتين'); return; }
    if (pwForm.newPassword.length < 6) { setPwMsg('كلمة المرور قصيرة (6 أحرف على الأقل)'); return; }
    setSavingPw(true); setPwMsg('');
    try {
      await coachFetch('/coach-portal/me', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      setPwMsg('تم تغيير كلمة المرور بنجاح ✓');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (e) { setPwMsg('خطأ: ' + (e as Error).message); } finally { setSavingPw(false); }
  }

  if (!profile) return <div style={{ padding: 40, color: '#98A2B3', textAlign: 'center' }}>جارٍ التحميل…</div>;

  return (
    <div style={{ padding: 32, maxWidth: 680 }}>
      <div className="page-head">
        <div>
          <div className="page-h1">الإعدادات الشخصية</div>
          <div className="page-desc">تحديث بياناتك وصورتك وكلمة المرور</div>
        </div>
      </div>

      {/* Profile */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <User size={18} color="#2EC5B6" />
          <span style={S.cardTitle}>الملف الشخصي</span>
        </div>

        {/* Avatar */}
        <div className="field">
          <label>صورة الملف الشخصي</label>
          <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <div style={S.avatar}>
              {form.avatarUrl
                ? <img src={form.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <User size={28} color="#2EC5B6" />}
            </div>
            <button className="btn btn-ghost" onClick={() => avatarRef.current?.click()}>
              <Upload size={14} /> {upAvatar ? 'جارٍ الرفع…' : 'تغيير الصورة'}
            </button>
          </div>
        </div>

        <div className="field">
          <label>الاسم *</label>
          <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} placeholder="اسمك بالعربية" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>التخصص</label>
            <input value={form.specialtyAr} onChange={(e) => setForm((f) => ({ ...f, specialtyAr: e.target.value }))} placeholder="تطوير الذات، التدريب المهني…" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>سعر الجلسة (ر.ع)</label>
            <input type="number" min="0" step="0.5" value={form.priceSAR} onChange={(e) => setForm((f) => ({ ...f, priceSAR: e.target.value }))} placeholder="15.000" />
          </div>
        </div>

        <div className="field">
          <label>نبذة مختصرة</label>
          <textarea rows={3} value={form.bioAr} onChange={(e) => setForm((f) => ({ ...f, bioAr: e.target.value }))} placeholder="عرّف بنفسك وخبرتك…" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving || !form.nameAr}>
            <Save size={15} /> {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
          </button>
          {msg && <span style={{ fontSize: 13.5, color: msg.startsWith('خطأ') ? '#EF4444' : '#10B981', fontWeight: 600 }}>{msg}</span>}
        </div>
      </div>

      {/* Password */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <Lock size={18} color="#6C8BFF" />
          <span style={S.cardTitle}>تغيير كلمة المرور</span>
        </div>

        <div className="field">
          <label>كلمة المرور الحالية</label>
          <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} placeholder="••••••••" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field" style={{ margin: 0 }}>
            <label>كلمة المرور الجديدة</label>
            <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="6 أحرف على الأقل" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>تأكيد كلمة المرور</label>
            <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" onClick={savePassword} disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}>
            <Lock size={15} /> {savingPw ? 'جارٍ التغيير…' : 'تغيير كلمة المرور'}
          </button>
          {pwMsg && <span style={{ fontSize: 13.5, color: pwMsg.startsWith('خطأ') ? '#EF4444' : '#10B981', fontWeight: 600 }}>{pwMsg}</span>}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ ...S.card, borderColor: '#FECACA' }}>
        <div style={S.cardHead}>
          <span style={{ ...S.cardTitle, color: '#EF4444' }}>منطقة الخطر</span>
        </div>
        <button className="btn" style={{ borderColor: '#EF4444', color: '#EF4444', background: 'transparent' }} onClick={() => { if (confirm('تسجيل الخروج؟')) coachLogout(); }}>
          تسجيل الخروج من جميع الأجهزة
        </button>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 2px 8px rgba(16,24,40,0.05)', marginBottom: 20,
    display: 'flex', flexDirection: 'column', gap: 16,
    border: '1.5px solid #EAEDF3',
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontWeight: 700, fontSize: 16, color: '#131826' },
  avatar: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'rgba(46,197,182,0.1)', border: '2px solid #2EC5B6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
};
