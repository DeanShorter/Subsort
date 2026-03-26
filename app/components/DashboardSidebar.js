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
const CAT_ROUTES = ['/subscriptions', '/feeds', '/discover'];

const PAGE_ITEMS = [
  {
    href: '/home', label: 'Home',
    svg: <><path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1z"/><path d="M6 14V8h4v6"/></>,
  },
  {
    href: '/subscriptions', label: 'Subscriptions',
    svg: <><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6h12"/></>,
  },
  {
    href: '/feeds', label: 'Feed',
    svg: <path d="M3 4h10M3 8h6M3 12h8"/>,
  },
  {
    href: '/discover', label: 'Discover',
    svg: <><circle cx="8" cy="8" r="6"/><path d="M10.5 5.5l-1 3.5-3.5 1 1-3.5z"/></>,
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
  const [catsCollapsed, setCatsCollapsed] = useState(false);
  const autoSyncDone = useRef(false);

  // Helper to dispatch sync modal state
  const emitSync = useCallback((state) => {
    window.dispatchEvent(new CustomEvent('subscrub:sync-state', { detail: state }));
  }, []);

  // Auto-sync on login: full modal if 24h+ since last sync, silent RSS otherwise
  useEffect(() => {
    if (!user || autoSyncDone.current || syncing) return;
    autoSyncDone.current = true;

    const FULL_SYNC_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    const lastSync = parseInt(localStorage.getItem('subsort_sync_ts') || '0');
    const elapsed = Date.now() - lastSync;

    // Less than 24h — skip full sync entirely (feeds page handles silent RSS refresh)
    if (lastSync && elapsed < FULL_SYNC_INTERVAL) {
      console.log('[AutoSync] Last sync was', Math.round(elapsed / 60000), 'min ago — skipping full sync');
      return;
    }

    (async () => {
      setSyncing(true);
      window.dispatchEvent(new Event('subscrub:sync-modal-show'));

      // Step 0: Connecting
      emitSync({ action: 'activate', step: 0, pct: 8 });
      console.log('[AutoSync] Step 0: Connecting…');
      await new Promise(r => setTimeout(r, 800));
      emitSync({ action: 'complete', step: 0, detail: '✓', pct: 15 });

      // Step 1: Sync subscriptions via YouTube API
      emitSync({ action: 'activate', step: 1, pct: 22 });
      console.log('[AutoSync] Step 1: Syncing subscriptions via YouTube API…');

      let subResult = null;
      if (accessToken) {
        try {
          subResult = await syncYouTubeSubscriptions(
            accessToken, user.id, channels,
            (label, detail, pct) => setSyncProgress({ label, detail, pct })
          );
          await reload();
          console.log(`[AutoSync] Subscriptions synced: ${subResult.newCount} new, ${subResult.channels.length} total`);
        } catch (e) {
          if (e.message === 'SESSION_EXPIRED') {
            console.warn('[AutoSync] YouTube token expired — prompting re-auth');
            window.dispatchEvent(new Event('subscrub:sync-modal-hide'));
            setSyncProgress(null);
            setSyncing(false);
            showToast('YouTube session expired — please sign in again to sync.', 5000);
            signIn();
            return;
          }
          console.warn('[AutoSync] Subscription sync failed:', e.message);
        }
      } else {
        console.log('[AutoSync] No YouTube token — skipping to RSS');
      }

      emitSync({ action: 'complete', step: 1, detail: subResult ? `${subResult.channels.length} found` : 'skipped', pct: 35 });

      // Step 2: RSS refresh for videos
      emitSync({ action: 'activate', step: 2, pct: 42 });
      console.log('[AutoSync] Step 2: Refreshing video feeds via RSS…');

      let rssData = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const rssRes = await fetch('/api/refresh', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          rssData = await rssRes.json();
          console.log(`[AutoSync] RSS complete: ${rssData.channelsChecked || 0} channels checked, ${rssData.newVideos || 0} new videos`);
        }
      } catch (rssErr) {
        console.error('[AutoSync] RSS refresh failed:', rssErr);
      }

      const newVideoCount = rssData?.newVideos || 0;
      emitSync({ action: 'complete', step: 2, detail: `${newVideoCount} new`, pct: 58 });

      // Step 3: Preparing feeds — count total cached videos
      emitSync({ action: 'activate', step: 3, pct: 65 });
      console.log('[AutoSync] Step 3: Preparing feeds…');

      const updatedChannels = channels.length ? channels : [];
      let totalFeedVideos = newVideoCount;
      try {
        const chIds = updatedChannels.map(c => c.channelId).filter(Boolean);
        if (chIds.length) {
          const { count } = await supabase
            .from('cached_videos')
            .select('*', { count: 'exact', head: true })
            .in('channel_id', chIds.slice(0, 300));
          totalFeedVideos = count || newVideoCount;
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 800));

      emitSync({ action: 'complete', step: 3, detail: `${totalFeedVideos} videos`, pct: 75 });

      // Step 4: Scrutinising the mess — 1 second delay
      emitSync({ action: 'activate', step: 4, pct: 82 });
      console.log('[AutoSync] Step 4: Scrutinising…');
      await new Promise(r => setTimeout(r, 1000));

      const deadChannels = updatedChannels.filter(ch =>
        ch.videoCount === 0 || (ch.subscriberCount < 100 && ch.videoCount < 5) || (ch.subscriberCount > 0 && ch.subscriberCount < 500)
      );
      emitSync({ action: 'complete', step: 4, detail: `${deadChannels.length} issues`, pct: 90 });

      // Step 5: Judging [name] — 3 second delay
      emitSync({ action: 'activate', step: 5, pct: 95 });
      console.log('[AutoSync] Step 5: Judging…');
      await new Promise(r => setTimeout(r, 3000));

      const favCount = updatedChannels.filter(c => c.favourited).length;
      const categories = [...new Set(updatedChannels.flatMap(c => c.categories || []))];
      const score = updatedChannels.length > 0
        ? Math.round(((updatedChannels.length - deadChannels.length) / updatedChannels.length) * 100)
        : 0;

      emitSync({ action: 'complete', step: 5, detail: `${score}%`, pct: 100 });
      emitSync({
        pct: 100,
        done: true,
        channels: updatedChannels,
        deadChannels,
        favCount,
        categories,
      });

      // Fire RSS refresh event and save timestamps
      window.dispatchEvent(new Event('subscrub:rss-refreshed'));
      localStorage.setItem('subsort_sync_ts', String(Date.now()));
      localStorage.setItem('subsort_rss_ts', String(Date.now()));
      console.log('[AutoSync] Complete');

      setSyncProgress({ label: 'Done!', detail: '', pct: 100 });
      setTimeout(() => { setSyncProgress(null); setSyncing(false); }, 1500);
    })();
  }, [accessToken, user, emitSync]);

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

    // Clear timestamp so auto-sync logic runs with modal
    localStorage.removeItem('subsort_sync_ts');
    autoSyncDone.current = false;

    // Directly invoke the same auto-sync flow
    setSyncing(true);
    window.dispatchEvent(new Event('subscrub:sync-modal-show'));

    const emitSync = (d) => window.dispatchEvent(new CustomEvent('subscrub:sync-state', { detail: d }));

    emitSync({ action: 'activate', step: 0, pct: 8 });
    await new Promise(r => setTimeout(r, 800));
    emitSync({ action: 'complete', step: 0, detail: '✓', pct: 15 });

    // Step 1: Sync subscriptions
    emitSync({ action: 'activate', step: 1, pct: 22 });
    let subResult = null;
    try {
      subResult = await syncYouTubeSubscriptions(accessToken, user.id, channels, () => {});
      emitSync({ action: 'complete', step: 1, detail: `${subResult.newCount} new`, pct: 35 });
    } catch (e) {
      emitSync({ action: 'complete', step: 1, detail: 'skipped', pct: 35 });
    }

    // Step 2: RSS refresh
    emitSync({ action: 'activate', step: 2, pct: 42 });
    let rssData = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const rssRes = await fetch('/api/refresh', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } });
        rssData = await rssRes.json();
      }
    } catch (e) {}
    emitSync({ action: 'complete', step: 2, detail: `${rssData?.newVideos || 0} new`, pct: 58 });

    // Step 3: Preparing feeds
    emitSync({ action: 'activate', step: 3, pct: 65 });
    await new Promise(r => setTimeout(r, 600));
    emitSync({ action: 'complete', step: 3, detail: `${rssData?.channelsChecked || channels.length} checked`, pct: 75 });

    // Step 4: Scrutinising
    emitSync({ action: 'activate', step: 4, pct: 82 });
    await new Promise(r => setTimeout(r, 1000));
    emitSync({ action: 'complete', step: 4, detail: '✓', pct: 90 });

    // Step 5: Judging
    emitSync({ action: 'activate', step: 5, pct: 95 });
    await new Promise(r => setTimeout(r, 2000));
    const score = channels.length ? Math.round(((channels.length - (channels.filter(c => !c.videoCount || c.subscriberCount < 500).length)) / channels.length) * 100) : 50;
    emitSync({ action: 'complete', step: 5, detail: `${score}%`, pct: 100 });

    emitSync({ pct: 100, done: true, channels, deadChannels: [], favCount: channels.filter(c => c.favourited).length, categories });

    // Save timestamps and daily count
    const logAfter = JSON.parse(localStorage.getItem('subsort_sync_log') || '{}');
    const countAfter = logAfter.date === today ? (logAfter.count || 0) + 1 : 1;
    localStorage.setItem('subsort_sync_log', JSON.stringify({ date: today, count: countAfter }));
    localStorage.setItem('subsort_sync_ts', String(Date.now()));
    localStorage.setItem('subsort_rss_ts', String(Date.now()));

    window.dispatchEvent(new Event('subscrub:rss-refreshed'));
    await reload();
    setSyncing(false);
  }, [user, syncing, userTier, accessToken, channels, categories, reload]);

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
          <Link href="/dashboard" className="home-nav-brand" style={{ textDecoration: 'none' }}>
            <img src="/icon.svg" alt="Subscrub" className="home-nav-brand-icon" />
            <span className="home-nav-brand-wordmark">
              <span className="hnp-wordmark">sub</span><span>scrub</span>
            </span>
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
