'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, User, BookOpen } from 'lucide-react';
import { adminFetch, adminUpload, fileUrl } from '../lib/api';
import { useApp } from '../lib/app-context';

interface Coach {
  id: string; nameAr: string; bioAr: string | null;
  avatarUrl: string | null; specialtyAr: string | null;
  isActive: boolean; createdAt: string;
  _count: { assets: number };
}
interface CoachForm {
  nameAr: string; bioAr: string; specialtyAr: string; avatarUrl: string;
  email: string; password: string; priceSAR: string; isActive: boolean;
}
const emptyForm: CoachForm = { nameAr: '', bioAr: '', specialtyAr: '', avatarUrl: '', email: '', password: '', priceSAR: '', isActive: true };

export default function CoachesPage() {
  const { appKey } = useApp();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCoach, setEditCoach] = useState<Coach | null>(null);
  const [form, setForm] = useState<CoachForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [upAvatar, setUpAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true); setError('');
    try { setCoaches(await adminFetch(`/admin/coaches?appKey=${appKey}`)); }
    catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  useEffect(() => { if (appKey) load(); }, [appKey]);

  function openCreate() { setEditCoach(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(c: Coach) {
    setEditCoach(c);
    setForm({ nameAr: c.nameAr, bioAr: c.bioAr ?? '', specialtyAr: c.specialtyAr ?? '', avatarUrl: c.avatarUrl ?? '', email: (c as any).email ?? '', password: '', priceSAR: String((c as any).priceSAR ?? ''), isActive: c.isActive });
    setShowModal(true);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUpAvatar(true);
    try { const { url } = await adminUpload(file); setForm((f) => ({ ...f, avatarUrl: fileUrl(url) })); }
    catch (err) { alert('فشل رفع الصورة: ' + (err as Error).message); } finally { setUpAvatar(false); }
  }

  async function handleSave() {
    if (!form.nameAr.trim()) { alert('أدخل اسم المدرب'); return; }
    setSaving(true);
    try {
      const payload: any = {
        nameAr: form.nameAr, email: form.email || undefined,
        bioAr: form.bioAr || undefined, specialtyAr: form.specialtyAr || undefined,
        avatarUrl: form.avatarUrl || undefined, isActive: form.isActive,
        priceSAR: form.priceSAR ? Number(form.priceSAR) : undefined,
      };
      if (form.password) payload.password = form.password;
      if (editCoach) await adminFetch(`/admin/coaches/${editCoach.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else {
        if (!form.email) { alert('البريد الإلكتروني مطلوب'); setSaving(false); return; }
        if (!form.password) { alert('كلمة المرور مطلوبة للمدرب الجديد'); setSaving(false); return; }
        await adminFetch('/admin/coaches', { method: 'POST', body: JSON.stringify({ ...payload, appKey }) });
      }
      setShowModal(false); await load();
    } catch (e) { alert('خطأ: ' + (e as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا المدرب نهائياً؟ سيتم إزالة ربطه بالمحتوى.')) return;
    try { await adminFetch(`/admin/coaches/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { alert('خطأ: ' + (e as Error).message); }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-h1">المدربون</div>
          <div className="page-desc">إدارة مدربي التطبيق ومحتواهم</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> إضافة مدرب</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>المدرب</th><th>التخصص</th><th>المحتوى</th><th>الحالة</th><th style={{ textAlign: 'left' }}>إجراءات</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : coaches.length === 0 ? (
              <tr><td colSpan={5}><div className="empty">لا يوجد مدربون — أضف أول مدرب للتطبيق</div></td></tr>
            ) : coaches.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.nameAr} className="thumb" style={{ width: 44, height: 44, borderRadius: 22 }} />
                    ) : (
                      <div className="thumb" style={{ width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-soft)' }}>
                        <User size={20} color="var(--brand)" />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.nameAr}</div>
                      {c.bioAr && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.bioAr}</div>}
                    </div>
                  </div>
                </td>
                <td>{c.specialtyAr ? <span className="badge badge-blue">{c.specialtyAr}</span> : '—'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={14} color="var(--text-3)" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{c._count.assets} محتوى</span>
                  </div>
                </td>
                <td>
                  {c.isActive
                    ? <span className="badge badge-green">نشط</span>
                    : <span className="badge badge-gray">غير نشط</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-start' }}>
                    <button className="icon-btn" onClick={() => openEdit(c)}><Pencil size={15} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(c.id)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-head">
              <div>
                <div className="modal-title">{editCoach ? 'تعديل المدرب' : 'مدرب جديد'}</div>
                <div className="modal-sub">أضف مدرباً وربطه بمحتوى المكتبة</div>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={17} /></button>
            </div>

            <div className="modal-body">
              {/* Avatar */}
              <div className="field">
                <label>صورة المدرب</label>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
                {form.avatarUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <img src={form.avatarUrl} alt="" style={{ width: 64, height: 64, borderRadius: 32, objectFit: 'cover', border: '2px solid var(--brand)' }} />
                    <button className="btn btn-ghost btn-sm" onClick={() => avatarRef.current?.click()}>
                      <Upload size={13} /> تغيير
                    </button>
                  </div>
                ) : (
                  <div className="dropzone" style={{ marginTop: 6 }} onClick={() => avatarRef.current?.click()}>
                    {upAvatar ? <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>جارٍ الرفع…</span> : <>
                      <Upload size={20} color="var(--text-3)" />
                      <div className="dropzone-sub">ارفع صورة المدرب</div>
                    </>}
                  </div>
                )}
              </div>

              <div className="field">
                <label>الاسم *</label>
                <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} placeholder="اسم المدرب بالعربية" />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>البريد الإلكتروني {!editCoach && '*'}</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="coach@example.com" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>كلمة المرور {editCoach ? '(اتركها فارغة لعدم التغيير)' : '*'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={editCoach ? 'كلمة مرور جديدة…' : '6 أحرف على الأقل'} />
                </div>
              </div>

              <div className="field">
                <label>نبذة مختصرة</label>
                <textarea rows={3} value={form.bioAr} onChange={(e) => setForm((f) => ({ ...f, bioAr: e.target.value }))} placeholder="نبذة عن المدرب وخبرته…" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>نشط</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>يظهر المدرب وإسمه في التطبيق</div>
                </div>
                <div className={`switch ${form.isActive ? 'on' : ''}`} onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
                  <div className="switch-knob" />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.nameAr}>
                {saving ? 'جارٍ الحفظ…' : editCoach ? 'حفظ التغييرات' : 'إضافة المدرب'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
