'use client';
import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { ChannelDataProvider } from './ChannelDataProvider';
import DashboardSidebar from './DashboardSidebar';
import Toast from './Toast';

const DASHBOARD_ROUTES = [
  '/dashboard',
  '/subscriptions',
  '/feeds',
  '/discover',
  '/analytics',
  '/settings',
];

function DashboardInner({ children }) {
  const { user } = useAuth();
  return (
    <ChannelDataProvider user={user}>
      <div className="app-shell">
        <DashboardSidebar />
        <div className="app-content" id="appContent">
          {children}
        </div>
        <Toast />
      </div>
    </ChannelDataProvider>
  );
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );

  if (!isDashboard) return children;

  return (
    <AuthProvider>
      <DashboardInner>{children}</DashboardInner>
    </AuthProvider>
  );
}
