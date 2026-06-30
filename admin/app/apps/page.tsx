'use client';

import { Users, CreditCard, Library, MessagesSquare, MessageCircle, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { useApp, appColor } from '../lib/app-context';

export default function AppsPage() {
  const { apps, appKey, setAppKey, loading } = useApp();

  const metrics = [
    { key: 'users' as const, label: 'المستخدمون', icon: Users, color: '#2EC5B6' },
    { key: 'activeSubs' as const, label: 'اشتراكات نشطة', icon: CheckCircle2, color: '#10B981' },
    { key: 'assets' as const, label: 'أصول المكتبة', icon: Library, color: '#F59E0B' },
    { key: 'rooms' as const, label: 'الغرف', icon: MessagesSquare, color: '#6C8BFF' },
    { key: 'messages' as const, label: 'الرسائل', icon: MessageCircle, color: '#8B5CF6' },
    { key: 'subscriptions' as const, label: 'كل الاشتراكات', icon: CreditCard, color: '#EC4899' },
  ];

  if (loading) {
    return <div style={{ display: 'grid', gap: 16 }}>{[1, 2].map((i) => <div key={i} className="skel" style={{ height: 180 }} />)}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {apps.map((app) => {
        const selected = app.key === appKey;
        return (
          <div key={app.id} className="card" style={{ padding: 24, borderColor: selected ? 'var(--brand)' : 'var(--border)', borderWidth: selected ? 2 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div className="app-logo" style={{ background: appColor(app.key), width: 52, height: 52, borderRadius: 14, fontSize: 22 }}>
                {app.nameAr.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{app.nameAr}</span>
                  <span className={`badge ${app.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {app.status === 'active' ? 'نشط' : app.status}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{app.nameEn} · <code style={{ fontFamily: 'monospace' }}>{app.key}</code></div>
              </div>
              <button
                className={selected ? 'btn btn-ghost' : 'btn btn-primary'}
                onClick={() => setAppKey(app.key)}
                disabled={selected}
              >
                <ArrowLeftRight size={16} />
                {selected ? 'محدّد حالياً' : 'إدارة هذا التطبيق'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
              {metrics.map((m) => (
                <div key={m.key} style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 12px' }}>
                  <m.icon size={18} color={m.color} />
                  <div style={{ fontSize: 21, fontWeight: 800, marginTop: 8, color: 'var(--text)' }}>
                    {app.stats[m.key].toLocaleString('ar')}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 600 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {apps.length === 0 && <div className="empty">لا توجد تطبيقات مسجّلة</div>}
    </div>
  );
}
