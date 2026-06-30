'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { isAuthed } from '../lib/auth';
import { AppProvider, useApp } from '../lib/app-context';
import Sidebar from './Sidebar';

const TITLES: Record<string, { title: string; sub: string }> = {
  '/': { title: 'لوحة المعلومات', sub: 'نظرة عامة على كامل المنصة' },
  '/apps': { title: 'التطبيقات', sub: 'إدارة تطبيقات منصة KHALA' },
  '/community': { title: 'المجتمع', sub: 'غرف النقاش والمجتمع' },
  '/library': { title: 'المكتبة', sub: 'الفيديوهات والملفات والمواد' },
  '/users': { title: 'المستخدمون', sub: 'إدارة مستخدمي التطبيق' },
  '/subscriptions': { title: 'الاشتراكات', sub: 'الخطط والاشتراكات النشطة' },
  '/team': { title: 'فريق الإدارة', sub: 'صلاحيات وحسابات المدراء' },
};

function Topbar() {
  const pathname = usePathname();
  const { currentApp } = useApp();
  const meta = TITLES[pathname] ?? { title: '', sub: '' };
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{meta.title}</div>
        <div className="topbar-sub">{meta.sub}</div>
      </div>
      {currentApp && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--green)' }} />
          {currentApp.nameAr}
        </div>
      )}
    </div>
  );
}

function AuthedShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <div className="shell">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="page-body">{children}</div>
        </div>
      </div>
    </AppProvider>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isLogin = pathname === '/login';
  const isCoachPortal = pathname === '/start' || pathname === '/coach' || pathname.startsWith('/coach/');

  useEffect(() => {
    if (isLogin || isCoachPortal) { setReady(true); return; }
    if (!isAuthed()) { router.replace('/login'); return; }
    setReady(true);
  }, [pathname, isLogin, isCoachPortal, router]);

  if (isLogin || isCoachPortal) return <>{children}</>;
  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
        جارٍ التحميل…
      </div>
    );
  }
  return <AuthedShell>{children}</AuthedShell>;
}
