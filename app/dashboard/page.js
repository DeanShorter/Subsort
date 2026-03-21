'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { fetchRecentVideos, timeAgo } from '../../lib/youtube';

export default function DashboardPage() {
  const { user, accessToken, signIn } = useAuth();
  const {
    channels, categories, categoryColours, loading,
    chCats, chIsUncategorised, formatCount, findDeadChannels,
  } = useChannelData();

  const [favVideos, setFavVideos] = useState([]);
  const [clock, setClock] = useState('');

  // ── Clock ──────────────────────────────────────────────
  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  // ── Greeting ───────────────────────────────────────────
  const greetingTime = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }, []);

  const greetingName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // ── Stats ──────────────────────────────────────────────
  const deadChannels = useMemo(() => findDeadChannels(), [findDeadChannels]);
  const uncatCount = useMemo(() => channels.filter(ch => chIsUncategorised(ch)).length, [channels, chIsUncategorised]);
  const favCount = useMemo(() => channels.filter(c => c.favourited).length, [channels]);

  // ── Category breakdown ─────────────────────────────────
  const catBreakdown = useMemo(() => {
    const counts = {};
    channels.forEach(ch => chCats(ch).forEach(c => counts[c] = (counts[c] || 0) + 1));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = sorted[0]?.[1] || 1;
    return sorted.map(([cat, count]) => ({
      cat, count,
      colour: categoryColours[cat] || 'var(--accent)',
      pct: Math.round((count / max) * 100),
    }));
  }, [channels, chCats, categoryColours]);

  // ── Fav videos ─────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !channels.length) return;
    const favChannels = channels.filter(c => c.favourited).slice(0, 12);
    if (!favChannels.length) return;
    fetchRecentVideos(favChannels, accessToken)
      .then(vids => setFavVideos(vids.slice(0, 5)))
      .catch(() => {});
  }, [accessToken, channels]);

  // ── Greeting subtitle ──────────────────────────────────
  const subtitle = !channels.length
    ? 'Sync your subscriptions to get started.'
    : `You're tracking ${channels.length} channel${channels.length !== 1 ? 's' : ''} across ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}.`;

  if (loading) {
    return <div className="home-feed-loading"><span className="spinner" /> Loading dashboard…</div>;
  }

  return (
    <main className="home-main" style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1 }}>
      {/* Topbar */}
      <div className="db-topbar">
        <h1 className="page-title">Dashboard</h1>
        <div className="db-topbar-right">
          <span className="db-clock">{clock}</span>
        </div>
      </div>

      {/* Greeting */}
      <div className="db-greeting">
        <h1>Good <span>{greetingTime}</span>, <span>{greetingName}</span>.</h1>
        <p>{subtitle}</p>
      </div>

      {!user && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Sign in to see your dashboard.</p>
          <button className="btn-accent" onClick={signIn} style={{ padding: '.625rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            Sign in with Google
          </button>
        </div>
      )}

      {user && channels.length > 0 && (
        <>
          {/* Stat strip */}
          <div className="db-stat-strip">
            <div className="db-stat-card">
              <div className="db-stat-label">Subscriptions</div>
              <div className="db-stat-value">{channels.length}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Favourites</div>
              <div className="db-stat-value db-stat-mint">{favCount}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Inactive channels</div>
              <div className="db-stat-value db-stat-red">{deadChannels.length}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Uncategorised</div>
              <div className="db-stat-value">{uncatCount}</div>
            </div>
          </div>

          {/* New from favourites */}
          <div className="db-section-hd">
            <span className="db-section-title">New from favourites</span>
          </div>
          <div className="db-fav-feed-grid">
            {favVideos.length > 0 ? favVideos.map(v => {
              const ch = channels.find(c => c.name === v.channel || c.title === v.channel);
              const cat = ch ? (chCats(ch)[0] || '') : '';
              const col = categoryColours[cat] || 'var(--accent)';
              const initials = v.channel ? v.channel.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
              return (
                <a key={v.id} className="db-fvc" href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">
                  <div className="db-fvc-thumb">
                    {v.thumbnail ? <img src={v.thumbnail} alt="" /> : null}
                  </div>
                  <div className="db-fvc-body">
                    <div className="db-fvc-av" style={{ background: col }}>{initials}</div>
                    <div className="db-fvc-meta">
                      <div className="db-fvc-title">{v.title}</div>
                      <div className="db-fvc-ch">{v.channel}</div>
                      <div className="db-fvc-stats">{timeAgo(v.publishedAt)}</div>
                    </div>
                  </div>
                </a>
              );
            }) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '.8125rem', padding: '.5rem 0' }}>
                {favCount ? 'Connect YouTube to see recent uploads.' : 'Mark channels as favourites to see new videos here.'}
              </p>
            )}
          </div>

          {/* Bottom grid: category breakdown + needs attention */}
          <div className="db-bottom-grid">
            {/* Category breakdown */}
            <div>
              <div className="db-section-hd">
                <span className="db-section-title">Category breakdown</span>
              </div>
              <div className="db-cat-breakdown">
                {catBreakdown.length > 0 ? catBreakdown.map(({ cat, count, colour, pct }) => (
                  <div key={cat} className="db-cat-brow">
                    <div className="db-cat-brow-dot" style={{ background: colour }} />
                    <span className="db-cat-brow-name">{cat}</span>
                    <span className="db-cat-brow-count">{count}</span>
                    <div className="db-cat-brow-barwrap">
                      <div className="db-cat-brow-bar" style={{ width: `${pct}%`, background: colour }} />
                    </div>
                  </div>
                )) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '.8125rem', padding: '.5rem 0' }}>No categories yet.</p>
                )}
              </div>
            </div>

            {/* Needs attention */}
            <div>
              <div className="db-section-hd">
                <span className="db-section-title">Needs attention</span>
              </div>
              <div className="db-inactive-panel">
                {deadChannels.length > 0 ? (
                  <>
                    <div className="db-inactive-desc">Channels with low engagement or no uploads</div>
                    {deadChannels.slice(0, 6).map(({ ch }) => {
                      const initials = ch.name?.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
                      const col = categoryColours[chCats(ch)[0]] || '#888';
                      return (
                        <div key={ch.id} className="db-inactive-row2">
                          <div className="db-inactive-av2" style={{ background: col }}>{initials}</div>
                          <div className="db-inactive-info2">
                            <div className="db-inactive-name2">{ch.name}</div>
                            <div className="db-inactive-last2">
                              {ch.subscriberCount ? `${formatCount(ch.subscriberCount)} subs` : 'Low activity'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p style={{ color: 'var(--accent)', fontSize: '.8125rem', padding: '.375rem 0' }}>Everything looks good!</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
