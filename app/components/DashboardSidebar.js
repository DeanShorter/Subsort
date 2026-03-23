'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useChannelData } from './ChannelDataContext';
import { syncYouTubeSubscriptions } from '../../lib/sync';
import { showToast } from './Toast';
import { trackEvent } from '../../lib/track';

// Routes that show the categories section in the sidebar
const CAT_ROUTES = ['/subscriptions', '/feeds', '/discover'];

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

export default function DashboardSidebar({ mobileOpen = false, onMobileClose }) {
  const pathname = usePathname();
  const { user, accessToken, userTier, signIn, signOut } = useAuth();
  const { channels, categories, subcategories, categoryColours, chHasCat, reload } = useChannelData();
  const [openCats, setOpenCats] = useState(new Set());
  const [activeCat, setActiveCat] = useState('all');
  const [activeSub, setActiveSub] = useState(null);
  const [feedCounts, setFeedCounts] = useState(null); // { all, favs, cats: { catName: count }, subs: { 'cat|sub': count } }
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleSync = useCallback(async () => {
    if (!accessToken || !user || syncing) return;

    // Throttle: check last sync (30 min cooldown)
    const lastSync = parseInt(localStorage.getItem('subsort_sync_ts') || '0');
    if (lastSync && channels.length > 0) {
      const elapsed = Date.now() - lastSync;
      if (elapsed < 30 * 60 * 1000) {
        const mins = Math.round(elapsed / 60000);
        showToast(`Synced ${mins} minute${mins !== 1 ? 's' : ''} ago — try again later.`, 3000);
        return;
      }
    }

    setSyncing(true);
    setSyncProgress({ label: 'Starting…', detail: '', pct: 0 });

    trackEvent('sync');
    try {
      const result = await syncYouTubeSubscriptions(
        accessToken, user.id, channels,
        (label, detail, pct) => setSyncProgress({ label, detail, pct })
      );
      // Reload data from DB to pick up new channels
      await reload();
      setSyncProgress({ label: 'Done!', detail: '', pct: 100 });
      showToast(`Synced! ${result.newCount} new channels, ${result.channels.length} total`);
      setTimeout(() => { setSyncProgress(null); setSyncing(false); }, 1500);
    } catch (e) {
      if (e.message === 'SESSION_EXPIRED') {
        showToast('YouTube session expired — please sign in again.');
        signIn();
      } else if (e.message?.includes('quota')) {
        showToast('YouTube API quota exceeded — resets at midnight PT.', 5000);
      } else {
        showToast('Sync failed: ' + e.message, 5000);
      }
      setSyncProgress(null);
      setSyncing(false);
    }
  }, [accessToken, user, channels, syncing, reload, signIn]);

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');
  const showCategories = CAT_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));

  // Reset category selection and feed counts when navigating
  useEffect(() => {
    if (!showCategories) { setActiveCat('all'); setActiveSub(null); }
    // Clear feed counts when leaving feeds page
    if (pathname !== '/feeds') setFeedCounts(null);
  }, [showCategories, pathname]);

  // Listen for feeds page to push video counts
  useEffect(() => {
    window.__subsortFeedCounts = (counts) => setFeedCounts(counts);
    return () => { delete window.__subsortFeedCounts; };
  }, []);

  // Expose scroll-to-categories for the Filters button
  useEffect(() => {
    window.__subsortScrollToCats = () => {
      const el = document.getElementById('sidebarCatsSection');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    return () => { delete window.__subsortScrollToCats; };
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className={`home-nav-primary${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Header */}
      <div className="hnp-header">
        <Link href="/dashboard" className="home-nav-brand" style={{ textDecoration: 'none' }}>
          <img src="/icon.svg" alt="Subscrub" className="home-nav-brand-icon" />
          <span className="home-nav-brand-wordmark">
            <span>sub</span><span className="hnp-wordmark">scrub</span>
          </span>
        </Link>
        {user && <span className={`tier-badge ${userTier}`}>{userTier}</span>}
        <button className="hnp-collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
          <svg viewBox="0 0 16 16"><path d="M10 4l-4 4 4 4" /></svg>
        </button>
        {/* Mobile close button */}
        <button className="mobile-nav-close" onClick={onMobileClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
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

        {/* Categories section — only on subscriptions & feeds */}
        {showCategories && categories.length > 0 && (
          <div className="hnp-section" id="sidebarCatsSection">
            <div className="hnp-section-label">CATEGORIES</div>
            <button className={`home-nav-item${activeCat === 'all' ? ' active' : ''}`} onClick={() => { setActiveCat('all'); setActiveSub(null); window.__subsortCat?.('all'); }}>
              <svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
              <span className="home-nav-item-label">All Categories</span>
              <span className="hnp-count">{feedCounts ? feedCounts.all : channels.length}</span>
            </button>
            <button className={`home-nav-item hnp-fav-btn${activeCat === '__favs__' ? ' active' : ''}`} onClick={() => { setActiveCat('__favs__'); setActiveSub(null); window.__subsortCat?.('__favs__'); }}>
              <svg viewBox="0 0 16 16"><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z"/></svg>
              <span className="home-nav-item-label">Favourites</span>
              <span className="hnp-count">{feedCounts ? feedCounts.favs : channels.filter(c => c.favourited).length}</span>
            </button>
            {categories.map(cat => {
              const subs = subcategories[cat] || [];
              const isOpen = openCats.has(cat);
              const toggleOpen = (e) => {
                e.stopPropagation();
                setOpenCats(prev => {
                  const next = new Set(prev);
                  if (next.has(cat)) next.delete(cat); else next.add(cat);
                  return next;
                });
              };

              return (
                <div key={cat} className={`hnp-cat-group${isOpen ? ' open' : ''}`}>
                  <button
                    className={`home-nav-item${activeCat === cat ? ' active' : ''}`}
                    onClick={() => { setActiveCat(cat); setActiveSub(null); window.__subsortCat?.(cat); }}
                  >
                    <span className="hnp-cat-dot" style={{ background: categoryColours[cat] || '#888' }} />
                    <span className="home-nav-item-label">{cat}</span>
                    <span className="hnp-count">{feedCounts ? (feedCounts.cats?.[cat] || 0) : channels.filter(c => chHasCat(c, cat)).length}</span>
                  </button>
                  {subs.length > 0 && (
                    <button className={`hnp-chevron-btn${isOpen ? ' open' : ''}`} onClick={toggleOpen}>
                      <svg className="hnp-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M4 6l4 4 4-4" /></svg>
                    </button>
                  )}
                  {subs.length > 0 && (
                    <div className="hnp-sub-items">
                      {subs.map(sub => (
                        <button
                          key={sub}
                          className={`hnp-sub-item${activeCat === cat && activeSub === sub ? ' active' : ''}`}
                          onClick={() => { setActiveCat(cat); setActiveSub(prev => prev === sub ? null : sub); window.__subsortSub?.(cat, sub); }}
                        >
                          <span className="home-nav-item-label">{sub}</span>
                          <span className="hnp-count">
                            {feedCounts ? (feedCounts.subs?.[`${cat}|${sub}`] || 0) : channels.filter(c => chHasCat(c, cat) && c.subcategory === sub).length}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: 16 }} />
        <hr className="home-nav-divider" />

        {/* Settings section */}
        <div className="hnp-section">
          {SETTINGS_ITEMS.map(item => (
            <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
          ))}

          {/* Sync */}
          {user && (
            <button className={`home-nav-item${syncing ? ' active' : ''}`} onClick={handleSync} disabled={syncing}>
              <svg viewBox="0 0 16 16" className={syncing ? 'spin' : ''}>
                <path d="M13.5 2.5v4h-4M2.5 13.5v-4h4" />
                <path d="M2.5 7.5a5.5 5.5 0 019.4-2.5M13.5 8.5a5.5 5.5 0 01-9.4 2.5" />
              </svg>
              <span className="home-nav-item-label">
                {syncProgress ? syncProgress.label : 'Sync'}
              </span>
            </button>
          )}

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
