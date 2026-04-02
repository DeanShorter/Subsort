'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../../lib/track';
import { useDragScroll } from '../../hooks/useDragScroll';
import VideoCardPreview from '../components/VideoCardPreview';
import SplitView, { SplitMinibar } from '../components/SplitView';

export default function Feeds2Page() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours, loading: dataLoading,
    chCats, chHasCat,
    feedVideos, feedVideosLoaded, setFeedVideos,
  } = useChannelData();

  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('cat') || 'all';
    }
    return 'all';
  });
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('videos');
  const [feedView, setFeedView] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(60);
  const [splitPanels, setSplitPanels] = useState([]);
  const [splitToast, setSplitToast] = useState('');
  const [minibarVisible, setMinibarVisible] = useState(false);
  const contentRef = useRef(null);
  const splitRef = useRef(null);
  const catRowRef = useRef(null);

  // Get the scrollable container and track split view visibility
  useEffect(() => {
    contentRef.current = document.getElementById('appContent');
  }, []);

  useEffect(() => {
    const scrollEl = contentRef.current;
    if (!scrollEl || splitPanels.length === 0) { setMinibarVisible(false); return; }

    const onScroll = () => {
      if (!splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      setMinibarVisible(rect.bottom < 120);
    };

    scrollEl.addEventListener('scroll', onScroll);
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, [splitPanels.length]);

  const scrollToSplit = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  useDragScroll(catRowRef);

  const addToSplit = useCallback((video) => {
    setSplitPanels(prev => {
      if (prev.length >= 2) return prev;
      if (prev.some(v => v.id === video.id)) return prev;
      return [...prev, video];
    });
    setSplitToast(`Added to split view: ${video.title}`);
    setTimeout(() => setSplitToast(''), 2500);
    trackEvent('split_view_add', { video_id: video.id });
  }, []);

  const removeFromSplit = useCallback((index) => {
    setSplitPanels(prev => prev.filter((_, i) => i !== index));
  }, []);

  const swapSplitPanels = useCallback(() => {
    setSplitPanels(prev => prev.length === 2 ? [prev[1], prev[0]] : prev);
  }, []);

  // ── Build channel lookup ─────────────────────────────
  const channelMap = useMemo(() => {
    const map = {};
    channels.forEach(ch => { map[ch.channelId] = ch; });
    return map;
  }, [channels]);

  // ── Hide sidebar categories on feeds ────────────────
  useEffect(() => {
    window.__subsortHideSidebarCats?.('/feeds');
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
            <button className={`f2-cat-pill${activeCategory === 'all' ? ' active' : ''}`} onClick={() => { setActiveCategory('all'); setActiveSubcategory(null); }}>
              All <span className="f2-cat-count">{typeFilteredVideos.length}</span>
            </button>
            <button className={`f2-cat-pill${activeCategory === '__favs__' ? ' active' : ''}`} onClick={() => { setActiveCategory('__favs__'); setActiveSubcategory(null); }}>
              Favourites <span className="f2-cat-count">{typeFilteredVideos.filter(v => {
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
                  className={`f2-cat-pill${activeCategory === cat ? ' active' : ''}`}
                  onClick={() => { setActiveCategory(prev => prev === cat ? 'all' : cat); setActiveSubcategory(null); }}
                >
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
          {activeCategory !== 'all' && activeCategory !== '__favs__' && (
            <div className="f2-subcat-row">
              {activeSubs.length > 0 ? (
                <>
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
                </>
              ) : (
                <span className="f2-subcat-empty">No subcategories yet</span>
              )}
            </div>
          )}
        </div>
        {/* Split minibar — inside header so it sticks with it */}
        <SplitMinibar
          panels={splitPanels}
          visible={minibarVisible}
          onScrollToSplit={scrollToSplit}
          scrollContainerRef={contentRef}
        />
      </div>

      {/* Split view */}
      <div ref={splitRef}>
        <SplitView
          panels={splitPanels}
          onRemovePanel={removeFromSplit}
          onSwapPanels={swapSplitPanels}
        />
      </div>

      {/* Split toast */}
      <div className={`split-toast${splitToast ? ' show' : ''}`}>
        <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="12" rx="1" /><rect x="8" y="1" width="5" height="12" rx="1" /></svg>
        <span>{splitToast}</span>
      </div>

      {/* Video grid — 3 columns, full width */}
      <div className={`f2-grid${feedView === 'list' ? ' f2-grid-list' : ''}`} key={`${activeCategory}-${activeSubcategory}-${typeFilter}`}>
        {visibleVideos.length > 0 ? visibleVideos.map((v, idx) => {
          const ch = channelMap[v.channelId];
          const cats = ch ? (ch.categories || []) : [];
          const catLabel = cats[0] || '';
          const catCol = catLabel ? categoryColours[catLabel] : null;
          const isNew = v.publishedAt && (Date.now() - new Date(v.publishedAt).getTime()) < 24 * 60 * 60 * 1000;

          return (
            <div key={v.id} style={{ animationDelay: `${Math.min(idx * 50, 400)}ms`, opacity: 0, animation: `f2CardIn 0.3s ease forwards ${Math.min(idx * 50, 400)}ms` }}>
              <VideoCardPreview
                video={{ ...v, timeAgo: v.publishedAt ? timeAgo(v.publishedAt) : '' }}
                categoryColour={catCol}
                isNew={isNew}
                onAddToSplit={addToSplit}
                splitFull={splitPanels.length >= 2}
              />
            </div>
          );
        }) : (
          <div className="f2-empty">No videos match your filters.</div>
        )}
      </div>

    </>
  );
}
