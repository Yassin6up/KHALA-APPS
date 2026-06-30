'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import {
  LayoutDashboard, BookOpen, CalendarDays, CreditCard,
  Settings, LogOut, User, ChevronLeft,
} from 'lucide-react';
import { isCoachAuthed, getCoachUser, coachLogout } from '../lib/coach-auth';

const NAV = [
  { href: '/coach/dashboard', icon: LayoutDashboard, label: 'لوحة القيادة' },
  { href: '/coach/courses',   icon: BookOpen,         label: 'المحتوى والدورات' },
  { href: '/coach/sessions',  icon: CalendarDays,     label: 'الجلسات والمواعيد' },
  { href: '/coach/payments',  icon: CreditCard,       label: 'المدفوعات' },
  { href: '/coach/settings',  icon: Settings,         label: 'الإعدادات' },
];

function CoachSidebar() {
  const pathname = usePathname();
  const coach = getCoachUser();

  return (
    <div style={S.sidebar}>
      {/* Brand */}
      <div style={S.brand}>
        <div style={S.brandLogo}>
          <span style={{ fontWeight: 800, fontSize: 22, color: '#fff' }}>ق</span>
        </div>
        <div>
          <div style={S.brandName}>بوابة المدرب</div>
          <div style={S.brandSub}>KHALA Coach</div>
        </div>
      </div>

      {/* Coach info */}
      {coach && (
        <div style={S.coachChip}>
          <div style={S.coachAvatar}>
            {coach.avatarUrl
              ? <img src={coach.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
              : <User size={18} color="#2EC5B6" />}
          </div>
          <div>
            <div style={S.coachName}>{coach.nameAr}</div>
            <div style={S.coachEmail}>{coach.email}</div>
          </div>
        </div>
      )}

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

      {/* Nav */}
      <nav style={S.nav}>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <a key={item.href} href={item.href} style={{ ...S.navItem, ...(active ? S.navActive : {}) }}>
              <item.icon size={18} color={active ? '#2EC5B6' : '#8A94A8'} />
              <span style={{ color: active ? '#fff' : '#8A94A8', fontWeight: active ? 700 : 400 }}>{item.label}</span>
              {active && <ChevronLeft size={14} style={{ marginRight: 'auto' }} color="#2EC5B6" />}
            </a>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Logout */}
      <button onClick={coachLogout} style={S.logoutBtn}>
        <LogOut size={16} color="#8A94A8" />
        <span style={{ color: '#8A94A8', fontSize: 14 }}>تسجيل الخروج</span>
      </button>
    </div>
  );
}

export default function CoachLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isCoachAuthed()) {
      router.replace('/start');
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F1729', color: '#8A94A8' }}>
        جارٍ التحميل…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6FB', fontFamily: 'Cairo, sans-serif' }}>
      <CoachSidebar />
      <div style={{ marginRight: 260, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 260, background: '#0F1729', position: 'fixed', top: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column', gap: 4, padding: '20px 12px', zIndex: 40,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px 12px' },
  brandLogo: {
    width: 44, height: 44, borderRadius: 14,
    background: 'linear-gradient(135deg, #2EC5B6, #6C8BFF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  brandName: { color: '#fff', fontWeight: 700, fontSize: 15 },
  brandSub: { color: '#8A94A8', fontSize: 11, marginTop: 1 },
  coachChip: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', margin: '4px 0',
  },
  coachAvatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(46,197,182,0.15)', border: '1.5px solid #2EC5B6',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
  },
  coachName: { color: '#fff', fontWeight: 600, fontSize: 13.5 },
  coachEmail: { color: '#8A94A8', fontSize: 11, marginTop: 1 },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
    borderRadius: 12, textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s',
  },
  navActive: { background: 'rgba(46,197,182,0.1)', border: '1px solid rgba(46,197,182,0.2)' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
    background: 'none', border: 'none', cursor: 'pointer', borderRadius: 12, width: '100%',
    marginBottom: 8,
  },
};
