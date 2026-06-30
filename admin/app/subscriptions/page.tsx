'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, XCircle, AlertTriangle } from 'lucide-react';
import { adminFetch } from '../lib/api';
import { useApp, appColor } from '../lib/app-context';

interface Plan { id: string; nameAr: string; code: string; interval: string; priceMinor: number; currency: string; }
interface User { id: string; fullName: string | null; email: string | null; phone: string | null; }
interface Subscription {
  id: string; status: string; source: string; currentPeriodEnd: string | null;
  createdAt: string; user: User; plan: Plan;
}

const statusConfig: Record<string, { label: string; badge: string; icon: React.FC<any>; color: string }> = {
  active: { label: 'نشط', badge: 'badge-green', icon: CheckCircle2, color: '#10B981' },
  trialing: { label: 'تجريبي', badge: 'badge-yellow', icon: Clock3, color: '#F59E0B' },
  canceled: { label: 'ملغي', badge: 'badge-red', icon: XCircle, color: '#EF4444' },
  past_due: { label: 'متأخر', badge: 'badge-red', icon: AlertTriangle, color: '#EF4444' },
};
const sourceLabel: Record<string, string> = { apple: 'Apple', google: 'Google', thawani: 'ثواني', manual: 'يدوي' };
const fmtPrice = (minor: number, currency: string) => `${(minor / 1000).toFixed(3)} ${currency}`;
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('ar-OM', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export default function SubscriptionsPage() {
  const { appKey } = useApp();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appKey) return;
    setLoading(true);
    adminFetch(`/admin/subscriptions?appKey=${appKey}`)
      .then(setSubs).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [appKey]);

  const counts = subs.reduce((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div>
      {/* Summary cards */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <div key={key} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="stat-ico" style={{ background: `${cfg.color}18` }}><cfg.icon size={20} color={cfg.color} /></div>
              <span style={{ fontSize: 28, fontWeight: 800, color: cfg.color }}>{(counts[key] ?? 0).toLocaleString('ar')}</span>
            </div>
            <div className="stat-label" style={{ marginTop: 12 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>المستخدم</th><th>الخطة</th><th>الحالة</th><th>المصدر</th><th>نهاية الفترة</th><th>الإنشاء</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={6}><div className="empty">لا توجد اشتراكات</div></td></tr>
            ) : subs.map((sub) => {
              const sc = statusConfig[sub.status] ?? { label: sub.status, badge: 'badge-gray' };
              const userName = sub.user.fullName ?? sub.user.email ?? sub.user.phone ?? 'مجهول';
              return (
                <tr key={sub.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 34, height: 34, background: appColor(userName), fontSize: 13 }}>{userName.slice(0, 2)}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{userName}</div>
                        {sub.user.email && <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{sub.user.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.plan.nameAr}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {fmtPrice(sub.plan.priceMinor, sub.plan.currency)} / {sub.plan.interval === 'month' ? 'شهر' : 'سنة'}
                    </div>
                  </td>
                  <td><span className={`badge ${sc.badge}`}>{sc.label}</span></td>
                  <td><span className="badge badge-gray">{sourceLabel[sub.source] ?? sub.source}</span></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{fmtDate(sub.currentPeriodEnd)}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{fmtDate(sub.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
