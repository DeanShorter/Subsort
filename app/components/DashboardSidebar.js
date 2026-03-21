'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 9l4-4 4 4M3 5v10a2 2 0 002 2h10a2 2 0 002-2V5' },
  { href: '/subscriptions', label: 'Subscriptions', icon: 'M2 4h12M2 8h8M2 12h10' },
  { href: '/feeds', label: 'Feeds', icon: 'M3 4h10M3 8h6M3 12h8' },
  { href: '/discover', label: 'Discover', icon: 'M8 8m-6 0a6 6 0 1012 0 6 6 0 10-12 0M10.5 5.5l-1 3.5-3.5 1 1-3.5z', viewBox: '0 0 16 16' },
  { href: '/analytics', label: 'Analytics', icon: 'M2 12l3-4 3 2 4-6 2 2M2 2h12v12H2z', viewBox: '0 0 16 16' },
];

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: 'M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2zM12 15a3 3 0 100-6 3 3 0 000 6z', viewBox: '0 0 24 24' },
  { href: '/blog', label: 'Blog', icon: 'M3 4h10M3 8h6M3 12h8' },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, signIn, signOut } = useAuth();

  return (
    <nav className="home-nav-primary">
      <div className="hnp-inner">
        {/* Brand */}
        <Link href="/dashboard" className="topnav-brand" style={{ padding: '0 10px', marginBottom: '1rem' }}>
          <div className="topnav-logo">F</div>
          <span className="topnav-title">Freedly</span>
        </Link>

        {/* Main nav */}
        <div className="hnp-section">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`home-nav-item${isActive ? ' active' : ''}`}
              >
                <svg viewBox={item.viewBox || '0 0 16 16'}>
                  <path d={item.icon} />
                </svg>
                <span className="home-nav-item-label">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 16 }} />

        {/* Bottom nav */}
        <hr className="home-nav-divider" />
        <div className="hnp-section">
          {BOTTOM_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`home-nav-item${isActive ? ' active' : ''}`}
              >
                <svg viewBox={item.viewBox || '0 0 16 16'}>
                  <path d={item.icon} />
                </svg>
                <span className="home-nav-item-label">{item.label}</span>
              </Link>
            );
          })}

          {/* Auth button */}
          {user ? (
            <button className="home-nav-item" onClick={signOut}>
              <svg viewBox="0 0 16 16">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 12.5L14 8l-3.5-4.5M14 8H6" />
              </svg>
              <span className="home-nav-item-label">Sign Out</span>
            </button>
          ) : (
            <button className="home-nav-item" onClick={signIn}>
              <svg viewBox="0 0 16 16">
                <path d="M10 2h3a1 1 0 011 1v10a1 1 0 01-1 1h-3M6.5 12.5L3 8l3.5-4.5M3 8h8" />
              </svg>
              <span className="home-nav-item-label">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
