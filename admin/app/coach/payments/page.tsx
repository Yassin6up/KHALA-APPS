'use client';

import { useEffect, useState } from 'react';
import { CreditCard, TrendingUp } from 'lucide-react';
import { coachFetch } from '../../lib/coach-auth';

type Payment = {
  id: string; scheduledAt: string; durationMin: number; status: string;
  app: { nameAr: string };
};

export default function CoachPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [priceSAR, setPriceSAR] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coachFetch<Payment[]>('/coach-portal/payments').then(setPayments).catch(() => []),
      coachFetch<any>('/coach-portal/me').then((d) => setPriceSAR(d.priceSAR ?? 0)).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  const total = payments.length * priceSAR;
  const done = payments.filter((p) => p.status === 'done').length;
  const confirmed = payments.filter((p) => p.status === 'confirmed').length;

  return (
    <div style={{ padding: 32 }}>
      <div className="page-head">
        <div>
          <div className="page-h1">المدفوعات</div>
          <div className="page-desc">الجلسات المؤكدة والمكتملة التي تحقق دخلاً</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: TrendingUp, color: '#2EC5B6', bg: '#E7F9F7', label: 'إجمالي الإيرادات المتوقعة', val: `${total.toFixed(3)} ر.ع` },
          { icon: CreditCard, color: '#10B981', bg: '#E7F8F1', label: 'جلسات مكتملة', val: done },
          { icon: CreditCard, color: '#6C8BFF', bg: '#EEF1FF', label: 'جلسات مؤكدة (قادمة)', val: confirmed },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '20px 18px', boxShadow: '0 2px 8px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 26, color: '#131826' }}>{s.val}</div>
            <div style={{ fontSize: 13, color: '#5A6473' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {priceSAR > 0 && (
        <div style={{ background: '#EAF1FE', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 13.5, color: '#3B82F6', fontWeight: 600 }}>
          💡 سعر جلستك الحالي: {priceSAR} ر.ع — يمكنك تغييره من صفحة "الجلسات والمواعيد"
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>تاريخ الجلسة</th><th>الوقت (عُمان)</th><th>المدة</th><th>الحالة</th><th>الإيراد</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="empty">جارٍ التحميل…</div></td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6}><div className="empty">لا توجد مدفوعات بعد</div></td></tr>
            ) : payments.map((p, i) => {
              const d = new Date(p.scheduledAt);
              return (
                <tr key={p.id}>
                  <td style={{ color: '#98A2B3', fontSize: 13 }}>{i + 1}</td>
                  <td>{d.toLocaleDateString('ar-OM', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Muscat' })}</td>
                  <td>{d.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Muscat' })}</td>
                  <td>{p.durationMin} دق</td>
                  <td>
                    <span className={`badge ${p.status === 'done' ? 'badge-green' : 'badge-blue'}`}>
                      {p.status === 'done' ? 'مكتملة' : 'مؤكدة'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: '#10B981' }}>{priceSAR.toFixed(3)} ر.ع</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
