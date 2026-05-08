'use client';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/issues': 'Issues',
  '/sessions': 'Sessions',
  '/settings': 'Settings',
};

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // For solve pages, don't use the main layout
  if (pathname.startsWith('/solve/')) {
    return <>{children}</>;
  }

  const title = pageTitles[pathname] || 'DevPilot AI';

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[260px]">
        <Topbar title={title} />
        <div className="p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}