'use client';
import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthProvider';
import { ChannelDataProvider } from './ChannelDataProvider';
import DashboardSidebar from './DashboardSidebar';

// Routes that use the dashboard shell (sidebar + content area)
const DASHBOARD_ROUTES = [
  '/dashboard',
  '/subscriptions',
  '/feeds',
  '/discover',
  '/analytics',
  '/settings',
];

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );

  if (!isDashboard) {
    // Non-dashboard pages (landing, blog, signin) — render without shell
    return children;
  }

  return (
    <AuthProvider>
      <ChannelDataProvider>
        <div className="app-shell">
          <DashboardSidebar />
          <div className="app-content" id="appContent">
            {children}
          </div>
        </div>
      </ChannelDataProvider>
    </AuthProvider>
  );
}
