'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import { useDragScroll } from '../../hooks/useDragScroll';
import { trackEvent } from '../../lib/track';
import { useStash } from '../../hooks/useStash';
import VideoCardPreview from '../components/VideoCardPreview';

export default function Feeds2Page() {
  const { user, signIn } = useAuth();
  const {
    channels, allChannels, categories, subcategories, categoryColours, loading: dataLoading,
    chCats, chHasCat,
    feedVideos, feedVideosLoaded, setFeedVideos,
  } = useChannelData();

  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('cat') || null; // null = not yet determined
    }
    return null;
  });
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const defaultSet = useRef(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('videos');
  const [visibleCount, setVisibleCount] = useState(60);
  const { collections: stashCollections, addToStash } = useStash(user);
  const contentRef = useRef(null);
  const catRowRef = useRef(null);
  const [catOverflows, setCatOverflows] = useState(false);

  // Get the scrollable container
  useEffect(() => {
    contentRef.current = document.getElementById('appContent');
  }, []);

  useDragScroll(catRowRef);

  // Check if category row overflows
  useEffect(() => {
    const el = catRowRef.current;
    if (!el) return;
    const check = () => setCatOverflows(el.scrollWidth > el.clientWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [categories, feedVideos]);

  // Default to Favourites tab if user has favourited channels with recent uploads
  useEffect(() => {
    if (defaultSet.current || activeCategory !== null) return;
    if (!channels.length || !feedVideosLoaded) return;
    defaultSet.current = true;

    const favChannelIds = new Set(channels.filter(c => c.favourited).map(c => c.channelId));
    if (favChannelIds.size === 0) { setActiveCategory('all'); return; }

    const hasFavUploads = feedVideos.some(v => favChannelIds.has(v.channelId));
    setActiveCategory(hasFavUploads ? '__favs__' : 'all');
  }, [channels, feedVideos, feedVideosLoaded, activeCategory]);

  // ── Build channel lookup ─────────────────────────────
  const channelMap = useMemo(() => {
    const map = {};
    channels.forEach(ch => { map[ch.channelId] = ch; });
    return map;
  }, [channels]);

  // ── Hide sidebar categories on feeds ────────────────
  useEffect(() => {
    window.__subsortHideSidebarCats?.('/feeds');
    trackEvent('feed_viewed', { video_count: feedVideos.length });
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
  // Only show videos from managed channels (channels is already filtered by provider)
  const activeChannelIds = useMemo(() => new Set(channels.map(c => c.channelId)), [channels]);

  const filteredVideos = useMemo(() => {
    let result = feedVideos.filter(v => activeChannelIds.has(v.channelId));

    // Category
    if (activeCategory === '__favs__') {
      const favIds = new Set(channels.filter(c => c.favourited && c.isActive !== false).map(c => c.channelId));
      result = result.filter(v => favIds.has(v.channelId));
    } else if (activeCategory && activeCategory !== 'all') {
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
            <span className="ph-count">{filteredVideos.length} videos{allChannels.length > channels.length ? ` · ${channels.length} of ${allChannels.length} subscriptions` : ''}</span>
          </div>
          <div className="f2-header-right">
            <button className="s2-sort-pill" onClick={() => setTypeFilter(f => f === 'all' ? 'videos' : f === 'videos' ? 'shorts' : 'all')}>
              Content Type: {typeFilter === 'all' ? 'All' : typeFilter === 'videos' ? 'Videos' : 'Shorts'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="s2-ctrl-icon" onClick={() => setSearch(s => s ? '' : ' ')}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#999" strokeWidth="1.3" /><path d="M10.5 10.5l3 3" stroke="#999" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </button>
              {search !== '' && (
                <>
                  <input className="s2-search-pill" type="text" placeholder="Search..." value={search === ' ' ? '' : search} onChange={e => setSearch(e.target.value)} autoFocus style={{ width: 160 }} />
                  {search.trim() && (
                    <button className="s2-ctrl-icon" onClick={() => setSearch('')} style={{ marginLeft: -4 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#999" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category + subcategory nav */}
        <div className="f2-cat-nav">
          <div className="f2-cat-scroll-wrap">
            {catOverflows && <button className="f2-cat-scroll-btn f2-cat-scroll-left" onClick={() => catRowRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}>
              <svg viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" /></svg>
            </button>}
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
              if (count === 0) return null;
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
            {catOverflows && <button className="f2-cat-scroll-btn f2-cat-scroll-right" onClick={() => catRowRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}>
              <svg viewBox="0 0 14 14"><path d="M5 2l5 5-5 5" /></svg>
            </button>}
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
      </div>

      {/* Video grid — 3 columns, full width */}
      <div className="f2-grid" key={`${activeCategory}-${activeSubcategory}-${typeFilter}`}>
        {visibleVideos.length > 0 ? visibleVideos.map((v, idx) => {
          const ch = channelMap[v.channelId];
          const cats = ch ? (ch.categories || []) : [];
          const catLabel = cats[0] || '';
          const catCol = catLabel ? categoryColours[catLabel] : null;

          return (
            <div key={v.id} style={{ animationDelay: `${Math.min(idx * 50, 400)}ms`, opacity: 0, animation: `f2CardIn 0.3s ease forwards ${Math.min(idx * 50, 400)}ms` }}>
              <VideoCardPreview
                video={{ ...v, timeAgo: v.publishedAt ? timeAgo(v.publishedAt) : '', channelThumbnail: ch?.thumbnail || '' }}
                categoryColour={catCol}
                categoryName={activeCategory === 'all' ? catLabel : null}
                onStash={addToStash}
                stashCollections={stashCollections}
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
