'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

const PAGE_ITEMS = [
  {
    href: '/dashboard', label: 'Dashboard',
    svg: <><path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1z"/><path d="M6 14V8h4v6"/></>,
  },
  {
    href: '/subscriptions', label: 'Subscriptions',
    svg: <><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12"/></>,
  },
  {
    href: '/feeds', label: 'Feeds',
    svg: <path d="M3 4h10M3 8h6M3 12h8"/>,
  },
  {
    href: '/discover', label: 'Discover',
    svg: <><circle cx="8" cy="8" r="6"/><path d="M10.5 5.5l-1 3.5-3.5 1 1-3.5z"/></>,
  },
  {
    href: '/analytics', label: 'Analytics',
    svg: <><path d="M2 12l3-4 3 2 4-6 2 2"/><rect x="2" y="2" width="12" height="12" rx="1.5"/></>,
  },
  {
    href: '/blog', label: 'Blog',
    svg: <path d="M3 4h10M3 8h6M3 12h8"/>,
  },
];

const SETTINGS_ITEMS = [
  {
    href: '/settings', label: 'Settings',
    svg: <><circle cx="8" cy="8" r="2"/><path d="M13.5 8a5.5 5.5 0 01-.3 1.8l1.3.8-.8 1.4-1.3-.8a5.5 5.5 0 01-1.5 1l.2 1.5h-1.6l.2-1.5a5.5 5.5 0 01-1.5-1l-1.3.8-.8-1.4 1.3-.8A5.5 5.5 0 016.5 8a5.5 5.5 0 01.3-1.8l-1.3-.8.8-1.4 1.3.8a5.5 5.5 0 011.5-1l-.2-1.5h1.6l-.2 1.5a5.5 5.5 0 011.5 1l1.3-.8.8 1.4-1.3.8a5.5 5.5 0 01.3 1.8z"/></>,
  },
];

function NavItem({ href, label, svg, isActive }) {
  return (
    <Link href={href} className={`home-nav-item${isActive ? ' active' : ''}`}>
      <svg viewBox="0 0 16 16">{svg}</svg>
      <span className="home-nav-item-label">{label}</span>
    </Link>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, signIn, signOut } = useAuth();

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="home-nav-primary">
      {/* Header */}
      <div className="hnp-header">
        <Link href="/dashboard" className="home-nav-brand" style={{ textDecoration: 'none' }}>
          <img src="/icon.svg" alt="Freedly" className="home-nav-brand-icon" />
          <span className="home-nav-brand-wordmark">
            <span>free</span><span className="hnp-wordmark-dly">dly</span>
          </span>
        </Link>
      </div>

      {/* Scrollable body */}
      <div className="hnp-body">
        {/* Pages section */}
        <div className="hnp-section">
          <div className="hnp-section-label">PAGES</div>
          {PAGE_ITEMS.map(item => (
            <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 16 }} />
        <hr className="home-nav-divider" />

        {/* Settings section */}
        <div className="hnp-section">
          {SETTINGS_ITEMS.map(item => (
            <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
          ))}

          {/* Auth */}
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
