'use client';
import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import { ChannelDataProvider } from './ChannelDataProvider';
import DashboardSidebar from './DashboardSidebar';
import OnboardingFlow from './OnboardingFlow';
import Toast from './Toast';

const DASHBOARD_ROUTES = [
  '/home',
  '/subscriptions',
  '/feeds',
  '/discover',
  '/stash',
  '/analytics',
  '/settings',
  '/blog',
];

// Routes that show the sidebar even without auth
const ALWAYS_SIDEBAR = [
  '/home', '/subscriptions', '/feeds', '/discover', '/stash', '/analytics', '/settings',
];

function DashboardInner({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const showSidebar = user || ALWAYS_SIDEBAR.some(r => pathname === r || pathname.startsWith(r + '/'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Check if there's a pending onboarding step (returning from OAuth)
    if (localStorage.getItem('subsort_onboarding_step')) return true;
    // Check if onboarding was already completed
    return !localStorage.getItem('subsort_onboarding_done');
  });

  const closeMobile = useCallback(() => setMobileOpen(false), []);



  return (
    <ChannelDataProvider user={user}>
      <div className="app-shell">
        <OnboardingFlow
          visible={showOnboarding && !!user}
          onComplete={() => setShowOnboarding(false)}
        />
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
            suppressAutoSync={showOnboarding}
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
