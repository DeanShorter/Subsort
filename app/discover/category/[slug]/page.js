'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../components/AuthContext';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { trackEvent } from '../../../../lib/track';
import Link from 'next/link';

const SHOW_PROMOTED_SECTION = true;

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export default function CategoryDiscoverPage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = decodeURIComponent(params.slug || '');

  const [featured, setFeatured] = useState([]);
  const [featuredSub, setFeaturedSub] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const featuredIdsRef = useRef([]);

  const activeSub = searchParams.get('subcategory') || null;

  const getAuthHeaders = useCallback(async () => {
    if (!user) return {};
    const { data: { session } } = await (await import('../../../../lib/supabase')).supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }, [user]);

  // Load featured + subcategories on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const headers = await getAuthHeaders();
      const p = new URLSearchParams({ category, section: 'featured' });
      const res = await fetch(`/api/discover/category?${p}`, { headers });
      const data = await res.json();
      if (cancelled) return;
      setFeatured(data.featured || []);
      setFeaturedSub(data.featured_subcategory || null);
      setSubcategories(data.subcategories || []);
      featuredIdsRef.current = (data.featured || []).map(ch => ch.youtube_channel_id);
      setLoading(false);
    }
    load();
    trackEvent('category_page_viewed', { category_name: category });
    return () => { cancelled = true; };
  }, [category, getAuthHeaders]);

  // Load grid when subcategory/search/page changes
  const loadGrid = useCallback(async (sub, q, pg) => {
    setGridLoading(true);
    const headers = await getAuthHeaders();
    const p = new URLSearchParams({ category, section: 'grid', page: String(pg), limit: '30' });
    if (sub) p.set('subcategory', sub);
    if (q) p.set('q', q);
    if (featuredIdsRef.current.length) p.set('exclude', featuredIdsRef.current.join(','));

    const res = await fetch(`/api/discover/category?${p}`, { headers });
    const data = await res.json();
    if (pg === 1) {
      setChannels(data.channels || []);
    } else {
      setChannels(prev => [...prev, ...(data.channels || [])]);
    }
    setTotal(data.total || 0);
    setHasMore(data.has_more || false);
    setGridLoading(false);
  }, [category, getAuthHeaders]);

  // Trigger grid load when featured is done loading or filters change
  useEffect(() => {
    if (loading) return;
    setPage(1);
    loadGrid(activeSub, search, 1);
  }, [loading, activeSub, search, loadGrid]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadGrid(activeSub, search, next);
    trackEvent('category_channel_list_more_loaded', { category_name: category, offset: page * 30 });
  };

  const setActiveSub = (sub) => {
    const p = new URLSearchParams(searchParams.toString());
    if (sub) { p.set('subcategory', sub); } else { p.delete('subcategory'); }
    router.push(`/discover/category/${encodeURIComponent(category)}?${p}`, { scroll: false });
    if (sub) trackEvent('subcategory_filter_applied', { category_name: category, subcategory_name: sub });
  };

  // Total discoverable count = featured + grid total
  const discoverableCount = featured.length + total;

  if (loading) {
    return (
      <div className="dsc-page">
        <div className="catb-header">
          <Link href="/discover" className="catb-back-btn"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
          <span className="catb-title">{category}</span>
        </div>
        <div className="home-feed-loading"><span className="spinner" /> Loading...</div>
      </div>
    );
  }

  return (
    <div className="dsc-page">
      {/* Header */}
      <div className="catb-header">
        <Link href="/discover" className="catb-back-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="catb-title">{category}</span>
        <span className="catb-count">{discoverableCount} channel{discoverableCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Search */}
      <div className="catb-search-row">
        <div className="catb-search-bar">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#999" strokeWidth="1.3"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l3 3" strokeLinecap="round" /></svg>
          <input
            type="text"
            placeholder={`Search ${category} channels...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="catb-search-clear" onClick={() => setSearch('')}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#999" strokeWidth="1.3" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="catb-content">
        {/* Featured for you */}
        {featured.length > 0 && (
          <div className="catb-section">
            <div className="dsc-section-header">
              <div>
                <div className="dsc-section-title">Featured for you</div>
                <div className="dsc-section-subtitle">
                  {featuredSub
                    ? `Top ${category} channels in ${featuredSub} \u2014 your most-followed subcategory`
                    : `Popular ${category} channels on Subscrub`
                  }
                </div>
              </div>
            </div>
            <div className="catb-featured-scroll">
              {featured.map((ch, idx) => (
                <div key={ch.youtube_channel_id} className="catb-featured-card">
                  <div className="catb-featured-avatar" style={{ background: 'var(--iris)' }}>
                    {ch.thumbnail_url
                      ? <img src={ch.thumbnail_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      : (ch.title || '??').substring(0, 2).toUpperCase()
                    }
                  </div>
                  <div className="catb-featured-content">
                    <div className="catb-featured-header-row">
                      <div>
                        <div className="catb-featured-name">{ch.title}</div>
                        {ch.custom_url && <div className="catb-featured-handle">@{ch.custom_url}</div>}
                      </div>
                      {ch.subcategory && <span className="catb-featured-subcategory">{ch.subcategory}</span>}
                    </div>
                    {ch.subsnub_users >= 3 && (
                      <div className="catb-featured-social">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 7a3 3 0 100-6 3 3 0 000 6zM2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                        Followed by {ch.subsnub_users} Subscrub users
                      </div>
                    )}
                    {ch.description && <div className="catb-featured-desc">{ch.description.substring(0, 200)}</div>}
                    <div className="catb-featured-stats">
                      <span><strong>{formatCount(ch.subscriber_count)}</strong> subscribers</span>
                      <span><strong>{ch.video_count?.toLocaleString() || 0}</strong> videos</span>
                    </div>
                    <div className="catb-featured-actions">
                      <a
                        className="catb-btn catb-btn-primary"
                        href={`https://youtube.com/channel/${ch.youtube_channel_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent('featured_channel_clicked', { channel_id: ch.youtube_channel_id, action: 'youtube' })}
                      >
                        Open on YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promoted section (hidden by default) */}
        {SHOW_PROMOTED_SECTION && (
          <div className="catb-promoted">
            <div className="catb-promoted-label">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5v3.5l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Promoted
            </div>
            <div className="catb-promoted-intro">Creators paying to reach {category} viewers. All promoted channels are still categorised by our community.</div>
            <div className="catb-promoted-grid">
              <div className="catb-promoted-empty">Slot available</div>
              <div className="catb-promoted-empty">Slot available</div>
              <div className="catb-promoted-empty">Slot available</div>
            </div>
          </div>
        )}

        {/* Subcategory chips */}
        {subcategories.length > 0 && (
          <div className="catb-chips-section">
            <div className="catb-chips-row">
              <button className={`catb-chip${!activeSub ? ' active' : ''}`} onClick={() => setActiveSub(null)}>
                All <span className="catb-chip-count">{discoverableCount}</span>
              </button>
              {subcategories.map(sub => (
                <button
                  key={sub.name}
                  className={`catb-chip${activeSub === sub.name ? ' active' : ''}`}
                  onClick={() => setActiveSub(activeSub === sub.name ? null : sub.name)}
                >
                  {sub.name} <span className="catb-chip-count">{sub.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section divider */}
        <div className="catb-divider">
          <span className="catb-divider-text">
            {activeSub ? `${activeSub} channels in ${category}` : `All ${category} channels`}
          </span>
          <div className="catb-divider-line" />
        </div>

        {/* Channel grid */}
        {gridLoading && channels.length === 0 ? (
          <div className="home-feed-loading"><span className="spinner" /> Loading channels...</div>
        ) : channels.length > 0 ? (
          <>
            <div className="catb-grid">
              {channels.map((ch, idx) => (
                <a
                  key={ch.youtube_channel_id}
                  className="catb-ch-card"
                  href={`https://youtube.com/channel/${ch.youtube_channel_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('channel_grid_clicked', { channel_id: ch.youtube_channel_id, position: idx, subcategory: ch.subcategory })}
                >
                  <div className="catb-ch-avatar" style={{ background: 'var(--iris)' }}>
                    {ch.thumbnail_url
                      ? <img src={ch.thumbnail_url} alt="" />
                      : (ch.title || '??').substring(0, 2).toUpperCase()
                    }
                  </div>
                  <div className="catb-ch-info">
                    <div className="catb-ch-name">{ch.title}</div>
                    {ch.custom_url && <div className="catb-ch-handle">@{ch.custom_url}</div>}
                    <div className="catb-ch-stats">
                      {formatCount(ch.subscriber_count)} subscribers &middot; {ch.video_count?.toLocaleString() || 0} videos
                    </div>
                    <div className="catb-ch-meta">
                      {!activeSub && ch.subcategory && <span className="catb-ch-sub-badge">{ch.subcategory}</span>}
                      {ch.subsnub_users > 0 && <span className="catb-ch-users">{ch.subsnub_users} on Subscrub</span>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            {hasMore && (
              <div className="dsc-load-more-wrap">
                <button className="dsc-load-more" onClick={loadMore} disabled={gridLoading}>
                  {gridLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="dsc-empty">
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
              {search ? 'No channels match your search' : `No ${activeSub || category} channels to discover yet`}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.5 }}>
              {search ? 'Try a different search term' : 'Categorise your own subscriptions to help others discover great channels.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
