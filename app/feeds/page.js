'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import PageHeader from '../components/PageHeader';
import { trackEvent } from '../../lib/track';
import RefreshButton from '../components/RefreshButton';

const SORT_OPTIONS = [
  { value: 'date', label: 'Latest' },
  { value: 'channel', label: 'Channel' },
];

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
  const [sortIdx, setSortIdx] = useState(0);
  const [feedView, setFeedView] = useState('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [timeRange, setTimeRange] = useState('week'); // 'today', 'week', 'month'

  const sortKey = SORT_OPTIONS[sortIdx].value;

  // Filter videos by selected time range
  const allVideos = useMemo(() => {
    if (!feedVideos.length) return feedVideos;
    const now = new Date();
    let cutoff;
    if (timeRange === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === 'week') {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
    } else {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
    }
    return feedVideos.filter(v => v.publishedAt && new Date(v.publishedAt) >= cutoff);
  }, [feedVideos, timeRange]);

  // ── Push video counts to sidebar ───────────────────────
  useEffect(() => {
    if (!channels.length) return;
    const channelMap = {};
    channels.forEach(ch => { channelMap[ch.channelId] = ch; });

    const cats = {};
    const subs = {};
    let favs = 0;

    allVideos.forEach(v => {
      const ch = channelMap[v.channelId];
      if (!ch) return;
      if (ch.favourited) favs++;
      const chCatsList = ch.categories || [];
      chCatsList.forEach(cat => {
        cats[cat] = (cats[cat] || 0) + 1;
        if (ch.subcategory) {
          const key = `${cat}|${ch.subcategory}`;
          subs[key] = (subs[key] || 0) + 1;
        }
      });
    });

    window.__subsortFeedCounts?.({ all: allVideos.length, favs, cats, subs });
  }, [allVideos, channels]);

  // ── Sidebar callbacks ──────────────────────────────────
  const handleCategoryClick = useCallback((cat) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
  }, []);

  useEffect(() => {
    trackEvent('view_feeds');
    window.__subsortCat = (cat) => handleCategoryClick(cat);
    window.__subsortSub = (cat, sub) => {
      setActiveCategory(cat);
      setActiveSubcategory(prev => prev === sub ? null : sub);
    };
    return () => { delete window.__subsortCat; delete window.__subsortSub; };
  }, [handleCategoryClick]);

  // ── Load videos from DB cache only (populated by RSS refresh) ────
  useEffect(() => {
    if (!channels.length || feedVideosLoaded) return;

    let cancelled = false;
    setLoadingVideos(true);

    async function loadFromCache() {
      try {
        const channelIds = channels.map(c => c.channelId).filter(Boolean);
        if (!channelIds.length) { setLoadingVideos(false); return; }

        // Batch the query — Supabase .in() has limits on large arrays
        const BATCH = 300;
        const allCached = [];
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        for (let i = 0; i < channelIds.length; i += BATCH) {
          const batch = channelIds.slice(i, i + BATCH);
          const { data } = await supabase
            .from('cached_videos')
            .select('*')
            .in('channel_id', batch)
            .gte('published_at', since)
            .order('published_at', { ascending: false })
            .limit(2000);
          if (data) allCached.push(...data);
        }

        if (!cancelled) {
          const channelMap = {};
          channels.forEach(ch => { channelMap[ch.channelId] = ch; });

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
  }, [channels, feedVideosLoaded, setFeedVideos]);

  // ── Filter by category + sort (instant, no API call) ───
  const filtered = useMemo(() => {
    let result = [...allVideos];

    // Category filter
    if (activeCategory === '__favs__') {
      const favIds = new Set(channels.filter(c => c.favourited).map(c => c.channelId));
      result = result.filter(v => favIds.has(v.channelId));
    } else if (activeCategory !== 'all') {
      const catIds = new Set(
        channels.filter(c => {
          if (!chHasCat(c, activeCategory)) return false;
          if (activeSubcategory && c.subcategory !== activeSubcategory) return false;
          return true;
        }).map(c => c.channelId)
      );
      result = result.filter(v => catIds.has(v.channelId));
    }

    // Type filter
    if (typeFilter === 'videos') result = result.filter(v => v.type !== 'short');
    else if (typeFilter === 'shorts') result = result.filter(v => v.type === 'short');

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.channel || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortKey === 'channel') {
      result.sort((a, b) => (a.channel || '').localeCompare(b.channel || ''));
    }
    // 'date' is default order from API (newest first)

    return result;
  }, [allVideos, channels, activeCategory, activeSubcategory, chHasCat, search, sortKey, typeFilter]);

  // ── Handlers ───────────────────────────────────────────
  const cycleSort = useCallback(() => {
    setSortIdx(prev => (prev + 1) % SORT_OPTIONS.length);
  }, []);

  if (dataLoading) {
    return <div className="home-feed-loading"><span className="spinner" /> Loading feeds…</div>;
  }

  if (!user) {
    return (
      <main id="homeMain" className="home-main">
        <div className="db-header"><h1 className="page-title">Feeds</h1></div>
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to see your feed.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </main>
    );
  }

  return (
    <main id="homeMain" className={`home-main${feedView === 'list' ? ' feed-view-list' : feedView === 'grid' ? ' feed-view-grid' : ''}`}>
      <PageHeader
        title="Feeds"
        subtitle={`Videos uploaded by your subscriptions ${timeRange === 'today' ? 'today' : timeRange === 'week' ? 'within the last 7 days' : 'within the last 30 days'}`}
      >
        {/* Type filter toggle */}
        <div className="pill-toggle">
          <button className={`pill-toggle-btn${typeFilter === 'all' ? ' active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
          <button className={`pill-toggle-btn${typeFilter === 'videos' ? ' active' : ''}`} onClick={() => setTypeFilter('videos')}>Videos</button>
          <button className={`pill-toggle-btn${typeFilter === 'shorts' ? ' active' : ''}`} onClick={() => setTypeFilter('shorts')}>Shorts</button>
        </div>

        {/* Time range toggle */}
        <div className="pill-toggle">
          <button className={`pill-toggle-btn${timeRange === 'today' ? ' active' : ''}`} onClick={() => setTimeRange('today')}>Today</button>
          <button className={`pill-toggle-btn${timeRange === 'week' ? ' active' : ''}`} onClick={() => setTimeRange('week')}>This Week</button>
          <button className={`pill-toggle-btn${timeRange === 'month' ? ' active' : ''}`} onClick={() => setTimeRange('month')}>This Month</button>
        </div>

        {/* Sort */}
        <button className="ct-pill-btn" onClick={cycleSort}>
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M4 7h6M6 10h2" /></svg>
          Sort: <span>{SORT_OPTIONS[sortIdx].label}</span>
        </button>

        {/* View toggle */}
        <div className="view-toggles">
          <button className={`view-toggle-btn${feedView === 'list' ? ' active' : ''}`} title="List" onClick={() => setFeedView('list')}>
            <svg viewBox="0 0 14 14"><path d="M1 3h12M1 7h12M1 11h12" /></svg>
          </button>
          <button className={`view-toggle-btn${feedView === 'hybrid' ? ' active' : ''}`} title="Hybrid" onClick={() => setFeedView('hybrid')}>
            <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>
          </button>
          <button className={`view-toggle-btn${feedView === 'grid' ? ' active' : ''}`} title="Grid" onClick={() => setFeedView('grid')}>
            <svg viewBox="0 0 14 14"><rect x="1" y="1" width="3" height="12" rx="1" /><path d="M6 3h7M6 7h7M6 11h7" /></svg>
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

      {/* Video list */}
      <div className="home-section">
        {quotaExceeded ? (
          <div style={{ padding: '2rem 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '.5rem' }}>YouTube API quota exceeded for today.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '.8125rem' }}>Quota resets at midnight Pacific Time. Cached videos will show if available.</p>
          </div>
        ) : tokenExpired ? (
          <div style={{ padding: '2rem 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '.75rem' }}>Your YouTube session has expired.</p>
            <button className="ct-pill-btn ct-pill-accent" onClick={signIn}>
              Reconnect YouTube
            </button>
          </div>
        ) : loadingVideos ? (
          <div className="home-feed-loading"><span className="spinner" /> Fetching latest videos…</div>
        ) : !accessToken ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Connect YouTube to see recent videos.</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>
            {allVideos.length === 0 ? 'No videos in the last 14 days.' : 'No videos match your filters.'}
          </p>
        ) : (
          <div className="home-section">
            {filtered.map(v => {
              const ch = channels.find(c => c.channelId === v.channelId || c.name === v.channel);
              const cats = ch ? chCats(ch) : [];
              const catLabel = cats[0] || '';
              const catCol = catLabel && categoryColours[catLabel];

              return (
                <a
                  key={v.id}
                  className="feed-video-row"
                  href={`https://youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent(v.type === 'short' ? 'video_click_feeds_short' : 'video_click_feeds_video')}
                  style={{ textDecoration: 'none' }}
                  data-type={v.type || 'video'}
                >
                  <div className="feed-video-thumb">
                    {v.thumbnail ? (
                      <img src={v.thumbnail} alt="" loading="lazy" />
                    ) : (
                      <div className="feed-video-thumb-ph">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 9l5 3-5 3z" /></svg>
                      </div>
                    )}
                    {v.type === 'short' && <span className="feed-shorts-badge">SHORT</span>}
                  </div>
                  <div className="feed-video-body">
                    <div className="feed-video-title">{v.title}</div>
                    <div className="feed-video-meta">
                      {v.channel}{v.publishedAt ? ` · ${timeAgo(v.publishedAt)}` : ''}
                    </div>
                    <div className="feed-video-footer">
                      {catLabel && (
                        <span
                          className="feed-cat-badge"
                          style={catCol ? { background: `${catCol}22`, color: catCol } : {}}
                        >
                          {catLabel}
                        </span>
                      )}
                      {ch?.subcategory && (
                        <span className="feed-subcat-badge">{ch.subcategory}</span>
                      )}
                    </div>
                    {v.description && (
                      <div className="feed-video-desc">{v.description}</div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
