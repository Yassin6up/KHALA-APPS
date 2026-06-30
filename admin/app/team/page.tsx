'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ShieldCheck, Shield, Eye } from 'lucide-react';
import { adminFetch, fileUrl } from '../lib/api';
import { appColor } from '../lib/app-context';
import { getStoredUser, ROLE_LABEL } from '../lib/auth';

interface Admin {
  id: string; email: string; name: string; role: string;
  isActive: boolean; lastLoginAt: string | null; createdAt: string;
}
interface Form { name: string; email: string; password: string; role: string; isActive: boolean; }
const emptyForm: Form = { name: '', email: '', password: '', role: 'admin', isActive: true };

const ROLES = [
  { key: 'super_admin', label: 'مدير عام', icon: ShieldCheck, desc: 'صلاحية كاملة + إدارة الفريق', badge: 'badge-purple' },
  { key: 'admin', label: 'مدير', icon: Shield, desc: 'إدارة محتوى التطبيقات', badge: 'badge-blue' },
  { key: 'viewer', label: 'مشاهد', icon: Eye, desc: 'اطّلاع فقط', badge: 'badge-gray' },
];
const roleMeta = (r: string) => ROLES.find((x) => x.key === r) ?? ROLES[1];
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ar-OM', { year: 'numeric', month: 'short', day: 'numeric' }) : 'لم يدخل بعد';

export default function TeamPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [edit, setEdit] = useState<Admin | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const me = getStoredUser();

  async function load() {
    setLoading(true);
    try { setAdmins(await adminFetch('/admin/auth/admins')); }
    catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEdit(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(a: Admin) { setEdit(a); setForm({ name: a.name, email: a.email, password: '', role: a.role, isActive: a.isActive }); setShowModal(true); }

  async function handleSave() {
    setSaving(true);
    try {
      if (edit) {
        const payload: any = { name: form.name, role: form.role, isActive: form.isActive };
        if (form.password) payload.password = form.password;
        await adminFetch(`/admin/auth/admins/${edit.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/admin/auth/admins', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowModal(false); await load();
    } catch (e) { alert('خطأ: ' + (e as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`حذف المدير "${name}"؟`)) return;
    try { await adminFetch(`/admin/auth/admins/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { alert('خطأ: ' + (e as Error).message); }
  }

  return (
    <div>
      <div className="page-head">
        <div style={{ color: 'var(--text-2)', fontSize: 14 }}>{admins.length.toLocaleString('ar')} عضو في الفريق</div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={17} /> إضافة مدير</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>العضو</th><th>الدور</th><th>الحالة</th><th>آخر دخول</th><th style={{ textAlign: 'left' }}>إجراءات</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : admins.map((a) => {
              const rm = roleMeta(a.role);
              const isSelf = me?.id === a.id;
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div className="avatar" style={{ width: 38, height: 38, background: appColor(a.email), fontSize: 14 }}>{a.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{a.name} {isSelf && <span style={{ fontSize: 11, color: 'var(--brand)' }}>(أنت)</span>}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${rm.badge}`}><rm.icon size={13} />{rm.label}</span></td>
                  <td><span className={`badge ${a.isActive ? 'badge-green' : 'badge-gray'}`}><span className="badge-dot" style={{ background: a.isActive ? 'var(--green)' : '#98A2B3' }} />{a.isActive ? 'مفعّل' : 'معطّل'}</span></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{fmtDate(a.lastLoginAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-start' }}>
                      <button className="icon-btn" onClick={() => openEdit(a)}><Pencil size={15} /></button>
                      {!isSelf && <button className="icon-btn danger" onClick={() => handleDelete(a.id, a.name)}><Trash2 size={15} /></button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="modal-title">{edit ? 'تعديل المدير' : 'مدير جديد'}</div>
                <div className="modal-sub">امنح صلاحيات الوصول للوحة التحكم</div>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={17} /></button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label>الاسم</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="اسم المدير" />
              </div>
              <div className="field">
                <label>البريد الإلكتروني</label>
                <input type="email" value={form.email} disabled={!!edit} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="admin@khala.app" />
              </div>
              <div className="field">
                <label>{edit ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>

              <div className="field">
                <span className="field-label">الدور والصلاحيات</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ROLES.map((r) => (
                    <div key={r.key}
                      onClick={() => setForm((f) => ({ ...f, role: r.key }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, cursor: 'pointer',
                        border: `1.5px solid ${form.role === r.key ? 'var(--brand)' : 'var(--border-2)'}`,
                        background: form.role === r.key ? 'var(--brand-soft)' : 'var(--surface)',
                      }}>
                      <r.icon size={20} color={form.role === r.key ? 'var(--brand)' : 'var(--text-3)'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{r.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.desc}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${form.role === r.key ? 'var(--brand)' : 'var(--border-2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {form.role === r.key && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--brand)' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {edit && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>الحساب مفعّل</div>
                  <div className={`switch ${form.isActive ? 'on' : ''}`} onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}><div className="switch-knob" /></div>
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.email || (!edit && !form.password)}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
