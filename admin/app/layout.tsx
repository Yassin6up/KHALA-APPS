import type { ReactNode } from 'react';
import './globals.css';
import AppShell from './components/AppShell';

export const metadata = {
  title: 'KHALA Admin',
  description: 'لوحة تحكم منصة KHALA متعددة التطبيقات',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
