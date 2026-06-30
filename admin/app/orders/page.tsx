'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { adminFetch } from '../lib/api';
import { useApp } from '../lib/app-context';

interface Booking {
  id: string; status: string; createdAt: string;
  user: { id: string; fullName: string | null; email: string; phone: string | null };
  item: { id: string; titleAr: string; coverUrl: string | null; priceMinor: number; currency: string };
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  reserved: { label: 'قيد المراجعة', cls: 'badge-yellow' },
  paid:     { label: 'مدفوع', cls: 'badge-green' },
  attended: { label: 'تم التسليم', cls: 'badge-blue' },
  canceled: { label: 'ملغى', cls: 'badge-red' },
};

const STATUS_FLOW = ['reserved', 'paid', 'attended', 'canceled'];
const FILTER_TABS = [{ key: 'all', label: 'الكل' }, ...STATUS_FLOW.map((s) => ({ key: s, label: STATUS_LABELS[s].label }))];

export default function OrdersPage() {
  const { appKey } = useApp();
  const [orders, setOrders] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      const url = filter === 'all'
        ? `/admin/orders?appKey=${appKey}`
        : `/admin/orders?appKey=${appKey}&status=${filter}`;
      setOrders(await adminFetch(url));
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }

  useEffect(() => { if (appKey) load(); }, [appKey, filter]);

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      await adminFetch(`/admin/orders/${orderId}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (e) { alert('خطأ: ' + (e as Error).message); } finally { setUpdating(null); }
  }

  const filterCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-h1">الطلبات</div>
          <div className="page-desc">تتبع وإدارة طلبات السوق</div>
        </div>
        <button className="btn btn-ghost" onClick={load}><RefreshCw size={15} /> تحديث</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTER_TABS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}>
            {f.label}
            {f.key !== 'all' && filterCounts[f.key] != null && (
              <span className="nav-badge" style={{ marginRight: 6 }}>{filterCounts[f.key]}</span>
            )}
          </button>
        ))}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>العنصر</th><th>المستخدم</th><th>السعر</th><th>التاريخ</th><th>الحالة</th><th style={{ textAlign: 'left' }}>تغيير الحالة</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty" style={{ flexDirection: 'column', gap: 8 }}>
                    <ClipboardList size={36} style={{ opacity: 0.35 }} />
                    <span>لا توجد طلبات في هذه الفئة</span>
                  </div>
                </td>
              </tr>
            ) : orders.map((o) => {
              const st = STATUS_LABELS[o.status] ?? STATUS_LABELS.reserved;
              return (
                <tr key={o.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {o.item.coverUrl ? (
                        <img src={o.item.coverUrl} alt="" className="thumb" style={{ width: 38, height: 38 }} />
                      ) : (
                        <div className="thumb" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-soft)', fontWeight: 700 }}>
                          {o.item.titleAr.charAt(0)}
                        </div>
                      )}
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{o.item.titleAr}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{o.user.fullName ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.user.email}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--brand)' }}>
                    {(o.item.priceMinor / 1000).toFixed(3)} {o.item.currency}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {new Date(o.createdAt).toLocaleDateString('ar', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                  <td>
                    <div className="field" style={{ margin: 0 }}>
                      <select
                        value={o.status}
                        disabled={updating === o.id || o.status === 'canceled'}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        style={{ opacity: updating === o.id ? 0.5 : 1, fontSize: 12 }}>
                        {STATUS_FLOW.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
