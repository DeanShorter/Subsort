'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import PageHeader from '../components/PageHeader';
import { trackEvent } from '../../lib/track';
import RefreshButton from '../components/RefreshButton';

export default function FeedsPage() {
  const { user, accessToken, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours, loading: dataLoading,
    chCats, chHasCat,
    feedVideos, feedVideosLoaded, setFeedVideos,
  } = useChannelData();

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [search, setSearch] = useState('');
  const [feedView, setFeedView] = useState('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [openCats, setOpenCats] = useState(new Set());
  const [breakDismissed, setBreakDismissed] = useState(false);
  const [activeCatChip, setActiveCatChip] = useState('all');

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
    window.__subsortCat = (cat) => { setActiveCategory(cat); setActiveSubcategory(null); setActiveCatChip(cat); };
    window.__subsortSub = (cat, sub) => { setActiveCategory(cat); setActiveSubcategory(prev => prev === sub ? null : sub); };
    return () => { delete window.__subsortCat; delete window.__subsortSub; };
  }, []);

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

  // ── Filter pipeline ─────────────────────────────────
  const applyFilters = useCallback((videos) => {
    let result = [...videos];

    // Category chip filter
    if (activeCatChip !== 'all' && activeCatChip !== '__favs__') {
      const catIds = new Set(channels.filter(c => chHasCat(c, activeCatChip)).map(c => c.channelId));
      result = result.filter(v => catIds.has(v.channelId));
    } else if (activeCatChip === '__favs__') {
      const favIds = new Set(channels.filter(c => c.favourited).map(c => c.channelId));
      result = result.filter(v => favIds.has(v.channelId));
    }

    // Sidebar category
    if (activeCategory !== 'all' && activeCategory !== activeCatChip) {
      if (activeCategory === '__favs__') {
        const favIds = new Set(channels.filter(c => c.favourited).map(c => c.channelId));
        result = result.filter(v => favIds.has(v.channelId));
      } else {
        const catIds = new Set(channels.filter(c => {
          if (!chHasCat(c, activeCategory)) return false;
          if (activeSubcategory && c.subcategory !== activeSubcategory) return false;
          return true;
        }).map(c => c.channelId));
        result = result.filter(v => catIds.has(v.channelId));
      }
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
  }, [channels, activeCategory, activeSubcategory, activeCatChip, chHasCat, typeFilter, search]);

  // ── Favourites section videos ──────────────────────
  const favVideos = useMemo(() => {
    const favIds = new Set(channels.filter(c => c.favourited).map(c => c.channelId));
    return feedVideos
      .filter(v => favIds.has(v.channelId) && v.publishedAt && new Date(v.publishedAt) >= weekCutoff)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 12);
  }, [feedVideos, channels, weekCutoff]);

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

  // ── Toggle category group ──────────────────────────
  const toggleCatGroup = (cat) => {
    setOpenCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
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
          {v.type === 'short' && <span className="feed-shorts-badge" style={{ position: 'absolute', top: 4, left: 4 }}>SHORT</span>}
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
        <div className="db-header"><h1 className="page-title">Feeds</h1></div>
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to see your feed.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </main>
    );
  }

  return (
    <main id="homeMain" className="home-main">
      <PageHeader title="Feeds" subtitle="Videos uploaded by your subscriptions">
        {/* View toggles */}
        <div className="view-toggles">
          <button className={`view-toggle-btn${feedView === 'list' ? ' active' : ''}`} title="List" onClick={() => setFeedView('list')}>
            <svg viewBox="0 0 14 14"><path d="M1 3h12M1 7h12M1 11h12" /></svg>
          </button>
          <button className={`view-toggle-btn${feedView === 'grid' ? ' active' : ''}`} title="Grid" onClick={() => setFeedView('grid')}>
            <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>
          </button>
        </div>

        {/* Search */}
        <div className="feed-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input className="feed-search-input" placeholder="Search videos…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* RSS Refresh */}
        <RefreshButton />
      </PageHeader>

      {/* Filter chips row */}
      <div className="feed-chip-row">
        <button className={`feed-chip${typeFilter === 'all' ? ' active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
        <button className={`feed-chip${typeFilter === 'videos' ? ' active' : ''}`} onClick={() => setTypeFilter('videos')}>Videos</button>
        <button className={`feed-chip${typeFilter === 'shorts' ? ' active' : ''}`} onClick={() => setTypeFilter('shorts')}>Shorts</button>
        <span className="feed-chip-sep">|</span>
        <button className={`feed-chip${activeCatChip === 'all' ? ' active' : ''}`} onClick={() => setActiveCatChip('all')}>All Categories</button>
        {categories.map(cat => (
          <button key={cat} className={`feed-chip${activeCatChip === cat ? ' active' : ''}`} onClick={() => setActiveCatChip(activeCatChip === cat ? 'all' : cat)}>
            {cat}
          </button>
        ))}
      </div>

      {loadingVideos ? (
        <div className="home-feed-loading"><span className="spinner" /> Fetching latest videos…</div>
      ) : feedVideos.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No videos yet. Click "Refresh feed" to pull videos via RSS.</p>
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
              <div className="feed-scroll-row">
                {favVideos.map(v => renderVideoCard(v, true))}
              </div>
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
                            if (!count) return null;
                            return <button key={sub} className="feed-subchip">{sub}<span className="feed-subchip-count">{count}</span></button>;
                          })}
                        </div>
                      )}
                      {videos.slice(0, 5).map(renderVideoRow)}
                      {videos.length > 5 && (
                        <div style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          + {videos.length - 5} more
                        </div>
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
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
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

              {earlierByCat.map(([cat, videos]) => (
                <div key={cat} className="feed-earlier-row" onClick={() => { setActiveCatChip(cat); toggleCatGroup(`earlier-${cat}`); }}>
                  <div className="feed-earlier-dot" style={{ background: categoryColours[cat] || 'var(--accent)' }} />
                  <span className="feed-earlier-name">{cat}</span>
                  <span className="feed-earlier-count">{videos.length} videos</span>
                  <span className="feed-earlier-arrow">→</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
