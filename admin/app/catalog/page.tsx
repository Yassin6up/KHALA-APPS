'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { adminFetch, adminUpload, fileUrl } from '../lib/api';
import { useApp } from '../lib/app-context';

interface CatalogItem {
  id: string; type: string; section: string; titleAr: string; descAr: string | null;
  coverUrl: string | null; priceMinor: number; currency: string;
  capacity: number | null; isPublished: boolean; createdAt: string;
  _count: { bookings: number };
}
interface ItemForm {
  titleAr: string; descAr: string; type: string; section: string;
  coverUrl: string; priceMinor: string; currency: string; capacity: string; isPublished: boolean;
}
const emptyForm: ItemForm = {
  titleAr: '', descAr: '', type: 'service', section: 'venues',
  coverUrl: '', priceMinor: '', currency: 'OMR', capacity: '', isPublished: true,
};

const SECTIONS = [
  { key: 'venues', label: 'قاعات', color: '#E8488B' },
  { key: 'photography', label: 'تصوير', color: '#0EA5E9' },
  { key: 'decor', label: 'ديكور', color: '#F5B301' },
  { key: 'catering', label: 'ضيافة', color: '#10B981' },
  { key: 'gifts', label: 'هدايا', color: '#EC4899' },
  { key: 'production', label: 'إنتاج', color: '#8B5CF6' },
];

export default function CatalogPage() {
  const { appKey } = useApp();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [upCover, setUpCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true); setError('');
    try { setItems(await adminFetch(`/admin/catalog?appKey=${appKey}`)); }
    catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  useEffect(() => { if (appKey) load(); }, [appKey]);

  function openCreate() { setEditItem(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(item: CatalogItem) {
    setEditItem(item);
    setForm({
      titleAr: item.titleAr, descAr: item.descAr ?? '', type: item.type,
      section: item.section, coverUrl: item.coverUrl ?? '',
      priceMinor: (item.priceMinor / 1000).toString(),
      currency: item.currency, capacity: item.capacity?.toString() ?? '',
      isPublished: item.isPublished,
    });
    setShowModal(true);
  }

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUpCover(true);
    try { const { url } = await adminUpload(file); setForm((f) => ({ ...f, coverUrl: fileUrl(url) })); }
    catch (err) { alert('فشل رفع الصورة: ' + (err as Error).message); } finally { setUpCover(false); }
  }

  async function handleSave() {
    if (!form.titleAr.trim()) { alert('أدخل العنوان'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        priceMinor: form.priceMinor ? Math.round(parseFloat(form.priceMinor) * 1000) : 0,
        capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
        descAr: form.descAr || undefined,
        coverUrl: form.coverUrl || undefined,
      };
      if (editItem) await adminFetch(`/admin/catalog/${editItem.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/admin/catalog', { method: 'POST', body: JSON.stringify({ ...payload, appKey }) });
      setShowModal(false); await load();
    } catch (e) { alert('خطأ: ' + (e as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا العنصر نهائياً؟')) return;
    try { await adminFetch(`/admin/catalog/${id}`, { method: 'DELETE' }); await load(); }
    catch (e) { alert('خطأ: ' + (e as Error).message); }
  }

  async function togglePublish(item: CatalogItem) {
    try {
      await adminFetch(`/admin/catalog/${item.id}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !item.isPublished }) });
      await load();
    } catch (e) { alert('خطأ: ' + (e as Error).message); }
  }

  const secMeta = (key: string) => SECTIONS.find((s) => s.key === key) ?? { key, label: key, color: '#6B7280' };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-h1">السوق — الكتالوج</div>
          <div className="page-desc">إدارة خدمات ومنتجات السوق</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> إضافة عنصر</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>العنصر</th><th>الفئة</th><th>السعر</th><th>الطلبات</th><th>الحالة</th><th style={{ textAlign: 'left' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6}><div className="empty">لا توجد عناصر — أضف أول خدمة في السوق</div></td></tr>
            ) : items.map((item) => {
              const sec = secMeta(item.section);
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt="" className="thumb" style={{ width: 48, height: 48 }} />
                      ) : (
                        <div className="thumb" style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sec.color + '18' }}>
                          <ShoppingBag size={20} color={sec.color} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.titleAr}</div>
                        {item.descAr && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.descAr}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: sec.color + '18', color: sec.color }}>{sec.label}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{(item.priceMinor / 1000).toFixed(3)} {item.currency}</td>
                  <td><span className="badge badge-blue">{item._count.bookings} طلب</span></td>
                  <td>
                    <button onClick={() => togglePublish(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {item.isPublished
                        ? <><Eye size={14} color="var(--green)" /><span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--green)' }}>منشور</span></>
                        : <><EyeOff size={14} color="var(--text-3)" /><span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>مخفي</span></>}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-start' }}>
                      <button className="icon-btn" onClick={() => openEdit(item)}><Pencil size={15} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(item.id)}><Trash2 size={15} /></button>
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
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-head">
              <div>
                <div className="modal-title">{editItem ? 'تعديل العنصر' : 'إضافة عنصر جديد'}</div>
                <div className="modal-sub">خدمة أو منتج في سوق فرح</div>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={17} /></button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label>العنوان *</label>
                <input value={form.titleAr} onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))} placeholder="اسم الخدمة أو المنتج" />
              </div>

              <div className="field">
                <label>الوصف</label>
                <textarea rows={2} value={form.descAr} onChange={(e) => setForm((f) => ({ ...f, descAr: e.target.value }))} placeholder="وصف مختصر…" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>الفئة</label>
                  <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}>
                    {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>النوع</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="service">خدمة</option>
                    <option value="product">منتج</option>
                    <option value="venue">قاعة</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>السعر</label>
                  <input type="number" step="0.001" min="0" value={form.priceMinor} onChange={(e) => setForm((f) => ({ ...f, priceMinor: e.target.value }))} placeholder="0.000" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>العملة</label>
                  <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                    <option value="OMR">OMR</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>الطاقة الاستيعابية</label>
                  <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} placeholder="اختياري" />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div className="field" style={{ margin: 0 }}>
                  <label>صورة الغلاف</label>
                  <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadCover} />
                  {form.coverUrl ? (
                    <div style={{ position: 'relative', marginTop: 6 }}>
                      <img src={form.coverUrl} alt="غلاف" className="thumb" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                      <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', bottom: 8, left: 8 }} onClick={() => coverRef.current?.click()}>
                        <Upload size={13} /> تغيير
                      </button>
                    </div>
                  ) : (
                    <div className="dropzone" onClick={() => coverRef.current?.click()} style={{ marginTop: 6 }}>
                      {upCover ? <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>جارٍ الرفع…</span> : <>
                        <Upload size={22} color="var(--text-3)" />
                        <div className="dropzone-title">ارفع صورة الغلاف</div>
                        <div className="dropzone-sub">JPG, PNG, WebP — حتى 10MB</div>
                      </>}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12, marginTop: 16 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>نشر العنصر</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>يظهر للمستخدمين في السوق</div>
                </div>
                <div className={`switch ${form.isPublished ? 'on' : ''}`} onClick={() => setForm((f) => ({ ...f, isPublished: !f.isPublished }))}>
                  <div className="switch-knob" />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.titleAr}>
                {saving ? 'جارٍ الحفظ…' : editItem ? 'حفظ التغييرات' : 'إضافة'}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
