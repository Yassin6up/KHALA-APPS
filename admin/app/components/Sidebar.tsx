'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, LayoutGrid, MessagesSquare, Library, Users,
  CreditCard, ShieldCheck, ChevronsUpDown, LogOut, Check,
  ShoppingBag, ClipboardList, UserCheck,
} from 'lucide-react';
import { useApp, appColor } from '../lib/app-context';
import { getStoredUser, logout, ROLE_LABEL, AdminUser } from '../lib/auth';

const platformNav = [
  { label: 'لوحة المعلومات', href: '/', icon: LayoutDashboard },
  { label: 'التطبيقات', href: '/apps', icon: LayoutGrid },
];

const appNav = [
  { label: 'المجتمع', href: '/community', icon: MessagesSquare, stat: 'rooms' as const, onlyFor: undefined as string[] | undefined },
  { label: 'المكتبة', href: '/library', icon: Library, stat: 'assets' as const, onlyFor: ['qader'] },
  { label: 'المدربون', href: '/coaches', icon: UserCheck, stat: undefined, onlyFor: ['qader'] },
  { label: 'المستخدمون', href: '/users', icon: Users, stat: 'users' as const, onlyFor: undefined },
  { label: 'الاشتراكات', href: '/subscriptions', icon: CreditCard, stat: 'activeSubs' as const, onlyFor: undefined },
  { label: 'السوق (كتالوج)', href: '/catalog', icon: ShoppingBag, stat: undefined, onlyFor: ['farah'] },
  { label: 'الطلبات', href: '/orders', icon: ClipboardList, stat: undefined, onlyFor: ['farah'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { apps, appKey, setAppKey, currentApp } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setUser(getStoredUser()), []);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand-row">
        <div className="brand-mark">KH</div>
        <div>
          <div className="brand-name">KHALA</div>
          <div className="brand-tag">لوحة التحكم</div>
        </div>
      </div>

      {/* App switcher */}
      <div className="app-switch" ref={menuRef}>
        <div className="app-switch-btn" onClick={() => setMenuOpen((v) => !v)}>
          <div className="app-logo" style={{ background: appColor(currentApp?.key ?? appKey) }}>
            {(currentApp?.nameAr ?? appKey).charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="app-switch-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentApp?.nameAr ?? 'قادر'}
            </div>
            <div className="app-switch-key">{appKey}</div>
          </div>
          <ChevronsUpDown size={16} color="#8A94A8" />
        </div>

        {menuOpen && (
          <div className="app-menu">
            {apps.map((a) => (
              <div
                key={a.id}
                className="app-menu-item"
                onClick={() => { setAppKey(a.key); setMenuOpen(false); }}
              >
                <div className="app-logo" style={{ background: appColor(a.key), width: 26, height: 26, fontSize: 12 }}>
                  {a.nameAr.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{a.nameAr}</div>
                </div>
                {a.key === appKey && <Check size={15} color="#2EC5B6" />}
              </div>
            ))}
            {apps.length === 0 && (
              <div style={{ padding: 10, fontSize: 12, color: '#8A94A8' }}>لا توجد تطبيقات</div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-section">المنصة</div>
        {platformNav.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
            <item.icon size={18} className="nav-ico" />
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="nav-section">{currentApp?.nameAr ?? 'التطبيق'}</div>
        {appNav.filter((item) => !item.onlyFor || item.onlyFor.includes(appKey)).map((item) => {
          const count = currentApp?.stats?.[item.stat];
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
              <item.icon size={18} className="nav-ico" />
              <span>{item.label}</span>
              {count != null && count > 0 && <span className="nav-badge">{count.toLocaleString('ar')}</span>}
            </Link>
          );
        })}

        {user?.role === 'super_admin' && (
          <>
            <div className="nav-section">الإدارة</div>
            <Link href="/team" className={`nav-item ${isActive('/team') ? 'active' : ''}`}>
              <ShieldCheck size={18} className="nav-ico" />
              <span>فريق الإدارة</span>
            </Link>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="side-user">
        <div className="side-user-av">{(user?.name ?? 'A').charAt(0)}</div>
        <div style={{ minWidth: 0 }}>
          <div className="side-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
            {user?.name ?? 'مدير'}
          </div>
          <div className="side-user-role">{ROLE_LABEL[user?.role ?? 'admin']}</div>
        </div>
        <div className="side-logout" onClick={logout} title="تسجيل الخروج">
          <LogOut size={17} />
        </div>
      </div>
    </aside>
  );
}
