'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Plus, Pencil, Trash2, X, Upload, MessagesSquare, Globe, Users2, Building2, ImageIcon,
} from 'lucide-react';
import { adminFetch, adminUpload, fileUrl } from '../lib/api';
import { useApp } from '../lib/app-context';

interface Room {
  id: string; nameAr: string; type: string; imageUrl: string | null;
  isActive: boolean; createdAt: string; _count: { members: number; messages: number };
}
interface RoomForm { nameAr: string; type: string; imageUrl: string; isActive: boolean; }
const emptyForm: RoomForm = { nameAr: '', type: 'public', imageUrl: '', isActive: true };

const TYPES = [
  { key: 'public', label: 'عام', icon: Globe },
  { key: 'cohort', label: 'مجموعة', icon: Users2 },
  { key: 'org', label: 'مؤسسة', icon: Building2 },
];
const typeMeta: Record<string, { label: string; badge: string }> = {
  public: { label: 'عام', badge: 'badge-blue' },
  cohort: { label: 'مجموعة', badge: 'badge-purple' },
  org: { label: 'مؤسسة', badge: 'badge-yellow' },
};

export default function CommunityPage() {
  const { appKey, reloadApps } = useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      setRooms(await adminFetch(`/admin/rooms?appKey=${appKey}`));
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }
  useEffect(() => { if (appKey) load(); }, [appKey]);

  function openCreate() { setEditRoom(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(r: Room) {
    setEditRoom(r);
    setForm({ nameAr: r.nameAr, type: r.type, imageUrl: r.imageUrl ?? '', isActive: r.isActive });
    setShowModal(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await adminUpload(file);
      setForm((f) => ({ ...f, imageUrl: fileUrl(url) }));
    } catch (err) { alert('فشل رفع الصورة: ' + (err as Error).message); } finally { setUploading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editRoom) await adminFetch(`/admin/rooms/${editRoom.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      else await adminFetch('/admin/rooms', { method: 'POST', body: JSON.stringify({ ...form, appKey }) });
      setShowModal(false);
      await load();
      reloadApps();
    } catch (e) { alert('خطأ: ' + (e as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذه الغرفة؟')) return;
    try { await adminFetch(`/admin/rooms/${id}`, { method: 'DELETE' }); await load(); reloadApps(); }
    catch (e) { alert('خطأ: ' + (e as Error).message); }
  }

  return (
    <div>
      <div className="page-head">
        <div />
        <button className="btn btn-primary" onClick={openCreate}><Plus size={17} /> إضافة غرفة</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>الغرفة</th><th>النوع</th><th>الأعضاء</th><th>الرسائل</th><th>الحالة</th><th style={{ textAlign: 'left' }}>إجراءات</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : rooms.length === 0 ? (
              <tr><td colSpan={6}><div className="empty">لا توجد غرف — أنشئ أول غرفة</div></td></tr>
            ) : rooms.map((room) => (
              <tr key={room.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    {room.imageUrl
                      ? <img src={room.imageUrl} alt={room.nameAr} className="thumb" style={{ width: 38, height: 38 }} />
                      : <div className="thumb" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-soft)' }}><MessagesSquare size={18} color="var(--brand)" /></div>}
                    <span style={{ fontWeight: 700 }}>{room.nameAr}</span>
                  </div>
                </td>
                <td><span className={`badge ${typeMeta[room.type]?.badge ?? 'badge-gray'}`}>{typeMeta[room.type]?.label ?? room.type}</span></td>
                <td>{room._count.members.toLocaleString('ar')}</td>
                <td>{room._count.messages.toLocaleString('ar')}</td>
                <td><span className={`badge ${room.isActive ? 'badge-green' : 'badge-gray'}`}><span className="badge-dot" style={{ background: room.isActive ? 'var(--green)' : '#98A2B3' }} />{room.isActive ? 'نشطة' : 'معطلة'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-start' }}>
                    <button className="icon-btn" onClick={() => openEdit(room)}><Pencil size={15} /></button>
                    <button className="icon-btn danger" onClick={() => handleDelete(room.id)}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="modal-title">{editRoom ? 'تعديل الغرفة' : 'غرفة مجتمع جديدة'}</div>
                <div className="modal-sub">أنشئ مساحة نقاش لمستخدمي التطبيق</div>
              </div>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={17} /></button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label>اسم الغرفة</label>
                <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} placeholder="مثال: تطوير الذات" />
              </div>

              <div className="field">
                <span className="field-label">نوع الغرفة</span>
                <div className="seg">
                  {TYPES.map((t) => (
                    <div key={t.key} className={`seg-item ${form.type === t.key ? 'active' : ''}`} onClick={() => setForm((f) => ({ ...f, type: t.key }))}>
                      <t.icon size={20} color={form.type === t.key ? 'var(--brand)' : 'var(--text-3)'} />
                      <span className="seg-item-label">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <span className="field-label">صورة الغرفة</span>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                {form.imageUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={form.imageUrl} alt="معاينة" className="thumb" style={{ width: 64, height: 64 }} />
                    <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? 'جارٍ الرفع…' : 'تغيير الصورة'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}>إزالة</button>
                  </div>
                ) : (
                  <div className="dropzone" onClick={() => fileRef.current?.click()}>
                    {uploading ? <span style={{ fontSize: 13, color: 'var(--text-2)' }}>جارٍ الرفع…</span> : <>
                      <Upload size={22} color="var(--text-3)" />
                      <div className="dropzone-title">ارفع صورة الغرفة</div>
                      <div className="dropzone-sub">PNG · JPG · WEBP</div>
                    </>}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 12 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>الغرفة نشطة</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>ظاهرة للمستخدمين في التطبيق</div>
                </div>
                <div className={`switch ${form.isActive ? 'on' : ''}`} onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}>
                  <div className="switch-knob" />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.nameAr}>{saving ? 'جارٍ الحفظ…' : 'حفظ الغرفة'}</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
