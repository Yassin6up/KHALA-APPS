'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Video, FileText, Eye, EyeOff } from 'lucide-react';
import { coachFetch, coachUpload } from '../../lib/coach-auth';
import { fileUrl } from '../../lib/api';

type Course = {
  id: string; titleAr: string; descAr?: string; type: string;
  url?: string; coverUrl?: string; duration?: number;
  isDownloadable: boolean; isPublished: boolean; requiredEntitlement?: string;
};
type Form = {
  titleAr: string; descAr: string; type: string; url: string;
  coverUrl: string; duration: string; isDownloadable: boolean;
  requiredEntitlement: string; isPublished: boolean;
};
const empty: Form = {
  titleAr: '', descAr: '', type: 'video', url: '', coverUrl: '',
  duration: '', isDownloadable: false, requiredEntitlement: '', isPublished: false,
};

export default function CoachCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [upCover, setUpCover] = useState(false);
  const [upFile, setUpFile] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setCourses(await coachFetch<Course[]>('/coach-portal/courses').catch(() => []));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(empty); setShowModal(true); }
  function openEdit(c: Course) {
    setEditing(c);
    setForm({
      titleAr: c.titleAr, descAr: c.descAr ?? '', type: c.type, url: c.url ?? '',
      coverUrl: c.coverUrl ?? '', duration: c.duration?.toString() ?? '',
      isDownloadable: c.isDownloadable, requiredEntitlement: c.requiredEntitlement ?? '',
      isPublished: c.isPublished,
    });
    setShowModal(true);
  }

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUpCover(true);
    try { const { url } = await coachUpload(file); setForm((f) => ({ ...f, coverUrl: fileUrl(url) })); }
    catch (err) { alert('فشل رفع الصورة: ' + (err as Error).message); } finally { setUpCover(false); }
  }

  async function uploadContent(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUpFile(true);
    try { const { url } = await coachUpload(file); setForm((f) => ({ ...f, url: fileUrl(url) })); }
    catch (err) { alert('فشل رفع الملف: ' + (err as Error).message); } finally { setUpFile(false); }
  }

  async function handleSave() {
    if (!form.titleAr.trim()) { alert('أدخل عنوان المحتوى'); return; }
    setSaving(true);
    try {
      const payload: any = {
        titleAr: form.titleAr, descAr: form.descAr || undefined, type: form.type,
        url: form.url || undefined, coverUrl: form.coverUrl || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        isDownloadable: form.isDownloadable, isPublished: form.isPublished,
        requiredEntitlement: form.requiredEntitlement || undefined,
      };
      if (editing) {
        await coachFetch(`/coach-portal/courses/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await coachFetch('/coach-portal/courses', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false); await load();
    } catch (e) { alert('خطأ: ' + (e as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا المحتوى نهائياً؟')) return;
    await coachFetch(`/coach-portal/courses/${id}`, { method: 'DELETE' }).catch((e) => alert(e.message));
    await load();
  }

  return (
    <div style={{ padding: 32 }}>
      <div className="page-head">
        <div>
          <div className="page-h1">المحتوى والدورات</div>
          <div className="page-desc">أضف فيديوهاتك وملفاتك PDF ومواد التدريب</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> محتوى جديد</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>المحتوى</th><th>النوع</th><th>المدة</th><th>الحالة</th><th style={{ textAlign: 'left' }}>إجراءات</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={5}><div className="empty">لا يوجد محتوى — أضف أول دورة أو فيديو</div></td></tr>
            ) : courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {c.coverUrl
                      ? <img src={c.coverUrl} alt="" className="thumb" style={{ width: 48, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      : <div className="thumb" style={{ width: 48, height: 36, borderRadius: 8, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {c.type === 'pdf' ? <FileText size={18} color="var(--brand)" /> : <Video size={18} color="var(--brand)" />}
                        </div>
                    }
                    <div>
                      <div style={{ fontWeight: 700 }}>{c.titleAr}</div>
                      {c.descAr && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{c.descAr.slice(0, 50)}{c.descAr.length > 50 ? '…' : ''}</div>}
                    </div>
                  </div>
                </td>
                <td><span className={`badge badge-${c.type === 'pdf' ? 'blue' : 'green'}`}>{c.type === 'pdf' ? 'PDF' : 'فيديو'}</span></td>
                <td>{c.duration ? `${Math.floor(c.duration / 60)} دق` : '—'}</td>
                <td>{c.isPublished ? <span className="badge badge-green">منشور</span> : <span className="badge badge-gray">مسودة</span>}</td>
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
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <div>
                <div className="modal-title">{editing ? 'تعديل المحتوى' : 'محتوى جديد'}</div>
                <div className="modal-sub">ارفع فيديو أو PDF وأضف تفاصيله</div>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={17} /></button>
            </div>
            <div className="modal-body">
              {/* Cover */}
              <div className="field">
                <label>صورة الغلاف</label>
                <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadCover} />
                {form.coverUrl ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                    <img src={form.coverUrl} alt="" style={{ width: 80, height: 54, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--brand)' }} />
                    <button className="btn btn-ghost btn-sm" onClick={() => coverRef.current?.click()}><Upload size={13} /> تغيير</button>
                  </div>
                ) : (
                  <div className="dropzone" style={{ marginTop: 6 }} onClick={() => coverRef.current?.click()}>
                    {upCover ? <span style={{ fontSize: 12, color: 'var(--text-2)' }}>جارٍ الرفع…</span> : <><Upload size={20} color="var(--text-3)" /><div className="dropzone-sub">ارفع صورة غلاف</div></>}
                  </div>
                )}
              </div>

              <div className="field">
                <label>العنوان *</label>
                <input value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} placeholder="عنوان المحتوى بالعربية" />
              </div>

              <div className="field">
                <label>وصف مختصر</label>
                <textarea rows={2} value={form.descAr} onChange={(e) => setForm((f) => ({ ...f, descAr: e.target.value }))} placeholder="وصف قصير عن المحتوى…" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>النوع</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="video">فيديو</option>
                    <option value="pdf">PDF</option>
                    <option value="material">مادة تدريبية</option>
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>المدة (ثواني)</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="مثال: 1800 = 30 دقيقة" />
                </div>
              </div>

              {/* File upload */}
              <div className="field">
                <label>{form.type === 'pdf' ? 'ملف PDF' : 'ملف الفيديو'} أو رابط</label>
                <input ref={fileRef} type="file" accept={form.type === 'pdf' ? '.pdf' : 'video/*'} style={{ display: 'none' }} onChange={uploadContent} />
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://… أو ارفع الملف" style={{ flex: 1 }} />
                  <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} style={{ flexShrink: 0 }}>
                    {upFile ? 'جارٍ الرفع…' : <><Upload size={13} /> رفع</>}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <input type="checkbox" checked={form.isDownloadable} onChange={(e) => setForm((f) => ({ ...f, isDownloadable: e.target.checked }))} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>قابل للتحميل</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>نشر للمستخدمين</span>
                </label>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.titleAr}>
                {saving ? 'جارٍ الحفظ…' : editing ? 'حفظ التغييرات' : 'إضافة المحتوى'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
