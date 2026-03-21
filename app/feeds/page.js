'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { fetchRecentVideos, timeAgo } from '../../lib/youtube';

const SORT_OPTIONS = [
  { value: 'date', label: 'Latest' },
  { value: 'channel', label: 'Channel' },
];

export default function FeedsPage() {
  const { user, accessToken, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours, loading: dataLoading,
    chCats, chHasCat,
  } = useChannelData();

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [search, setSearch] = useState('');
  const [sortIdx, setSortIdx] = useState(0);
  const [feedView, setFeedView] = useState('hybrid');
  const [typeFilter, setTypeFilter] = useState('all');

  const sortKey = SORT_OPTIONS[sortIdx].value;

  // ── Sidebar callbacks ──────────────────────────────────
  const handleCategoryClick = useCallback((cat) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
  }, []);

  useEffect(() => {
    window.__subsortCat = (cat) => handleCategoryClick(cat);
    window.__subsortSub = (cat, sub) => {
      setActiveCategory(cat);
      setActiveSubcategory(prev => prev === sub ? null : sub);
    };
    return () => { delete window.__subsortCat; delete window.__subsortSub; };
  }, [handleCategoryClick]);

  // ── Determine which channels to fetch videos for ───────
  const feedChannels = useMemo(() => {
    if (activeCategory === '__favs__') return channels.filter(c => c.favourited);
    if (activeCategory !== 'all') {
      let result = channels.filter(c => chHasCat(c, activeCategory));
      if (activeSubcategory) result = result.filter(c => c.subcategory === activeSubcategory);
      return result;
    }
    return channels;
  }, [channels, activeCategory, activeSubcategory, chHasCat]);

  // ── Fetch videos when channels or category changes ─────
  useEffect(() => {
    if (!accessToken || !feedChannels.length) {
      setVideos([]);
      return;
    }

    let cancelled = false;
    setLoadingVideos(true);

    fetchRecentVideos(feedChannels, accessToken).then(vids => {
      if (!cancelled) {
        setVideos(vids);
        setLoadingVideos(false);
      }
    }).catch(() => {
      if (!cancelled) setLoadingVideos(false);
    });

    return () => { cancelled = true; };
  }, [accessToken, feedChannels]);

  // ── Filter + sort videos ───────────────────────────────
  const filtered = useMemo(() => {
    let result = [...videos];

    // Type filter
    if (typeFilter === 'shorts') result = result.filter(v => v.type === 'short');
    else if (typeFilter === 'videos') result = result.filter(v => v.type !== 'short');

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
  }, [videos, search, sortKey, typeFilter]);

  // ── Handlers ───────────────────────────────────────────
  const cycleSort = useCallback(() => {
    setSortIdx(prev => (prev + 1) % SORT_OPTIONS.length);
  }, []);

  if (dataLoading) {
    return <div className="home-feed-loading"><span className="spinner" /> Loading feeds…</div>;
  }

  if (!user) {
    return (
      <main id="homeMain" style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
        <h1 className="page-title">Feeds</h1>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Sign in to see your feed.</p>
          <button className="btn-accent" onClick={signIn} style={{ padding: '.625rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      id="homeMain"
      className={feedView === 'list' ? 'feed-view-list' : feedView === 'grid' ? 'feed-view-grid' : ''}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
    >
      {/* Header */}
      <div className="db-header" style={{ padding: '1.75rem 2rem 0' }}>
        <h1 className="page-title">Your Feed</h1>
        <p className="db-subtitle">Recent videos from your subscriptions.</p>
      </div>

      {/* Controls */}
      <div className="feed-sticky-bar" style={{ padding: '0 2rem' }}>
        <div className="ct-controls-row">
          {/* Type filter */}
          <button
            className={`ct-pill-btn feed-type-chip${typeFilter === 'all' ? ' active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >All</button>
          <button
            className={`ct-pill-btn feed-type-chip${typeFilter === 'videos' ? ' active' : ''}`}
            onClick={() => setTypeFilter('videos')}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="3" width="12" height="8" rx="1.5" /><path d="M5.5 6v2.5l2.5-1.25z" /></svg>
            Videos
          </button>
          <button
            className={`ct-pill-btn feed-type-chip${typeFilter === 'shorts' ? ' active' : ''}`}
            onClick={() => setTypeFilter('shorts')}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="1" width="6" height="12" rx="1.5" /><circle cx="7" cy="10.5" r=".5" fill="currentColor" /></svg>
            Shorts
          </button>

          {/* Sort */}
          <button className="ct-pill-btn" onClick={cycleSort}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M4 7h6M6 10h2" /></svg>
            Sort: <span>{SORT_OPTIONS[sortIdx].label}</span>
          </button>

          {/* View toggle */}
          <div className="view-toggles">
            <button
              className={`view-toggle-btn${feedView === 'list' ? ' active' : ''}`}
              title="List"
              onClick={() => setFeedView('list')}
            >
              <svg viewBox="0 0 14 14"><path d="M1 3h12M1 7h12M1 11h12" /></svg>
            </button>
            <button
              className={`view-toggle-btn${feedView === 'hybrid' ? ' active' : ''}`}
              title="Hybrid"
              onClick={() => setFeedView('hybrid')}
            >
              <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>
            </button>
            <button
              className={`view-toggle-btn${feedView === 'grid' ? ' active' : ''}`}
              title="Grid"
              onClick={() => setFeedView('grid')}
            >
              <svg viewBox="0 0 14 14"><rect x="1" y="1" width="3" height="12" rx="1" /><path d="M6 3h7M6 7h7M6 11h7" /></svg>
            </button>
          </div>

          {/* Search */}
          <div className="feed-search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              className="feed-search-input"
              placeholder="Search videos…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Video list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem' }}>
        {loadingVideos ? (
          <div className="home-feed-loading"><span className="spinner" /> Fetching latest videos…</div>
        ) : !accessToken ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>Connect YouTube to see recent videos.</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>
            {videos.length === 0 ? 'No videos in the last 7 days.' : 'No videos match your filters.'}
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
