'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { ChannelDataProvider } from './ChannelDataProvider';
import DashboardSidebar from './DashboardSidebar';

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
      </div>
    </ChannelDataProvider>
  );
}

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // During SSR and first render, just pass children through
  if (!mounted) return children;

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
