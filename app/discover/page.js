'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import Link from 'next/link';

export default function DiscoverPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [channels, setChannels] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState('popular');
  const [search, setSearch] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);

  // Load categories
  useEffect(() => {
    fetch('/api/discover/categories')
      .then(r => r.json())
      .then(data => { setCategories(data.categories || []); setLoadingCats(false); })
      .catch(() => setLoadingCats(false));
  }, []);

  // Load channels when category/sort/search/page changes
  const loadChannels = useCallback(async (cat, sortBy, q, pg) => {
    setLoadingChannels(true);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (sortBy) params.set('sort', sortBy);
    if (q) params.set('q', q);
    params.set('page', String(pg));
    params.set('limit', '20');

    const headers = {};
    if (user) {
      const { data: { session } } = await (await import('../../lib/supabase')).supabase.auth.getSession();
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`/api/discover/channels?${params}`, { headers });
    const data = await res.json();

    if (pg === 1) {
      setChannels(data.channels || []);
    } else {
      setChannels(prev => [...prev, ...(data.channels || [])]);
    }
    setTotal(data.total || 0);
    setHasMore(data.has_more || false);
    setLoadingChannels(false);
  }, [user]);

  useEffect(() => {
    setPage(1);
    loadChannels(activeCategory, sort, search, 1);
  }, [activeCategory, sort, search, loadChannels]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadChannels(activeCategory, sort, search, next);
  };

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
  };

  return (
    <div className="dsc-page">
      {/* Header */}
      <div className="dsc-header">
        <h1 className="dsc-title">Discover</h1>
      </div>

      <div className="dsc-content">
        {/* Search */}
        <div className="dsc-search-wrap">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.3"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l3 3" strokeLinecap="round" /></svg>
          <input
            className="dsc-search"
            type="text"
            placeholder="Search channels, collections, categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="dsc-search-clear" onClick={() => setSearch('')}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="dsc-cat-tabs">
          <button className={`dsc-cat-tab${!activeCategory ? ' active' : ''}`} onClick={() => setActiveCategory(null)}>
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              className={`dsc-cat-tab${activeCategory === cat.name ? ' active' : ''}`}
              onClick={() => setActiveCategory(prev => prev === cat.name ? null : cat.name)}
            >
              {cat.name} <span className="dsc-cat-tab-count">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="dsc-sort-row">
          <span className="dsc-result-count">{total} channel{total !== 1 ? 's' : ''} to discover</span>
          <button className="s2-sort-pill" onClick={() => setSort(s => s === 'popular' ? 'subscribers' : s === 'subscribers' ? 'active' : 'popular')}>
            Sort: {sort === 'popular' ? 'Most popular' : sort === 'subscribers' ? 'Most subscribers' : 'Most active'}
          </button>
        </div>

        {/* Channel grid */}
        {loadingChannels && channels.length === 0 ? (
          <div className="home-feed-loading"><span className="spinner" /> Loading channels...</div>
        ) : channels.length > 0 ? (
          <>
            <div className="dsc-channel-grid">
              {channels.map(ch => (
                <div key={ch.youtube_channel_id} className="dsc-channel-card">
                  <div className="dsc-ch-top">
                    <div className="dsc-ch-avatar">
                      {ch.thumbnail_url ? <img src={ch.thumbnail_url} alt="" /> : (ch.title || '??').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="dsc-ch-info">
                      <div className="dsc-ch-name">{ch.title}</div>
                      <div className="dsc-ch-handle">{ch.custom_url ? `@${ch.custom_url}` : ''}</div>
                    </div>
                  </div>
                  <div className="dsc-ch-stats">
                    {formatCount(ch.subscriber_count)} subscribers &middot; {ch.video_count?.toLocaleString() || 0} videos
                  </div>
                  <div className="dsc-ch-meta-row">
                    {ch.category && <span className="dsc-ch-cat-badge">{ch.category}</span>}
                    <span className="dsc-ch-users">{ch.subsnub_users} on Subsnub</span>
                  </div>
                  <div className="dsc-ch-actions">
                    <a
                      className="dsc-ch-btn-yt"
                      href={`https://youtube.com/channel/${ch.youtube_channel_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      Open on YouTube
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="dsc-load-more-wrap">
                <button className="dsc-load-more" onClick={loadMore} disabled={loadingChannels}>
                  {loadingChannels ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="dsc-empty">
            <div className="dsc-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--iris)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
              {search ? 'No channels match your search' : activeCategory ? `No suggestions in ${activeCategory} yet` : 'Discover grows as people use Subsnub'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.5 }}>
              {search ? 'Try a different search term' : 'Start by categorising your own subscriptions — your categories will help others find great channels.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
