'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../../lib/track';
import RefreshButton from '../components/RefreshButton';

export default function Feeds2Page() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours, loading: dataLoading,
    chCats, chHasCat,
    feedVideos, feedVideosLoaded, setFeedVideos,
  } = useChannelData();

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('videos');

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
              <h1 className="f2-title">Feeds</h1>
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
            <h1 className="f2-title">Feeds</h1>
            <span className="f2-count">{filteredVideos.length} videos</span>
          </div>
          <div className="f2-header-right">
            <div className="f2-type-chips">
              <button className={`ph-chip${typeFilter === 'all' ? ' active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
              <button className={`ph-chip${typeFilter === 'videos' ? ' active' : ''}`} onClick={() => setTypeFilter('videos')}>Videos</button>
              <button className={`ph-chip${typeFilter === 'shorts' ? ' active' : ''}`} onClick={() => setTypeFilter('shorts')}>Shorts</button>
            </div>
            <div className="search-wrap">
              <svg viewBox="0 0 14 14"><path d="M6 1a5 5 0 104 8.5L13 12.5" /><path d="M9.5 9.5L13 13" /></svg>
              <input className="ph-search" type="text" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <RefreshButton />
          </div>
        </div>

        {/* Category + subcategory nav */}
        <div className="f2-cat-nav">
          <div className="f2-cat-row">
            <button className={`f2-cat-btn${activeCategory === 'all' ? ' active' : ''}`} onClick={() => { setActiveCategory('all'); setActiveSubcategory(null); }}>
              All
            </button>
            <button className={`f2-cat-btn${activeCategory === '__favs__' ? ' active' : ''}`} onClick={() => { setActiveCategory('__favs__'); setActiveSubcategory(null); }}>
              Favourites
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`f2-cat-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => { setActiveCategory(prev => prev === cat ? 'all' : cat); setActiveSubcategory(null); }}
              >
                <span className="hnp-cat-dot" style={{ background: categoryColours[cat] || 'var(--accent)' }} />
                {cat}
              </button>
            ))}
          </div>
          {activeSubs.length > 0 && (
            <div className="f2-subcat-row">
              <button
                className={`f2-subcat-btn${!activeSubcategory ? ' active' : ''}`}
                onClick={() => setActiveSubcategory(null)}
              >
                All
              </button>
              {activeSubs.map(sub => {
                const catCol = categoryColours[activeCategory] || 'var(--accent)';
                return (
                  <button
                    key={sub}
                    className={`f2-subcat-btn${activeSubcategory === sub ? ' active' : ''}`}
                    onClick={() => setActiveSubcategory(prev => prev === sub ? null : sub)}
                  >
                    <span className="hnp-cat-slash" style={{ color: catCol }}>/</span>
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Video grid — 3 columns, full width */}
      <div className="f2-grid">
        {filteredVideos.length > 0 ? filteredVideos.map(v => {
          const ch = channelMap[v.channelId];
          const cats = ch ? (ch.categories || []) : [];
          const catLabel = cats[0] || '';
          const catCol = catLabel ? categoryColours[catLabel] : null;

          return (
            <a key={v.id} className="f2-card" href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
              onClick={() => trackEvent(v.type === 'short' ? 'video_click_feeds_short' : 'video_click_feeds_video')}>
              <div className="f2-card-thumb">
                <img src={v.thumbnail} alt="" loading="lazy" />
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
            </a>
          );
        }) : (
          <div className="f2-empty">No videos match your filters.</div>
        )}
      </div>
    </>
  );
}
