'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import PageHeader from '../components/PageHeader';
import { trackEvent } from '../../lib/track';
import RefreshButton from '../components/RefreshButton';

function ScrollRow({ children, className = 'feed-scroll-row', scrollAmount = 460 }) {
  const ref = useRef(null);
  const scroll = (dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
  };
  return (
    <div className="feed-scroll-wrap">
      <button className="feed-scroll-btn feed-scroll-btn-left" onClick={() => scroll(-1)}>
        <svg viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" /></svg>
      </button>
      <div className={className} ref={ref}>
        {children}
      </div>
      <button className="feed-scroll-btn feed-scroll-btn-right" onClick={() => scroll(1)}>
        <svg viewBox="0 0 14 14"><path d="M5 2l5 5-5 5" /></svg>
      </button>
    </div>
  );
}

export default function FeedsPage() {
  const { user, accessToken, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours, loading: dataLoading,
    chCats, chHasCat,
    feedVideos, feedVideosLoaded, setFeedVideos,
  } = useChannelData();

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [catSource, setCatSource] = useState(null); // 'header' or 'sidebar' — tracks who selected the category
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [search, setSearch] = useState('');
  const [feedView, setFeedView] = useState('grid');
  const [typeFilter, setTypeFilter] = useState('videos');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [openCats, setOpenCats] = useState(new Set());
  const [openEarlier, setOpenEarlier] = useState(new Set());
  const [earlierSubFilter, setEarlierSubFilter] = useState({}); // { catName: subName | null }
  const [breakDismissed, setBreakDismissed] = useState(false);
  const [groupLimits, setGroupLimits] = useState({});

  // ── Build channel lookup ─────────────────────────────
  const channelMap = useMemo(() => {
    const map = {};
    channels.forEach(ch => { map[ch.channelId] = ch; });
    return map;
  }, [channels]);

  // ── Time-based video splits ──────────────────────────
  const now = useMemo(() => new Date(), []);
  const todayCutoff = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()), [now]);
  const weekCutoff = useMemo(() => { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }, [now]);
  const monthCutoff = useMemo(() => { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }, [now]);

  // ── Push video counts to sidebar ───────────────────
  useEffect(() => {
    if (!channels.length) return;
    const cats = {};
    const subs = {};
    let favs = 0;
    feedVideos.forEach(v => {
      const ch = channelMap[v.channelId];
      if (!ch) return;
      if (ch.favourited) favs++;
      (ch.categories || []).forEach(cat => {
        cats[cat] = (cats[cat] || 0) + 1;
        if (ch.subcategory) subs[`${cat}|${ch.subcategory}`] = (subs[`${cat}|${ch.subcategory}`] || 0) + 1;
      });
    });
    window.__subsortFeedCounts?.({ all: feedVideos.length, favs, cats, subs });
  }, [feedVideos, channels, channelMap]);

  // ── Sidebar callbacks ──────────────────────────────
  useEffect(() => {
    trackEvent('view_feeds');
    window.__subsortCat = (cat) => {
      setActiveCategory(cat);
      setActiveSubcategory(null);
      setCatSource(cat === 'all' ? null : 'sidebar');
      // When sidebar selects, uncollapse sidebar cats
      window.__subsortCollapseCats?.(false);
    };
    window.__subsortSub = (cat, sub) => {
      setActiveCategory(cat);
      setActiveSubcategory(prev => prev === sub ? null : sub);
      setCatSource('sidebar');
    };
    window.__subsortCatSource = () => catSource;
    return () => { delete window.__subsortCat; delete window.__subsortSub; delete window.__subsortCatSource; };
  }, [catSource]);

  // ── Load videos from DB cache ──────────────────────
  useEffect(() => {
    if (!channels.length || feedVideosLoaded) return;
    let cancelled = false;
    setLoadingVideos(true);

    async function loadFromCache() {
      try {
        const channelIds = channels.map(c => c.channelId).filter(Boolean);
        if (!channelIds.length) { setLoadingVideos(false); return; }
        const BATCH = 300;
        const allCached = [];
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        for (let i = 0; i < channelIds.length; i += BATCH) {
          const batch = channelIds.slice(i, i + BATCH);
          const { data } = await supabase.from('cached_videos').select('*').in('channel_id', batch).gte('published_at', since).order('published_at', { ascending: false }).limit(2000);
          if (data) allCached.push(...data);
        }

        if (!cancelled) {
          const vids = allCached.map(row => ({
            id: row.video_id,
            title: row.title || '',
            channel: channelMap[row.channel_id]?.name || '',
            channelId: row.channel_id,
            thumbnail: row.thumbnail || `https://i.ytimg.com/vi/${row.video_id}/mqdefault.jpg`,
            publishedAt: row.published_at,
            description: '',
            type: row.video_type || 'video',
          }));
          setFeedVideos(vids);
          setLoadingVideos(false);
        }
      } catch (e) {
        console.error('[Feeds] Cache load error:', e);
        if (!cancelled) setLoadingVideos(false);
      }
    }
    loadFromCache();
    return () => { cancelled = true; };
  }, [channels, feedVideosLoaded, setFeedVideos, channelMap]);

  // ── Silent background RSS refresh (every 1 hour) ──
  useEffect(() => {
    if (!user || !channels.length) return;

    const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour
    const lastRefresh = parseInt(localStorage.getItem('subsort_rss_ts') || '0');
    const elapsed = Date.now() - lastRefresh;

    if (elapsed < REFRESH_INTERVAL) return;

    let cancelled = false;

    async function silentRefresh() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || cancelled) return;

        console.log('[Feeds] Silent background RSS refresh…');
        const res = await fetch('/api/refresh', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        const data = await res.json();

        if (!cancelled && res.ok) {
          localStorage.setItem('subsort_rss_ts', String(Date.now()));
          if (data.newVideos > 0) {
            console.log(`[Feeds] Background refresh found ${data.newVideos} new videos — reloading cache`);
            // Reload from DB cache to pick up new videos
            const channelIds = channels.map(c => c.channelId).filter(Boolean);
            const BATCH = 300;
            const allCached = [];
            const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

            for (let i = 0; i < channelIds.length; i += BATCH) {
              const batch = channelIds.slice(i, i + BATCH);
              const { data: rows } = await supabase.from('cached_videos').select('*').in('channel_id', batch).gte('published_at', since).order('published_at', { ascending: false }).limit(2000);
              if (rows) allCached.push(...rows);
            }

            if (!cancelled) {
              const vids = allCached.map(row => ({
                id: row.video_id,
                title: row.title || '',
                channel: channelMap[row.channel_id]?.name || '',
                channelId: row.channel_id,
                thumbnail: row.thumbnail || `https://i.ytimg.com/vi/${row.video_id}/mqdefault.jpg`,
                publishedAt: row.published_at,
                description: '',
                type: row.video_type || 'video',
              }));
              setFeedVideos(vids);
            }
          } else {
            console.log('[Feeds] Background refresh — all up to date');
          }
        }
      } catch (e) {
        console.error('[Feeds] Silent refresh error:', e);
      }
    }

    silentRefresh();
    return () => { cancelled = true; };
  }, [user, channels, channelMap, setFeedVideos]);

  // ── Filter pipeline ─────────────────────────────────
  const applyFilters = useCallback((videos) => {
    let result = [...videos];

    // Category filter (single source — activeCategory)
    if (activeCategory === '__favs__') {
      const favIds = new Set(channels.filter(c => c.favourited).map(c => c.channelId));
      result = result.filter(v => favIds.has(v.channelId));
    } else if (activeCategory !== 'all') {
      const catIds = new Set(channels.filter(c => {
        if (!chHasCat(c, activeCategory)) return false;
        if (activeSubcategory && c.subcategory !== activeSubcategory) return false;
        return true;
      }).map(c => c.channelId));
      result = result.filter(v => catIds.has(v.channelId));
    }

    // Type filter
    if (typeFilter === 'videos') result = result.filter(v => v.type !== 'short');
    else if (typeFilter === 'shorts') result = result.filter(v => v.type === 'short');

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v => (v.title || '').toLowerCase().includes(q) || (v.channel || '').toLowerCase().includes(q));
    }

    return result;
  }, [channels, activeCategory, activeSubcategory, chHasCat, typeFilter, search]);

  // ── Favourites section videos (respects type filter) ──
  const favVideos = useMemo(() => {
    const favIds = new Set(channels.filter(c => c.favourited).map(c => c.channelId));
    let result = feedVideos
      .filter(v => favIds.has(v.channelId) && v.publishedAt && new Date(v.publishedAt) >= weekCutoff);
    if (typeFilter === 'videos') result = result.filter(v => v.type !== 'short');
    else if (typeFilter === 'shorts') result = result.filter(v => v.type === 'short');
    return result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [feedVideos, channels, weekCutoff, typeFilter]);

  // ── Today's videos grouped by category ─────────────
  const todayVideos = useMemo(() => {
    return applyFilters(feedVideos.filter(v => v.publishedAt && new Date(v.publishedAt) >= todayCutoff))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [feedVideos, todayCutoff, applyFilters]);

  const todayByCat = useMemo(() => {
    const groups = {};
    todayVideos.forEach(v => {
      const ch = channelMap[v.channelId];
      const cats = ch ? (ch.categories || []) : [];
      const cat = cats[0] || 'Uncategorised';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [todayVideos, channelMap]);

  // ── Earlier this week videos grouped by category ───
  const earlierVideos = useMemo(() => {
    return applyFilters(feedVideos.filter(v => {
      if (!v.publishedAt) return false;
      const d = new Date(v.publishedAt);
      return d < todayCutoff && d >= weekCutoff;
    }));
  }, [feedVideos, todayCutoff, weekCutoff, applyFilters]);

  const earlierByCat = useMemo(() => {
    const groups = {};
    earlierVideos.forEach(v => {
      const ch = channelMap[v.channelId];
      const cats = ch ? (ch.categories || []) : [];
      const cat = cats[0] || 'Uncategorised';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [earlierVideos, channelMap]);

  // ── Default open all today groups ───────────────────
  useEffect(() => {
    if (todayByCat.length > 0 && openCats.size === 0) {
      setOpenCats(new Set(todayByCat.map(([cat]) => `today-${cat}`)));
    }
  }, [todayByCat]);

  // ── Toggle category group ──────────────────────────
  const toggleCatGroup = (cat) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const getGroupLimit = (key, defaultLimit) => groupLimits[key] || defaultLimit;
  const showMore = (key, defaultLimit, step = 10) => {
    setGroupLimits(prev => ({ ...prev, [key]: (prev[key] || defaultLimit) + step }));
  };

  // ── Render helpers ─────────────────────────────────
  const renderVideoCard = (v, isNew = false) => {
    const ch = channelMap[v.channelId];
    const cats = ch ? (ch.categories || []) : [];
    const catLabel = cats[0] || '';
    const catCol = catLabel ? categoryColours[catLabel] : null;

    return (
      <a key={v.id} className="feed-vcard scroll-card" href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
        onClick={() => trackEvent(v.type === 'short' ? 'video_click_feeds_short' : 'video_click_feeds_video')}>
        <div className="feed-vcard-thumb">
          <img src={v.thumbnail} alt="" loading="lazy" />
          {isNew && <span className="feed-vcard-new">New</span>}
          {v.type === 'short' && <span className="feed-shorts-badge">SHORT</span>}
        </div>
        <div className="feed-vcard-info">
          <div className="feed-vcard-title">{v.title}</div>
          <div className="feed-vcard-channel">{v.channel}{v.publishedAt ? ` · ${timeAgo(v.publishedAt)}` : ''}</div>
          {catLabel && <span className="feed-vcard-tag" style={catCol ? { background: `${catCol}22`, color: catCol } : {}}>{catLabel}</span>}
        </div>
      </a>
    );
  };

  const renderVideoRow = (v) => {
    const ch = channelMap[v.channelId];
    const cats = ch ? (ch.categories || []) : [];
    const catLabel = cats[0] || '';
    const catCol = catLabel ? categoryColours[catLabel] : null;
    const subLabel = ch?.subcategory || catLabel;

    return (
      <a key={v.id} className="feed-vrow" href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
        onClick={() => trackEvent(v.type === 'short' ? 'video_click_feeds_short' : 'video_click_feeds_video')}>
        <div className="feed-vrow-thumb">
          <img src={v.thumbnail} alt="" loading="lazy" />
          {v.type === 'short' && <span className="feed-shorts-badge">SHORT</span>}
        </div>
        <div className="feed-vrow-info">
          <div className="feed-vrow-title">{v.title}</div>
          <div className="feed-vrow-channel">{v.channel} · {timeAgo(v.publishedAt)}</div>
          {subLabel && <span className="feed-vrow-tag" style={catCol ? { background: `${catCol}22`, color: catCol } : {}}>{subLabel}</span>}
        </div>
      </a>
    );
  };

  // ── Loading / auth states ──────────────────────────
  if (dataLoading) return <div className="home-feed-loading"><span className="spinner" /> Loading feeds…</div>;

  if (!user) {
    return (
      <main className="home-main">
        <PageHeader title="Feeds" />
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to see your feed.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </main>
    );
  }

  return (
    <main className={`home-main${feedView === 'list' ? ' feed-view-list' : feedView === 'grid' ? ' feed-view-grid' : ''}`}>
      <PageHeader
        title="Feeds"
        subtitle="Videos uploaded by your subscriptions"
        right={<>
          <div className="ph-view-toggles">
            <button className={`ph-view-btn${feedView === 'list' ? ' active' : ''}`} title="List" onClick={() => setFeedView('list')}>
              <svg viewBox="0 0 14 14"><path d="M1 3h12M1 7h12M1 11h12" /></svg>
            </button>
            <button className={`ph-view-btn${feedView === 'grid' ? ' active' : ''}`} title="Grid" onClick={() => setFeedView('grid')}>
              <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>
            </button>
          </div>
          <div className="ph-search-wrap">
            <svg viewBox="0 0 14 14"><circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L13 13" /></svg>
            <input className="ph-search" placeholder="Search videos…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <RefreshButton />
        </>}
        filters={<>
          <button className={`ph-chip${typeFilter === 'all' ? ' active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
          <button className={`ph-chip${typeFilter === 'videos' ? ' active' : ''}`} onClick={() => setTypeFilter('videos')}>Videos</button>
          <button className={`ph-chip${typeFilter === 'shorts' ? ' active' : ''}`} onClick={() => setTypeFilter('shorts')}>Shorts</button>
          <span className="ph-sep" />
          {categories.map(cat => (
            <button key={cat} className={`home-nav-item${activeCategory === cat ? ' active' : ''}`} onClick={() => {
              const next = activeCategory === cat ? 'all' : cat;
              setActiveCategory(next);
              setActiveSubcategory(null);
              setCatSource(next === 'all' ? null : 'header');
              window.__subsortCat?.(next);
              // Collapse sidebar categories when header selects
              if (next !== 'all') {
                window.__subsortCollapseCats?.(true);
              } else {
                window.__subsortCollapseCats?.(false);
              }
            }}>
              <span className="hnp-cat-dot" style={{ background: categoryColours[cat] || 'var(--accent)' }} />
              <span className="home-nav-item-label">{cat}</span>
            </button>
          ))}
        </>}
      />

      <div className="main-content">
      {loadingVideos ? (
        <div className="home-feed-loading"><span className="spinner" /> Fetching latest videos…</div>
      ) : feedVideos.length === 0 ? (
        <p className="feed-empty-msg">No videos yet. Click &quot;Refresh feed&quot; to pull videos via RSS.</p>
      ) : (
        <>
          {/* ── New from favourites ── */}
          {favVideos.length > 0 && (
            <div className="feed-section">
              <div className="feed-section-header">
                <div className="feed-section-left">
                  <div className="feed-section-icon">
                    <svg viewBox="0 0 16 16"><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" /></svg>
                  </div>
                  <span className="feed-section-title">New from your favourites</span>
                  <span className="feed-section-count">{favVideos.length} new</span>
                </div>
              </div>
              <ScrollRow>
                {favVideos.map(v => renderVideoCard(v, true))}
              </ScrollRow>
            </div>
          )}

          {/* ── Today ── */}
          {todayByCat.length > 0 && (
            <div className="feed-section">
              <div className="feed-section-header">
                <div className="feed-section-left">
                  <span className="feed-section-title">Today</span>
                  <span className="feed-section-count">{todayVideos.length} videos</span>
                </div>
              </div>

              {todayByCat.map(([cat, videos]) => {
                const isOpen = openCats.has(`today-${cat}`);
                const col = categoryColours[cat] || 'var(--accent)';
                const catSubs = subcategories[cat] || [];

                return (
                  <div key={cat} className={`feed-catgroup${isOpen ? ' open' : ''}`}>
                    <div className="feed-catgroup-header" onClick={() => toggleCatGroup(`today-${cat}`)}>
                      <div className="feed-catgroup-dot" style={{ background: col }} />
                      <span className="feed-catgroup-name">{cat}</span>
                      <span className="feed-catgroup-count">· {videos.length} new</span>
                      <span className="feed-catgroup-expand">
                        <svg viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" /></svg>
                      </span>
                    </div>
                    <div className="feed-catgroup-content">
                      {catSubs.length > 0 && (
                        <div className="feed-subchip-row">
                          <button className="feed-subchip active">All<span className="feed-subchip-count">{videos.length}</span></button>
                          {catSubs.map(sub => {
                            const count = videos.filter(v => channelMap[v.channelId]?.subcategory === sub).length;
                            return <button key={sub} className="feed-subchip">{sub}<span className="feed-subchip-count">{count}</span></button>;
                          })}
                        </div>
                      )}
                      {feedView === 'grid' ? (
                        <ScrollRow>
                          {videos.map(v => renderVideoCard(v))}
                        </ScrollRow>
                      ) : (
                        <>
                          {videos.slice(0, getGroupLimit(`today-${cat}`, 5)).map(renderVideoRow)}
                          {videos.length > getGroupLimit(`today-${cat}`, 5) && (
                            <button className="feed-loadmore" onClick={() => showMore(`today-${cat}`, 5, 10)}>
                              <svg viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" /></svg>
                              Show more
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Amygdala scrub (break card) ── */}
          {!breakDismissed && todayVideos.length > 3 && (
            <div className="feed-break-card">
              <div className="feed-break-top">
                <div className="feed-break-top-inner">
                  <div className="feed-break-icon">
                    <svg viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 14c3.3 0 6-2.2 6-5s-2.7-5-6-5-6 2.2-6 5c0 1.2.5 2.3 1.3 3.2L2 14l3.2-1c.9.4 1.8.6 2.8.6z" />
                    </svg>
                  </div>
                  <div className="feed-break-text">
                    <div className="feed-break-title">Amygdala scrub</div>
                    <div className="feed-break-msg">
                      You&apos;ve scrolled past <strong>{todayVideos.length} videos</strong> today. Here&apos;s something lighter to balance things out.
                    </div>
                  </div>
                </div>
                <button className="feed-break-dismiss" onClick={() => setBreakDismissed(true)}>✕</button>
              </div>
            </div>
          )}

          {/* ── Earlier this week ── */}
          {earlierByCat.length > 0 && (
            <div className="feed-section">
              <div className="feed-section-header">
                <div className="feed-section-left">
                  <span className="feed-section-title">Earlier this week</span>
                  <span className="feed-section-count">{earlierVideos.length} videos</span>
                </div>
              </div>

              {earlierByCat.map(([cat, videos]) => {
                const isEarlierOpen = openEarlier.has(cat);
                const catCol = categoryColours[cat] || 'var(--accent)';
                const catSubs = subcategories[cat] || [];
                const activeSub = earlierSubFilter[cat] || null;

                // Filter by subcategory if selected
                const filteredVideos = activeSub
                  ? videos.filter(v => channelMap[v.channelId]?.subcategory === activeSub)
                  : videos;

                return (
                  <div key={cat}>
                    <div className={`feed-earlier-row${isEarlierOpen ? ' active' : ''}`} onClick={() => {
                      setOpenEarlier(prev => {
                        const next = new Set(prev);
                        next.has(cat) ? next.delete(cat) : next.add(cat);
                        return next;
                      });
                    }}>
                      <div className="feed-earlier-dot" style={{ background: catCol }} />
                      <span className="feed-earlier-name">{cat}</span>
                      <span className="feed-earlier-count">{videos.length} videos</span>
                      <span className="feed-earlier-arrow">{isEarlierOpen ? '↓' : '→'}</span>
                    </div>
                    {isEarlierOpen && (
                      <div className="feed-earlier-content">
                        {/* Subcategory scroller */}
                        {catSubs.length > 0 && (
                          <div className="feed-earlier-subs">
                            <button
                              className={`feed-earlier-sub-btn${!activeSub ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setEarlierSubFilter(prev => ({ ...prev, [cat]: null })); }}
                            >
                              All <span className="feed-earlier-sub-count">{videos.length}</span>
                            </button>
                            {catSubs
                              .map(sub => ({ sub, count: videos.filter(v => channelMap[v.channelId]?.subcategory === sub).length }))
                              .sort((a, b) => b.count - a.count)
                              .map(({ sub, count }) => (
                                <button
                                  key={sub}
                                  className={`feed-earlier-sub-btn${activeSub === sub ? ' active' : ''}`}
                                  onClick={e => { e.stopPropagation(); setEarlierSubFilter(prev => ({ ...prev, [cat]: activeSub === sub ? null : sub })); }}
                                >
                                  <span className="hnp-cat-slash" style={{ color: catCol }}>/</span>
                                  {sub} <span className="feed-earlier-sub-count">{count}</span>
                                </button>
                              ))}
                          </div>
                        )}

                        {feedView === 'grid' ? (
                          <ScrollRow>
                            {filteredVideos.map(v => renderVideoCard(v))}
                          </ScrollRow>
                        ) : (
                          <>
                            {filteredVideos.slice(0, getGroupLimit(`earlier-${cat}`, 10)).map(renderVideoRow)}
                            {filteredVideos.length > getGroupLimit(`earlier-${cat}`, 10) && (
                              <button className="feed-loadmore" onClick={() => showMore(`earlier-${cat}`, 10, 10)}>
                                <svg viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" /></svg>
                                Show more
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      </div>
    </main>
  );
}
