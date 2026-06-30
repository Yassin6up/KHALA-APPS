'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Plus, Pencil, Trash2, X, Upload, PlayCircle, FileText, FolderOpen,
  Lock, Globe, Download, Clock,
} from 'lucide-react';
import { adminFetch, adminUpload, fileUrl } from '../lib/api';
import { useApp } from '../lib/app-context';

interface LibraryAsset {
  id: string; type: string; titleAr: string; descAr: string | null; url: string;
  coverUrl: string | null; duration: number | null; requiredEntitlement: string | null;
  isDownloadable: boolean; createdAt: string;
  coach: { id: string; nameAr: string } | null;
}
interface Coach { id: string; nameAr: string; specialtyAr: string | null }
interface AssetForm {
  titleAr: string; descAr: string; type: string; url: string; coverUrl: string;
  duration: string; requiredEntitlement: string; isDownloadable: boolean; coachId: string;
}
const emptyForm: AssetForm = { titleAr: '', descAr: '', type: 'video', url: '', coverUrl: '', duration: '', requiredEntitlement: '', isDownloadable: false, coachId: '' };

const TYPES = [
  { key: 'video', label: 'فيديو', icon: PlayCircle, color: '#3B82F6', accept: 'video/mp4', badge: 'badge-blue' },
  { key: 'pdf', label: 'ملف PDF', icon: FileText, color: '#EF4444', accept: 'application/pdf', badge: 'badge-red' },
  { key: 'material', label: 'مادة/تمرين', icon: FolderOpen, color: '#10B981', accept: 'application/pdf,image/*', badge: 'badge-green' },
];
const typeMeta = (t: string) => TYPES.find((x) => x.key === t) ?? { label: t, icon: FolderOpen, color: '#6B7280', accept: '*', badge: 'badge-gray' };

export default function LibraryPage() {
  const { appKey, reloadApps } = useApp();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState<LibraryAsset | null>(null);
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [upFile, setUpFile] = useState(false);
  const [upCover, setUpCover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try { setAssets(await adminFetch(`/admin/library?appKey=${appKey}`)); }
    catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  useEffect(() => {
    if (!appKey) return;
    load();
    adminFetch(`/admin/coaches?appKey=${appKey}`).then(setCoaches).catch(() => []);
  }, [appKey]);

  function openCreate() { setEditAsset(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(a: LibraryAsset) {
    setEditAsset(a);
    setForm({
      titleAr: a.titleAr, descAr: a.descAr ?? '', type: a.type, url: a.url, coverUrl: a.coverUrl ?? '',
      duration: a.duration?.toString() ?? '', requiredEntitlement: a.requiredEntitlement ?? '',
      isDownloadable: a.isDownloadable, coachId: a.coach?.id ?? '',
    });
    setShowModal(true);
  }

  async function uploadInto(e: React.ChangeEvent<HTMLInputElement>, key: 'url' | 'coverUrl', setBusy: (b: boolean) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { const { url } = await adminUpload(file); setForm((f) => ({ ...f, [key]: fileUrl(url) })); }
    catch (err) { alert('فشل الرفع: ' + (err as Error).message); } finally { setBusy(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: form.duration ? parseInt(form.duration, 10) : undefined,
        requiredEntitlement: form.requiredEntitlement || null,
        descAr: form.descAr || undefined,
        coverUrl: form.coverUrl || undefined,
        coachId: form.coachId || null,
      };
      if (editAsset) await adminFetch(`/admin/library/${editAsset.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/admin/library', { method: 'POST', body: JSON.stringify({ ...payload, appKey }) });
      setShowModal(false); await load(); reloadApps();
    } catch (e) { alert('خطأ: ' + (e as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذا المحتوى؟')) return;
    try { await adminFetch(`/admin/library/${id}`, { method: 'DELETE' }); await load(); reloadApps(); }
    catch (e) { alert('خطأ: ' + (e as Error).message); }
  }

  const tm = typeMeta(form.type);

  return (
    <div>
      <div className="page-head">
        <div />
        <button className="btn btn-primary" onClick={openCreate}><Plus size={17} /> إضافة محتوى</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>المحتوى</th><th>النوع</th><th>المدرب</th><th>الوصول</th><th>المدة</th><th style={{ textAlign: 'left' }}>إجراءات</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={7}><div className="empty">لا يوجد محتوى — أضف أول مادة للمكتبة</div></td></tr>
            ) : assets.map((a) => {
              const m = typeMeta(a.type);
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      {a.coverUrl
                        ? <img src={a.coverUrl} alt={a.titleAr} className="thumb" style={{ width: 54, height: 38 }} />
                        : <div className="thumb" style={{ width: 54, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${m.color}14` }}><m.icon size={18} color={m.color} /></div>}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{a.titleAr}</div>
                        {a.descAr && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.descAr}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${m.badge}`}><m.icon size={13} />{m.label}</span></td>
                  <td>{a.coach ? <span className="badge badge-blue">{a.coach.nameAr}</span> : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}</td>
                  <td>
                    {a.requiredEntitlement
                      ? <span className="badge badge-purple"><Lock size={12} /> مميز</span>
                      : <span className="badge badge-green"><Globe size={12} /> مجاني</span>}
                  </td>
                  <td>{a.duration ? `${a.duration.toLocaleString('ar')} د` : '—'}</td>
                  <td><span className={`badge ${a.isDownloadable ? 'badge-blue' : 'badge-gray'}`}>{a.isDownloadable ? 'متاح' : 'لا'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-start' }}>
                      <button className="icon-btn" onClick={() => openEdit(a)}><Pencil size={15} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(a.id)}><Trash2 size={15} /></button>
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
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-head">
              <div>
                <div className="modal-title">{editAsset ? 'تعديل المحتوى' : 'محتوى جديد للمكتبة'}</div>
                <div className="modal-sub">فيديو أو ملف PDF أو مادة تعليمية</div>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={17} /></button>
            </div>

            <div className="modal-body">
              {/* Type picker */}
              <div className="field">
                <span className="field-label">نوع المحتوى</span>
                <div className="seg">
                  {TYPES.map((t) => (
                    <div key={t.key} className={`seg-item ${form.type === t.key ? 'active' : ''}`} onClick={() => setForm((f) => ({ ...f, type: t.key }))}>
                      <t.icon size={20} color={form.type === t.key ? t.color : 'var(--text-3)'} />
                      <span className="seg-item-label">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>العنوان</label>
                <input value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} placeholder="عنوان المحتوى" />
              </div>

              <div className="field">
                <label>الوصف</label>
                <textarea rows={2} value={form.descAr} onChange={(e) => setForm((f) => ({ ...f, descAr: e.target.value }))} placeholder="وصف مختصر للمحتوى…" />
              </div>

              {/* File + cover dropzones side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <span className="field-label">ملف المحتوى</span>
                  <input ref={fileRef} type="file" accept={tm.accept} style={{ display: 'none' }} onChange={(e) => uploadInto(e, 'url', setUpFile)} />
                  {form.url ? (
                    <div style={{ padding: 12, border: '1.5px solid var(--brand)', borderRadius: 12, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <tm.icon size={18} color={tm.color} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>تم الرفع</span>
                      <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>تغيير</button>
                    </div>
                  ) : (
                    <div className="dropzone" onClick={() => fileRef.current?.click()} style={{ padding: 14 }}>
                      {upFile ? <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>جارٍ الرفع…</span> : <>
                        <Upload size={20} color="var(--text-3)" />
                        <div className="dropzone-sub">ارفع الملف</div>
                      </>}
                    </div>
                  )}
                </div>

                <div className="field" style={{ margin: 0 }}>
                  <span className="field-label">صورة الغلاف</span>
                  <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => uploadInto(e, 'coverUrl', setUpCover)} />
                  {form.coverUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img src={form.coverUrl} alt="غلاف" className="thumb" style={{ width: '100%', height: 76 }} />
                      <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', bottom: 6, left: 6 }} onClick={() => coverRef.current?.click()}>تغيير</button>
                    </div>
                  ) : (
                    <div className="dropzone" onClick={() => coverRef.current?.click()} style={{ padding: 14 }}>
                      {upCover ? <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>جارٍ الرفع…</span> : <>
                        <Upload size={20} color="var(--text-3)" />
                        <div className="dropzone-sub">ارفع الغلاف</div>
                      </>}
                    </div>
                  )}
                </div>
              </div>

              {/* Coach + access + duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>المدرب (اختياري)</label>
                  <select value={form.coachId} onChange={(e) => setForm((f) => ({ ...f, coachId: e.target.value }))}>
                    <option value="">بدون مدرب</option>
                    {coaches.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>مستوى الوصول</label>
                  <select value={form.requiredEntitlement} onChange={(e) => setForm((f) => ({ ...f, requiredEntitlement: e.target.value }))}>
                    <option value="">مجاني للجميع</option>
                    <option value="library_premium">مميز (للمشتركين)</option>
                  </select>
                </div>
              </div>
              {form.type === 'video' && (
                <div className="field" style={{ marginTop: 12 }}>
                  <label>المدة (دقائق)</label>
                  <input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="30" />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12, marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Download size={17} color="var(--text-2)" />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>قابل للتحميل</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>السماح بحفظ المحتوى دون اتصال</div>
                  </div>
                </div>
                <div className={`switch ${form.isDownloadable ? 'on' : ''}`} onClick={() => setForm((f) => ({ ...f, isDownloadable: !f.isDownloadable }))}>
                  <div className="switch-knob" />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.titleAr || !form.url}>{saving ? 'جارٍ الحفظ…' : 'حفظ المحتوى'}</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
