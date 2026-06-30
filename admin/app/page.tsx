'use client';

import { useEffect, useState } from 'react';
import {
  Users, CreditCard, Library, MessagesSquare, TrendingUp, ArrowUpRight, Boxes,
} from 'lucide-react';
import { adminFetch } from './lib/api';
import { useApp, appColor } from './lib/app-context';

interface Stats {
  users: number; rooms: number; messages: number; assets: number;
  subscriptions: number; activeSubs: number; plans: number;
  trend: { label: string; value: number }[];
}

const KPIS = [
  { key: 'users' as const, label: 'المستخدمون', icon: Users, color: '#2EC5B6', bg: 'rgba(46,197,182,0.12)' },
  { key: 'activeSubs' as const, label: 'اشتراكات نشطة', icon: CreditCard, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'assets' as const, label: 'أصول المكتبة', icon: Library, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { key: 'rooms' as const, label: 'غرف المجتمع', icon: MessagesSquare, color: '#6C8BFF', bg: 'rgba(108,139,255,0.12)' },
];

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, padding: '8px 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{d.value.toLocaleString('ar')}</div>
          <div
            title={`${d.value}`}
            style={{
              width: '100%', maxWidth: 46,
              height: `${(d.value / max) * 100}%`, minHeight: 4,
              background: 'linear-gradient(180deg, #2EC5B6, #6C8BFF)',
              borderRadius: 8, transition: 'height .4s ease',
            }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { appKey, apps, currentApp, setAppKey } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appKey) return;
    setStats(null);
    adminFetch(`/admin/stats?appKey=${appKey}`).then(setStats).catch((e) => setError(e.message));
  }, [appKey]);

  const totalUsers = apps.reduce((s, a) => s + a.stats.users, 0);

  return (
    <div>
      {error && <div className="alert-error">{error}</div>}

      {/* Per-app KPIs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="app-logo" style={{ background: appColor(appKey), width: 28, height: 28, fontSize: 13 }}>
          {(currentApp?.nameAr ?? appKey).charAt(0)}
        </div>
        <div className="section-title" style={{ margin: 0 }}>إحصائيات {currentApp?.nameAr ?? appKey}</div>
      </div>

      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {KPIS.map((k) => (
          <div key={k.key} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="stat-ico" style={{ background: k.bg }}><k.icon size={21} color={k.color} /></div>
              <span className="stat-delta" style={{ color: 'var(--green)' }}><ArrowUpRight size={14} /> مباشر</span>
            </div>
            <div className="stat-value" style={{ color: k.color }}>
              {stats ? stats[k.key].toLocaleString('ar') : <span className="skel" style={{ display: 'inline-block', width: 60, height: 30 }} />}
            </div>
            <div className="stat-label" style={{ marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + secondary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <TrendingUp size={18} color="var(--brand)" />
            <div style={{ fontWeight: 800, fontSize: 15 }}>نمو المستخدمين</div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 12 }}>عدد المنضمّين خلال آخر ٦ أشهر</div>
          {stats ? <BarChart data={stats.trend} /> : <div className="skel" style={{ height: 180 }} />}
        </div>

        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>ملخص التطبيق</div>
          {[
            { label: 'إجمالي الرسائل', value: stats?.messages, color: '#8B5CF6' },
            { label: 'إجمالي الاشتراكات', value: stats?.subscriptions, color: '#10B981' },
            { label: 'الخطط المتاحة', value: stats?.plans, color: '#F59E0B' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 600 }}>{row.label}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: row.color }}>
                {row.value != null ? row.value.toLocaleString('ar') : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-app overview */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Boxes size={18} color="var(--brand)" />
          <div className="section-title" style={{ margin: 0 }}>جميع التطبيقات</div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{totalUsers.toLocaleString('ar')} مستخدم إجمالاً</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {apps.map((app) => (
          <div key={app.id} className="app-card" onClick={() => setAppKey(app.key)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="app-logo" style={{ background: appColor(app.key), width: 44, height: 44, borderRadius: 12, fontSize: 18 }}>
                {app.nameAr.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5 }}>{app.nameAr}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{app.nameEn}</div>
              </div>
              <span className={`badge ${app.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                {app.status === 'active' ? 'نشط' : app.status}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { l: 'مستخدم', v: app.stats.users },
                { l: 'اشتراك', v: app.stats.activeSubs },
                { l: 'مكتبة', v: app.stats.assets },
              ].map((s) => (
                <div key={s.l} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>{s.v.toLocaleString('ar')}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {apps.length === 0 && <div className="empty" style={{ gridColumn: '1/-1' }}>لا توجد تطبيقات بعد</div>}
      </div>
    </div>
  );
}
