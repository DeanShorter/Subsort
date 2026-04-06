'use client';
import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { ChannelDataProvider } from './ChannelDataProvider';
import DashboardSidebar from './DashboardSidebar';
import HealthSnapshotManager from './HealthSnapshotManager';
import Toast from './Toast';

const DASHBOARD_ROUTES = [
  '/home',
  '/subscriptions',
  '/feeds',
  '/discover',
  '/stash',
  '/critic',
  '/analytics',
  '/settings',
  '/blog',
];

// Routes that show the sidebar even without auth
const ALWAYS_SIDEBAR = [
  '/home', '/subscriptions', '/feeds', '/discover', '/stash', '/critic', '/analytics', '/settings',
];

function DashboardInner({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const showSidebar = user || ALWAYS_SIDEBAR.some(r => pathname === r || pathname.startsWith(r + '/'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Redirect users without profiles to onboarding
  useEffect(() => {
    if (!user) { setProfileChecked(true); return; }

    (async () => {
      const { data: profile } = await (await import('../../lib/supabase')).supabase
        .from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!profile) {
        // No profile — redirect to onboarding
        window.location.href = '/onboarding';
        return;
      }
      setProfileChecked(true);
    })();
  }, [user]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Show blank screen while checking profile
  if (!profileChecked) {
    return <div style={{ background: '#fff', minHeight: '100vh' }} />;
  }

  return (
    <ChannelDataProvider user={user}>
      <HealthSnapshotManager />
      <div className="app-shell">
        {/* Mobile topbar — only visible at ≤640px */}
        {showSidebar && (
          <div className="mobile-topbar">
            <button className="mobile-hamburger" onClick={() => setMobileOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <Link href="/home" className="mobile-topbar-brand" style={{ textDecoration: 'none' }}>
              <img src="/icon.svg" alt="Subsnub" style={{ width: 28, height: 28 }} />
            </Link>
          </div>
        )}

        {/* Mobile backdrop */}
        {showSidebar && (
          <div
            className={`mobile-nav-backdrop${mobileOpen ? ' show' : ''}`}
            onClick={closeMobile}
          />
        )}

        {showSidebar && (
          <DashboardSidebar
            mobileOpen={mobileOpen}
            onMobileClose={closeMobile}
          />
        )}
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
