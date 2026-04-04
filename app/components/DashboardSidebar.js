'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useChannelData } from './ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { syncYouTubeSubscriptions } from '../../lib/sync';
import { showToast } from './Toast';
import { trackEvent } from '../../lib/track';

// Routes that show the categories section in the sidebar
const CAT_ROUTES = [];

const PAGE_ITEMS = [
  {
    href: '/home', label: 'Home',
    dot: null, // custom 4-dot icon
    svg: <><rect x="2" y="2" width="5" height="5" rx="2" fill="#00A651" /><rect x="9" y="2" width="5" height="5" rx="2" fill="#FF8C42" /><rect x="2" y="9" width="5" height="5" rx="2" fill="#8B6FE8" /><rect x="9" y="9" width="5" height="5" rx="2" fill="#2D9CDB" /></>,
  },
  {
    href: '/subscriptions', label: 'Subscriptions',
    dot: '#00A651',
  },
  {
    href: '/feeds', label: 'Feed',
    dot: '#FF8C42',
  },
  {
    href: '/discover', label: 'Discover',
    dot: '#8B6FE8',
  },
  {
    href: '/stash', label: 'Stash',
    dot: '#2D9CDB',
  },
  {
    href: '/critic', label: 'The Critic',
    svg: <path d="M8 1.5l2 4 4.5.6-3.2 3.2.7 4.4L8 11.5l-4 2.2.7-4.4L1.5 6.1l4.5-.6z"/>,
    dotColor: '#00A651',
  },
  {
    href: '/analytics', label: 'Insights',
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

function NavItem({ href, label, svg, dot, isActive }) {
  const activeStyle = isActive && dot ? { background: dot, color: '#fff' } : undefined;
  return (
    <Link href={href} className={`home-nav-item${isActive ? ' active' : ''}`} style={activeStyle}>
      {dot ? (
        <span className="hnp-cat-dot" style={{ background: isActive ? '#fff' : dot }} />
      ) : (
        <svg viewBox="0 0 16 16">{svg}</svg>
      )}
      <span className="home-nav-item-label">{label}</span>
    </Link>
  );
}

export default function DashboardSidebar({ mobileOpen = false, onMobileClose, suppressAutoSync = false }) {
  const pathname = usePathname();
  const { user, accessToken, userTier, signIn, signOut } = useAuth();
  const { channels, categories, subcategories, categoryColours, chHasCat, reload } = useChannelData();
  const [openCats, setOpenCats] = useState(new Set());
  const [activeCat, setActiveCat] = useState('all');
  const [activeSub, setActiveSub] = useState(null);
  const [feedCounts, setFeedCounts] = useState(null); // { all, favs, cats: { catName: count }, subs: { 'cat|sub': count } }
  const [syncing, setSyncing] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [catsCollapsed, setCatsCollapsed] = useState(false);
  const autoSyncDone = useRef(false);


  // Auto-sync on login: silent background sync, no modal
  useEffect(() => {
    if (!user || autoSyncDone.current || syncing || suppressAutoSync) return;
    autoSyncDone.current = true;

    const FULL_SYNC_INTERVAL = 24 * 60 * 60 * 1000;
    const lastSync = parseInt(localStorage.getItem('subsort_sync_ts') || '0');
    const elapsed = Date.now() - lastSync;

    if (lastSync && elapsed < FULL_SYNC_INTERVAL) {
      console.log('[AutoSync] Last sync was', Math.round(elapsed / 60000), 'min ago — skipping');
      return;
    }

    (async () => {
      setSyncing(true);
      console.log('[AutoSync] Starting background sync…');

      // Step 1: Sync subscriptions
      if (accessToken) {
        try {
          const subResult = await syncYouTubeSubscriptions(accessToken, user.id, channels, () => {});
          await reload();
          console.log(`[AutoSync] Synced: ${subResult.newCount} new, ${subResult.channels.length} total`);
        } catch (e) {
          if (e.message === 'SESSION_EXPIRED') {
            console.warn('[AutoSync] YouTube token expired — signing out');
            setSyncing(false);
            showToast('Session expired — please sign in again.', 3000);
            setTimeout(() => signOut(), 1500);
            return;
          }
          console.warn('[AutoSync] Sync failed:', e.message);
        }
      }

      // Step 2: RSS refresh
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch('/api/refresh', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } });
        }
      } catch (e) {
        console.warn('[AutoSync] RSS refresh failed:', e.message);
      }

      // Save timestamps
      window.dispatchEvent(new Event('subsnub:rss-refreshed'));
      localStorage.setItem('subsort_sync_ts', String(Date.now()));
      localStorage.setItem('subsort_rss_ts', String(Date.now()));
      await reload();
      setSyncing(false);
      trackEvent('sync', { source: 'auto' });
      console.log('[AutoSync] Complete');
    })();
  }, [accessToken, user]);

  const handleSync = useCallback(async () => {
    if (!accessToken || !user || syncing) return;

    // Tier-based daily sync limits: free=1, pro=5, admin=unlimited
    const maxSyncs = userTier === 'admin' ? Infinity : userTier === 'pro' ? 5 : 1;
    const today = new Date().toDateString();
    const syncLog = JSON.parse(localStorage.getItem('subsort_sync_log') || '{}');
    const todaySyncs = syncLog.date === today ? (syncLog.count || 0) : 0;

    if (todaySyncs >= maxSyncs) {
      if (userTier === 'free') {
        showToast('Free tier: 1 sync per day. Upgrade to Pro for 5 daily syncs.', 5000);
      } else {
        showToast(`You've used all ${maxSyncs} syncs for today. Resets at midnight.`, 4000);
      }
      return;
    }

    setSyncing(true);
    setSyncProgress({ label: 'Starting…', detail: '', pct: 0 });

    trackEvent('sync');
    try {
      const result = await syncYouTubeSubscriptions(
        accessToken, user.id, channels,
        (label, detail, pct) => setSyncProgress({ label, detail, pct })
      );
      await reload();
      // Track daily sync count
      const syncLogAfter = JSON.parse(localStorage.getItem('subsort_sync_log') || '{}');
      const todayAfter = new Date().toDateString();
      const countAfter = syncLogAfter.date === todayAfter ? (syncLogAfter.count || 0) + 1 : 1;
      localStorage.setItem('subsort_sync_log', JSON.stringify({ date: todayAfter, count: countAfter }));
      localStorage.setItem('subsort_sync_ts', String(Date.now()));
      setSyncProgress({ label: 'Done!', detail: '', pct: 100 });
      showToast(`Synced! ${result.newCount} new channels, ${result.channels.length} total`);
      setTimeout(() => { setSyncProgress(null); setSyncing(false); }, 1500);
    } catch (e) {
      if (e.message === 'SESSION_EXPIRED') {
        showToast('Session expired — please sign in again.', 3000);
        setTimeout(() => signOut(), 1500);
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
    // Clear feed counts and uncollapse cats when leaving feeds page
    if (pathname !== '/feeds') { setFeedCounts(null); setCatsCollapsed(false); }
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
    window.__subsortCollapseCats = (hide) => setCatsCollapsed(hide);
    return () => { delete window.__subsortScrollToCats; delete window.__subsortCollapseCats; };
  }, []);

  // Expose full sync trigger for settings page — runs the modal flow
  const triggerFullSync = useCallback(async () => {
    if (!user || syncing) return;

    // Check daily limits
    const maxSyncs = userTier === 'admin' ? Infinity : userTier === 'pro' ? 5 : 1;
    const today = new Date().toDateString();
    const syncLog = JSON.parse(localStorage.getItem('subsort_sync_log') || '{}');
    const todaySyncs = syncLog.date === today ? (syncLog.count || 0) : 0;
    if (todaySyncs >= maxSyncs) {
      showToast(userTier === 'free' ? 'Free tier: 1 sync per day. Upgrade to Pro.' : `All ${maxSyncs} syncs used today.`, 5000);
      return;
    }

    setSyncing(true);
    showToast('Syncing subscriptions…');

    // Step 1: Sync subscriptions
    if (accessToken) {
      try {
        const subResult = await syncYouTubeSubscriptions(accessToken, user.id, channels, () => {});
        await reload();
        showToast(`Synced: ${subResult.newCount} new channel${subResult.newCount !== 1 ? 's' : ''}`);
      } catch (e) {
        if (e.message === 'SESSION_EXPIRED') {
          setSyncing(false);
          showToast('Session expired — please sign in again.', 3000);
          setTimeout(() => signOut(), 1500);
          return;
        }
        console.warn('[Sync] Failed:', e.message);
        showToast('Sync failed — try signing out and back in.', 5000);
      }
    } else {
      showToast('No YouTube token — sign out and sign in again to sync.', 5000);
      setSyncing(false);
      return;
    }

    // Step 2: RSS refresh
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch('/api/refresh', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } });
      }
    } catch (e) {}

    // Save timestamps and daily count
    const logAfter = JSON.parse(localStorage.getItem('subsort_sync_log') || '{}');
    const countAfter = logAfter.date === today ? (logAfter.count || 0) + 1 : 1;
    localStorage.setItem('subsort_sync_log', JSON.stringify({ date: today, count: countAfter }));
    localStorage.setItem('subsort_sync_ts', String(Date.now()));
    localStorage.setItem('subsort_rss_ts', String(Date.now()));

    window.dispatchEvent(new Event('subsnub:rss-refreshed'));
    await reload();
    setSyncing(false);
    trackEvent('sync', { source: 'manual' });
  }, [user, syncing, userTier, accessToken, channels, reload]);

  useEffect(() => {
    window.__subsortTriggerSync = triggerFullSync;
    return () => { delete window.__subsortTriggerSync; };
  }, [triggerFullSync]);

  // Close mobile nav on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className={`home-nav-primary${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Header */}
      <div className="hnp-header">
        <div className="hnp-brand-group">
          <Link href="/home" className="home-nav-brand" style={{ textDecoration: 'none' }}>
            <img src="/icon.svg" alt="Subsnub" className="home-nav-brand-logo" />
          </Link>
          {user && <span className={`tier-badge ${userTier}`}>{userTier}</span>}
        </div>
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
          {PAGE_ITEMS.map(item => (
            <NavItem key={item.href} {...item} isActive={isActive(item.href)} />
          ))}
        </div>

        {/* Categories section — only on subscriptions & feeds */}
        {showCategories && categories.length > 0 && (
          <div className="hnp-section" id="sidebarCatsSection">
            <div className="hnp-section-label">FILTER BY CATEGORY</div>
            <button className={`home-nav-item hnp-fav-btn${activeCat === '__favs__' ? ' active' : ''}`} onClick={() => { setActiveCat('__favs__'); setActiveSub(null); window.__subsortCat?.('__favs__'); }}>
              <svg viewBox="0 0 16 16"><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z"/></svg>
              <span className="home-nav-item-label">Favourites</span>
              <span className="hnp-count">{feedCounts ? feedCounts.favs : channels.filter(c => c.favourited).length}</span>
            </button>
            <button className={`home-nav-item${activeCat === 'all' ? ' active' : ''}`} onClick={() => { setActiveCat('all'); setActiveSub(null); window.__subsortCat?.('all'); }}>
              <span className="hnp-cat-dot" style={{ background: 'var(--accent)' }} />
              <span className="home-nav-item-label">All Categories</span>
              <span className="hnp-count">{feedCounts ? feedCounts.all : channels.length}</span>
            </button>
            {!catsCollapsed && categories.map(cat => {
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
                          <span className="hnp-cat-slash" style={{ color: categoryColours[cat] || 'var(--accent)' }}>/</span>
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
          {userTier === 'admin' && (
            <NavItem
              href="/admin"
              label="Admin Portal"
              svg={<><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></>}
              isActive={isActive('/admin')}
            />
          )}
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
