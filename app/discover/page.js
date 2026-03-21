'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';

export default function DiscoverPage() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, categoryColours, loading,
    chCats, chHasCat, formatCount,
  } = useChannelData();

  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState('');

  // Sidebar callback
  useEffect(() => {
    window.__subsortCat = (cat) => { setActiveCat(cat === 'all' ? null : cat); };
    window.__subsortSub = () => {};
    return () => { delete window.__subsortCat; delete window.__subsortSub; };
  }, []);

  // ── "Because you follow" — channels from same cats as favourites ──
  const becauseChannels = useMemo(() => {
    const favs = channels.filter(c => c.favourited);
    if (!favs.length) return channels.slice(0, 12);
    const favCats = new Set(favs.flatMap(c => chCats(c)));
    return channels
      .filter(c => !c.favourited && chCats(c).some(cat => favCats.has(cat)))
      .slice(0, 12);
  }, [channels, chCats]);

  // ── "Trending by category" — top channels by subs, filtered ──
  const trendingChannels = useMemo(() => {
    let pool = activeCat ? channels.filter(c => chHasCat(c, activeCat)) : channels;
    return [...pool].sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0)).slice(0, 8);
  }, [channels, activeCat, chHasCat]);

  // ── "Popular" — top channels in user's top categories ──
  const popularChannels = useMemo(() => {
    const catCounts = {};
    channels.forEach(ch => chCats(ch).forEach(c => catCounts[c] = (catCounts[c] || 0) + 1));
    const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
    return channels
      .filter(ch => chCats(ch).some(c => topCats.includes(c)))
      .sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0))
      .slice(0, 8);
  }, [channels, chCats]);

  // ── "Rising" — most recently subscribed ──
  const risingChannels = useMemo(() => {
    return [...channels]
      .filter(ch => ch.subscribedAt)
      .sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt))
      .slice(0, 10);
  }, [channels]);

  // ── Search filter ──
  const filterBySearch = useCallback((list) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(ch => (ch.name || '').toLowerCase().includes(q));
  }, [search]);

  // ── Channel card renderer ──
  const renderCard = (ch) => {
    const cats = chCats(ch);
    const col = (cats[0] && categoryColours[cats[0]]) || 'var(--accent)';
    const initials = ch.name ? ch.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
    const handle = ch.customUrl ? `@${ch.customUrl.replace(/^@/, '')}` : '';

    return (
      <div key={ch.id} className="disc-ch-card">
        <div className="disc-ch-banner" style={{ background: `linear-gradient(135deg,${col}88,${col}22)` }} />
        <div className="disc-ch-av">
          {ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : initials}
        </div>
        <div className="disc-ch-body">
          <div className="disc-ch-name">{ch.name || ''}</div>
          <div className="disc-ch-handle">{handle}</div>
          <div className="disc-ch-stats">
            {ch.subscriberCount ? <span className="disc-ch-stat">{formatCount(ch.subscriberCount)} subs</span> : null}
            {cats[0] ? <span className="disc-ch-stat">{cats[0]}</span> : null}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="home-feed-loading"><span className="spinner" /> Loading…</div>;
  }

  if (!user) {
    return (
      <main className="home-main">
        <div className="db-header"><h1 className="page-title">Discover</h1></div>
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to discover channels.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </main>
    );
  }

  if (!channels.length) {
    return (
      <main className="home-main">
        <div className="db-header"><h1 className="page-title">Discover</h1></div>
        <p className="home-feed-empty-text">Sync your subscriptions to see recommendations.</p>
      </main>
    );
  }

  return (
    <main className="home-main">
      {/* Topbar */}
      <div className="disc-topbar">
        <h1 className="page-title">Discover</h1>
        <div className="disc-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input type="text" placeholder="Search channels…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Because you follow */}
      <div className="disc-section">
        <div className="disc-section-hd">
          <span className="disc-section-title">Because you follow</span>
          <span className="disc-section-sub">Based on your favourites</span>
        </div>
        <div className="disc-ch-scroll">
          {filterBySearch(becauseChannels).map(renderCard)}
        </div>
      </div>

      {/* Trending by category */}
      <div className="disc-section">
        <div className="disc-section-hd">
          <span className="disc-section-title">Trending by category</span>
        </div>
        <div className="disc-cat-strip">
          <button
            className={`disc-cat-chip${!activeCat ? ' active' : ''}`}
            onClick={() => setActiveCat(null)}
          >All</button>
          {categories.map(c => (
            <button
              key={c}
              className={`disc-cat-chip${activeCat === c ? ' active' : ''}`}
              onClick={() => setActiveCat(activeCat === c ? null : c)}
            >{c}</button>
          ))}
        </div>
        <div className="disc-trend-grid">
          {filterBySearch(trendingChannels).map(renderCard)}
        </div>
      </div>

      {/* Popular */}
      <div className="disc-section">
        <div className="disc-section-hd">
          <span className="disc-section-title">Popular with Freedly users</span>
          <span className="disc-section-sub">Your most-watched categories</span>
        </div>
        <div className="disc-popular-grid">
          {filterBySearch(popularChannels).map(renderCard)}
        </div>
      </div>

      {/* Rising channels */}
      <div className="disc-section">
        <div className="disc-section-hd">
          <span className="disc-section-title">Rising channels</span>
          <span className="disc-section-sub">Newer subscriptions in your library</span>
        </div>
        <div className="disc-rising-grid">
          {filterBySearch(risingChannels).map((ch, i) => {
            const cats = chCats(ch);
            const col = (cats[0] && categoryColours[cats[0]]) || 'var(--accent)';
            const initials = ch.name ? ch.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
            const subDate = ch.subscribedAt ? new Date(ch.subscribedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

            return (
              <div key={ch.id} className="disc-rising-card">
                <span className={`disc-rising-rank${i < 3 ? ' top' : ''}`}>{i + 1}</span>
                <div className="disc-rising-av" style={{ background: `${col}44`, color: col }}>
                  {ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : initials}
                </div>
                <div className="disc-rising-info">
                  <div className="disc-rising-name">{ch.name || ''}</div>
                  <div className="disc-rising-cat">{cats[0] || 'Uncategorised'}</div>
                </div>
                <span className="disc-rising-stat">{subDate}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
