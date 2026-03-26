'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../../lib/track';

export default function Feeds2Page() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours, loading: dataLoading,
    chCats, chHasCat,
    feedVideos, feedVideosLoaded, setFeedVideos,
  } = useChannelData();

  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('cat') || 'all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('videos');
  const [feedView, setFeedView] = useState('grid');
  const [playingVideo, setPlayingVideo] = useState(null); // { id, title, channel }
  const [visibleCount, setVisibleCount] = useState(60);
  const catRowRef = useRef(null);

  // ── Build channel lookup ─────────────────────────────
  const channelMap = useMemo(() => {
    const map = {};
    channels.forEach(ch => { map[ch.channelId] = ch; });
    return map;
  }, [channels]);

  // ── Hide sidebar categories on feeds2 ────────────────
  useEffect(() => {
    window.__subsortHideSidebarCats?.('/feeds2');
    return () => { window.__subsortHideSidebarCats?.(null); };
  }, []);

  // ── Load videos from DB cache ────────────────────────
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
            type: row.video_type || 'video',
          }));
          setFeedVideos(vids);
          setLoadingVideos(false);
        }
      } catch (e) {
        console.error('[Feeds2] Cache load error:', e);
        if (!cancelled) setLoadingVideos(false);
      }
    }
    loadFromCache();
    return () => { cancelled = true; };
  }, [channels, feedVideosLoaded, setFeedVideos, channelMap]);

  // ── Filter pipeline ──────────────────────────────────
  const filteredVideos = useMemo(() => {
    let result = [...feedVideos];

    // Category
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

    // Type
    if (typeFilter === 'videos') result = result.filter(v => v.type !== 'short');
    else if (typeFilter === 'shorts') result = result.filter(v => v.type === 'short');

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(v => (v.title || '').toLowerCase().includes(q) || (v.channel || '').toLowerCase().includes(q));
    }

    return result.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }, [feedVideos, channels, activeCategory, activeSubcategory, chHasCat, typeFilter, search]);

  // Videos filtered by type only (for category counts)
  const typeFilteredVideos = useMemo(() => {
    if (typeFilter === 'videos') return feedVideos.filter(v => v.type !== 'short');
    if (typeFilter === 'shorts') return feedVideos.filter(v => v.type === 'short');
    return feedVideos;
  }, [feedVideos, typeFilter]);

  // Reset visible count when filters change
  useEffect(() => { setVisibleCount(60); }, [activeCategory, activeSubcategory, typeFilter, search]);

  // Infinite scroll — load 60 more when user scrolls near bottom
  useEffect(() => {
    const container = document.querySelector('.app-content');
    if (!container) return;
    const onScroll = () => {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 400) {
        setVisibleCount(prev => {
          if (prev >= filteredVideos.length) return prev;
          return prev + 60;
        });
      }
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [filteredVideos.length]);

  const visibleVideos = useMemo(() => filteredVideos.slice(0, visibleCount), [filteredVideos, visibleCount]);

  // ── Loading / auth states ────────────────────────────
  if (dataLoading) return <div className="home-feed-loading"><span className="spinner" /> Loading feeds…</div>;

  // Subcategories for the active category
  const activeSubs = activeCategory !== 'all' && activeCategory !== '__favs__'
    ? (subcategories[activeCategory] || [])
    : [];

  if (!user) {
    return (
      <>
        <div className="f2-header">
          <div className="f2-header-top">
            <div className="f2-header-left">
              <h1 className="f2-title">Feed</h1>
            </div>
          </div>
        </div>
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to see your feed.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Full-width header — flush to app-content edges */}
      <div className="f2-header">
        <div className="f2-header-top">
          <div className="f2-header-left">
            <h1 className="f2-title">Feed</h1>
            <span className="ph-count">{filteredVideos.length} videos</span>
          </div>
          <div className="f2-header-right">
            <div className="ph-view-toggles">
              <button className={`ph-view-btn f2-type-btn${typeFilter === 'all' ? ' active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
              <button className={`ph-view-btn f2-type-btn${typeFilter === 'videos' ? ' active' : ''}`} onClick={() => setTypeFilter('videos')}>Videos</button>
              <button className={`ph-view-btn f2-type-btn${typeFilter === 'shorts' ? ' active' : ''}`} onClick={() => setTypeFilter('shorts')}>Shorts</button>
            </div>
            <div className="ph-view-toggles">
              <button className={`ph-view-btn${feedView === 'list' ? ' active' : ''}`} title="List" onClick={() => setFeedView('list')}>
                <svg viewBox="0 0 14 14"><path d="M1 3h12M1 7h12M1 11h12" /></svg>
              </button>
              <button className={`ph-view-btn${feedView === 'grid' ? ' active' : ''}`} title="Grid" onClick={() => setFeedView('grid')}>
                <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>
              </button>
            </div>
            <div className="ph-search-wrap">
              <svg viewBox="0 0 14 14"><circle cx="6" cy="6" r="4.5" fill="none" /><path d="M9.5 9.5L13 13" /></svg>
              <input className="ph-search" type="text" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Category + subcategory nav */}
        <div className="f2-cat-nav">
          <div className="f2-cat-scroll-wrap">
            <button className="f2-cat-scroll-btn f2-cat-scroll-left" onClick={() => catRowRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}>
              <svg viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" /></svg>
            </button>
          <div className="f2-cat-row" ref={catRowRef}>
            <button className={`f2-cat-btn${activeCategory === 'all' ? ' active' : ''}`} onClick={() => { setActiveCategory('all'); setActiveSubcategory(null); }}>
              <span className="hnp-cat-dot" style={{ background: 'var(--accent)' }} />
              All
              <span className="f2-cat-count">{typeFilteredVideos.length}</span>
            </button>
            <button className={`f2-cat-btn${activeCategory === '__favs__' ? ' active' : ''}`} onClick={() => { setActiveCategory('__favs__'); setActiveSubcategory(null); }}>
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12, color: '#EFD700' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Favourites
              <span className="f2-cat-count">{typeFilteredVideos.filter(v => {
                const ch = channelMap[v.channelId];
                return ch && ch.favourited;
              }).length}</span>
            </button>
            {categories.map(cat => {
              const count = typeFilteredVideos.filter(v => {
                const ch = channelMap[v.channelId];
                return ch && (ch.categories || []).includes(cat);
              }).length;
              return (
                <button
                  key={cat}
                  className={`f2-cat-btn${activeCategory === cat ? ' active' : ''}`}
                  onClick={() => { setActiveCategory(prev => prev === cat ? 'all' : cat); setActiveSubcategory(null); }}
                >
                  <span className="hnp-cat-dot" style={{ background: categoryColours[cat] || 'var(--accent)' }} />
                  {cat}
                  <span className="f2-cat-count">{count}</span>
                </button>
              );
            })}
          </div>
            <button className="f2-cat-scroll-btn f2-cat-scroll-right" onClick={() => catRowRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}>
              <svg viewBox="0 0 14 14"><path d="M5 2l5 5-5 5" /></svg>
            </button>
          </div>
          {activeSubs.length > 0 && (
            <div className="f2-subcat-row">
              <button
                className={`f2-subcat-btn${!activeSubcategory ? ' active' : ''}`}
                onClick={() => setActiveSubcategory(null)}
              >
                All {activeCategory}
              </button>
              {activeSubs.map(sub => (
                <button
                  key={sub}
                  className={`f2-subcat-btn${activeSubcategory === sub ? ' active' : ''}`}
                  onClick={() => setActiveSubcategory(prev => prev === sub ? null : sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video grid — 3 columns, full width */}
      <div className={`f2-grid${feedView === 'list' ? ' f2-grid-list' : ''}`} key={`${activeCategory}-${activeSubcategory}-${typeFilter}`}>
        {visibleVideos.length > 0 ? visibleVideos.map((v, idx) => {
          const ch = channelMap[v.channelId];
          const cats = ch ? (ch.categories || []) : [];
          const catLabel = cats[0] || '';
          const catCol = catLabel ? categoryColours[catLabel] : null;

          return (
            <div key={v.id} className="f2-card" style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }} onClick={() => {
              trackEvent(v.type === 'short' ? 'video_click_feeds_short' : 'video_click_feeds_video');
              setPlayingVideo({ id: v.id, title: v.title, channel: v.channel || '' });
            }}>
              <div className="f2-card-thumb">
                <img src={v.thumbnail} alt="" loading="lazy" onLoad={e => e.currentTarget.classList.add('loaded')} />
                {v.type === 'short' && <span className="feed-shorts-badge">SHORT</span>}
              </div>
              <div className="f2-card-info">
                <div className="f2-card-title">{v.title}</div>
                <div className="f2-card-channel">{v.channel}{v.publishedAt ? ` · ${timeAgo(v.publishedAt)}` : ''}</div>
                {catLabel && (
                  <div className="f2-card-tags">
                    <span className="f2-card-tag" style={catCol ? { background: `${catCol}22`, color: catCol } : {}}>{catLabel}</span>
                    {ch?.subcategory && (
                      <span className="f2-card-subcat">
                        <span className="hnp-cat-slash" style={{ color: catCol || 'var(--accent)' }}>/</span>
                        {ch.subcategory}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="f2-empty">No videos match your filters.</div>
        )}
      </div>

      {/* Video player modal */}
      {playingVideo && (
        <div className="f2-player-overlay" onClick={() => setPlayingVideo(null)}>
          <div className="f2-player-modal" onClick={e => e.stopPropagation()}>
            <div className="f2-player-header">
              <div className="f2-player-info">
                <div className="f2-player-title">{playingVideo.title}</div>
                <div className="f2-player-channel">{playingVideo.channel}</div>
              </div>
              <div className="f2-player-actions">
                <a className="f2-player-yt" href={`https://youtube.com/watch?v=${playingVideo.id}`} target="_blank" rel="noopener noreferrer">
                  Open on YouTube
                </a>
                <button className="f2-player-close" onClick={() => setPlayingVideo(null)}>✕</button>
              </div>
            </div>
            <div className="f2-player-embed">
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
