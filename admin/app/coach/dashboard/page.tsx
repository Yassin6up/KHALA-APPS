'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, TrendingUp, Users, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { coachFetch, getCoachUser } from '../../lib/coach-auth';
import { fileUrl } from '../../lib/api';

type Analytics = {
  totalSessions: number; upcomingSessions: number;
  coursesCount: number; doneSessions: number; estimatedRevenue: number;
};
type Session = {
  id: string; scheduledAt: string; durationMin: number; status: string;
  notesAr?: string; meetingUrl?: string;
};

const DAY_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function CoachDashboard() {
  const coach = getCoachUser();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [upcoming, setUpcoming] = useState<Session[]>([]);

  useEffect(() => {
    coachFetch<Analytics>('/coach-portal/analytics').then(setAnalytics).catch(() => null);
    coachFetch<Session[]>('/coach-portal/sessions')
      .then((s) => setUpcoming(s.filter((x) => x.status === 'scheduled' || x.status === 'confirmed').slice(0, 5)))
      .catch(() => []);
  }, []);

  const stats = analytics ? [
    { icon: CalendarDays, color: '#2EC5B6', bg: '#E7F9F7', label: 'الجلسات القادمة', val: analytics.upcomingSessions },
    { icon: CheckCircle,  color: '#10B981', bg: '#E7F8F1', label: 'جلسات مكتملة',   val: analytics.doneSessions },
    { icon: BookOpen,     color: '#6C8BFF', bg: '#EEF1FF', label: 'المحتوى والدورات', val: analytics.coursesCount },
    { icon: TrendingUp,   color: '#F59E0B', bg: '#FEF6E7', label: 'الإيرادات المتوقعة', val: `${analytics.estimatedRevenue.toFixed(0)} ر.ع` },
  ] : [];

  return (
    <div style={S.root}>
      {/* Welcome */}
      <div style={S.welcome}>
        <div>
          <div style={S.welcomeTitle}>مرحباً، {coach?.nameAr ?? 'مدرب'} 👋</div>
          <div style={S.welcomeSub}>هذه نظرة عامة على نشاطك اليوم</div>
        </div>
        <a href="/coach/sessions" style={S.cta}>
          <CalendarDays size={16} />
          إدارة المواعيد
        </a>
      </div>

      {/* Stats */}
      <div style={S.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} style={S.statCard}>
            <div style={{ ...S.statIcon, background: s.bg }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div style={S.statVal}>{s.val}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={S.grid2}>
        {/* Upcoming sessions */}
        <div style={S.panel}>
          <div style={S.panelHead}>
            <CalendarDays size={18} color="#2EC5B6" />
            <span style={S.panelTitle}>الجلسات القادمة</span>
            <a href="/coach/sessions" style={S.panelLink}>عرض الكل <ArrowLeft size={13} /></a>
          </div>
          {upcoming.length === 0 ? (
            <div style={S.empty}>لا توجد جلسات قادمة</div>
          ) : upcoming.map((s) => {
            const d = new Date(s.scheduledAt);
            return (
              <div key={s.id} style={S.sessionRow}>
                <div style={S.sessionDate}>
                  <div style={S.sessionDay}>{DAY_AR[d.getDay()]}</div>
                  <div style={S.sessionTime}>{d.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Muscat' })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={S.sessionDur}>{s.durationMin} دقيقة · {d.toLocaleDateString('ar-OM', { month: 'short', day: 'numeric', timeZone: 'Asia/Muscat' })}</div>
                  {s.notesAr && <div style={S.sessionNote} title={s.notesAr}>{s.notesAr.slice(0, 60)}{s.notesAr.length > 60 ? '…' : ''}</div>}
                </div>
                <span style={{ ...S.statusBadge, ...(s.status === 'confirmed' ? S.badgeGreen : S.badgeBlue) }}>
                  {s.status === 'confirmed' ? 'مؤكدة' : 'محجوزة'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick guide */}
        <div style={S.panel}>
          <div style={S.panelHead}>
            <TrendingUp size={18} color="#6C8BFF" />
            <span style={S.panelTitle}>دليل سريع</span>
          </div>
          <div style={S.guideList}>
            {[
              { step: '١', title: 'أضف محتواك', desc: 'ارفع فيديو أو PDF من صفحة "المحتوى والدورات"', href: '/coach/courses' },
              { step: '٢', title: 'حدد مواعيدك', desc: 'اضبط أيام وأوقات توافرك من صفحة الجلسات', href: '/coach/sessions' },
              { step: '٣', title: 'أنشئ رابط Google Meet', desc: 'افتح meet.google.com ← اجتماع جديد ← انسخ الرابط', href: 'https://meet.google.com', target: '_blank' },
              { step: '٤', title: 'ضع الرابط في الجلسة', desc: 'عند وصول حجز، ألصق الرابط في حقل "رابط الاجتماع"', href: '/coach/sessions' },
            ].map((g) => (
              <a key={g.step} href={g.href} target={(g as any).target} style={S.guideItem}>
                <div style={S.guideStep}>{g.step}</div>
                <div>
                  <div style={S.guideTitle}>{g.title}</div>
                  <div style={S.guideDesc}>{g.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  root: { padding: 32, display: 'flex', flexDirection: 'column', gap: 24 },
  welcome: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  welcomeTitle: { fontWeight: 800, fontSize: 24, color: '#131826' },
  welcomeSub: { fontSize: 14, color: '#5A6473', marginTop: 4 },
  cta: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
    background: '#2EC5B6', color: '#fff', borderRadius: 10, textDecoration: 'none',
    fontWeight: 700, fontSize: 14,
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  statCard: {
    background: '#fff', borderRadius: 16, padding: '20px 18px',
    boxShadow: '0 2px 8px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', gap: 10,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statVal: { fontWeight: 800, fontSize: 26, color: '#131826' },
  statLabel: { fontSize: 13, color: '#5A6473' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  panel: {
    background: '#fff', borderRadius: 16, padding: 24,
    boxShadow: '0 2px 8px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', gap: 12,
  },
  panelHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  panelTitle: { fontWeight: 700, fontSize: 16, color: '#131826', flex: 1 },
  panelLink: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#2EC5B6', textDecoration: 'none', fontWeight: 600 },
  empty: { textAlign: 'center', color: '#98A2B3', fontSize: 14, padding: '20px 0' },
  sessionRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
    borderBottom: '1px solid #EAEDF3',
  },
  sessionDate: { textAlign: 'center', minWidth: 52 },
  sessionDay: { fontWeight: 700, fontSize: 13, color: '#131826' },
  sessionTime: { fontSize: 12, color: '#2EC5B6', fontWeight: 600 },
  sessionDur: { fontSize: 13, color: '#5A6473' },
  sessionNote: { fontSize: 12, color: '#98A2B3', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 },
  statusBadge: { fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '3px 10px' },
  badgeBlue: { background: '#EAF1FE', color: '#3B82F6' },
  badgeGreen: { background: '#E7F8F1', color: '#10B981' },
  guideList: { display: 'flex', flexDirection: 'column', gap: 8 },
  guideItem: {
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
    background: '#FAFBFD', borderRadius: 12, textDecoration: 'none',
    border: '1px solid #EAEDF3', cursor: 'pointer',
  },
  guideStep: {
    width: 28, height: 28, borderRadius: '50%',
    background: 'linear-gradient(135deg,#2EC5B6,#6C8BFF)',
    color: '#fff', fontWeight: 800, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  guideTitle: { fontWeight: 700, fontSize: 13.5, color: '#131826' },
  guideDesc: { fontSize: 12, color: '#5A6473', marginTop: 3, lineHeight: 1.5 },
};
