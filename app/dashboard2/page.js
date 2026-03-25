'use client';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../../lib/track';
import Link from 'next/link';

export default function Home2Page() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, categoryColours, loading: dataLoading,
    chCats, formatCount, findDeadChannels,
    feedVideos, feedVideosLoaded, setFeedVideos,
  } = useChannelData();

  const [loadingVideos, setLoadingVideos] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);

  const channelMap = useMemo(() => {
    const map = {};
    channels.forEach(ch => { map[ch.channelId] = ch; });
    return map;
  }, [channels]);

  // Load videos from cache
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
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        for (let i = 0; i < channelIds.length; i += BATCH) {
          const batch = channelIds.slice(i, i + BATCH);
          const { data } = await supabase.from('cached_videos').select('*').in('channel_id', batch).gte('published_at', since).order('published_at', { ascending: false }).limit(2000);
          if (data) allCached.push(...data);
        }
        if (!cancelled) {
          const vids = allCached.map(row => ({
            id: row.video_id, title: row.title || '', channel: channelMap[row.channel_id]?.name || '',
            channelId: row.channel_id, thumbnail: row.thumbnail || `https://i.ytimg.com/vi/${row.video_id}/mqdefault.jpg`,
            publishedAt: row.published_at, type: row.video_type || 'video',
          }));
          setFeedVideos(vids);
          setLoadingVideos(false);
        }
      } catch (e) { if (!cancelled) setLoadingVideos(false); }
    }
    loadFromCache();
    return () => { cancelled = true; };
  }, [channels, feedVideosLoaded, setFeedVideos, channelMap]);

  // Computed
  const deadChannels = useMemo(() => findDeadChannels(), [findDeadChannels]);
  const favCount = channels.filter(c => c.favourited).length;
  const inactiveCount = deadChannels.length;

  const score = useMemo(() => {
    if (!channels.length) return 0;
    return Math.round(((channels.length - inactiveCount) / channels.length) * 100);
  }, [channels, inactiveCount]);

  const scoreClass = score >= 90 ? 'score-perfect' : score >= 75 ? 'score-sharp' : score >= 60 ? 'score-getting' : score >= 40 ? 'score-needs' : 'score-fire';
  const scoreColour = score >= 90 ? 'var(--teal)' : score >= 75 ? 'var(--accent)' : score >= 60 ? 'var(--amber)' : score >= 40 ? 'var(--orange)' : 'var(--red)';
  const scoreEmoji = score >= 90 ? '😎' : score >= 75 ? '👍' : score >= 60 ? '😐' : score >= 40 ? '😬' : '🔥';
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const roastText = useMemo(() => {
    if (!channels.length) return '';
    const active = channels.length - inactiveCount;
    if (score >= 90) return `${channels.length} subscriptions and nearly all are active. Either you're incredibly disciplined or you just signed up yesterday.`;
    if (score >= 75) return `${channels.length} subscriptions and you engage with ${active}. Not bad — but ${inactiveCount} are still collecting dust.`;
    if (score >= 60) return `${channels.length} subscriptions and you engage with ${active}. The other ${inactiveCount} are just paying emotional rent in your feed.`;
    return `${channels.length} subscriptions and you only engage with ${active}. The other ${inactiveCount} are haunting your feed like ghosts.`;
  }, [channels, inactiveCount, score]);

  const favVideos = useMemo(() => {
    const favIds = new Set(channels.filter(c => c.favourited).map(c => c.channelId));
    return feedVideos.filter(v => favIds.has(v.channelId) && v.type !== 'short')
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 8);
  }, [feedVideos, channels]);

  const todayVideos = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return feedVideos.filter(v => v.publishedAt && new Date(v.publishedAt) >= today);
  }, [feedVideos]);

  const todayCatDots = useMemo(() => {
    const cats = new Set();
    todayVideos.forEach(v => { const ch = channelMap[v.channelId]; if (ch) (ch.categories || []).forEach(c => cats.add(c)); });
    return [...cats].slice(0, 8);
  }, [todayVideos, channelMap]);

  const todayChannelCount = useMemo(() => new Set(todayVideos.map(v => v.channelId)).size, [todayVideos]);

  const ringC = 2 * Math.PI * 18;
  const ringOffset = ringC - (ringC * score / 100);

  if (dataLoading) return <div className="home-feed-loading"><span className="spinner" /> Loading...</div>;

  if (!user) {
    return (
      <>
        <div className="h2-header"><div className="f2-header-top"><div className="f2-header-left"><h1 className="f2-title">Home</h1></div></div></div>
        <div className="home-feed-empty"><p className="home-feed-empty-text">Sign in to get started.</p><button className="btn-accent" onClick={signIn}>Sign in with Google</button></div>
      </>
    );
  }

  return (
    <>
      <div className="h2-header">
        <div className="f2-header-top">
          <div className="f2-header-left"><h1 className="f2-title">Home</h1></div>
          <div className="f2-header-right">
            <span className="h2-sync-meta">{(() => { try { const ts = localStorage.getItem('subsort_rss_ts'); return ts ? `Last refresh: ${timeAgo(new Date(parseInt(ts)).toISOString())}` : ''; } catch { return ''; } })()}</span>
          </div>
        </div>
      </div>

      <div className="h2-content">
        {/* CRITIC BANNER */}
        <div className={`critic-banner ${scoreClass}`}>
          <div className="cb-ring">
            <svg viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="var(--surface-3)" strokeWidth="3.5" />
              <circle cx="22" cy="22" r="18" fill="none" stroke={scoreColour} strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringOffset} transform="rotate(-90 22 22)" />
            </svg>
            <span className="cb-ring-val">{score}%</span>
          </div>
          <div className="cb-content">
            <div className="cb-greeting">{greeting}, {userName}. {scoreEmoji}</div>
            <div className="cb-roast">{roastText}</div>
          </div>
          <div className="cb-stats">
            <div className="cb-stat"><div className="cb-stat-val">{channels.length}</div><div className="cb-stat-label">Subs</div></div>
            <div className="cb-stat"><div className="cb-stat-val" style={{ color: 'var(--red)' }}>{inactiveCount}</div><div className="cb-stat-label">Inactive</div></div>
            <div className="cb-stat"><div className="cb-stat-val" style={{ color: 'var(--accent)' }}>{categories.length}</div><div className="cb-stat-label">Categories</div></div>
          </div>
          <div className="cb-actions">
            <button className="cb-share" title="Share your score">
              <svg viewBox="0 0 16 16"><path d="M4 8V13a1 1 0 001 1h6a1 1 0 001-1V8" /><polyline points="8 2 8 10" /><polyline points="5 5 8 2 11 5" /></svg>
            </button>
            <Link href="/subscriptions" className="cb-fix">Fix this →</Link>
          </div>
        </div>

        {/* FAVOURITES */}
        {favVideos.length > 0 && (
          <div className="h2-section">
            <div className="h2-section-header">
              <div className="section-left">
                <span className="h2-section-title">⭐ New from your favourites</span>
                <span className="h2-section-count">{favVideos.length} new</span>
              </div>
              <Link href="/feeds2" className="h2-section-link">View all favourites →</Link>
            </div>
            <div className="h2-fav-grid">
              {favVideos.map((v, i) => {
                const isNew = v.publishedAt && (Date.now() - new Date(v.publishedAt).getTime()) < 24 * 60 * 60 * 1000;
                return (
                  <div key={v.id} className="h2-fav-card" style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
                    onClick={() => { trackEvent('video_click_home'); setPlayingVideo({ id: v.id, title: v.title, channel: v.channel }); }}>
                    <div className="h2-fav-thumb">
                      <img src={v.thumbnail} alt="" loading="lazy" onLoad={e => e.currentTarget.classList.add('loaded')} />
                      {isNew && <span className="h2-fav-new">New</span>}
                    </div>
                    <div className="h2-fav-info">
                      <div className="h2-fav-title">{v.title}</div>
                      <div className="h2-fav-channel">{v.channel} · {timeAgo(v.publishedAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TODAY BAR */}
        {todayVideos.length > 0 && (
          <div className="h2-section">
            <Link href="/feeds2" className="h2-today-bar">
              <span className="h2-today-icon">📬</span>
              <div className="h2-today-text">
                <div className="h2-today-title">{todayVideos.length} new videos today</div>
                <div className="h2-today-sub">across {todayCatDots.length} categories from {todayChannelCount} channels</div>
              </div>
              <div className="h2-today-cats">
                {todayCatDots.map(cat => (<div key={cat} className="h2-today-dot" style={{ background: categoryColours[cat] || 'var(--accent)' }} />))}
              </div>
              <span className="h2-today-arrow">→</span>
            </Link>
          </div>
        )}

        {/* SECONDARY GRID */}
        <div className="h2-section">
          <div className="h2-secondary-grid">
            <div className="h2-panel">
              <div className="h2-panel-header"><span className="h2-panel-title">Recent activity</span></div>
              <div>
                {favCount > 0 && <div className="h2-activity-item"><div className="h2-activity-icon" style={{ background: 'rgba(239,159,39,0.08)' }}>⭐</div><div className="h2-activity-text"><strong>{favCount} favourites</strong> selected</div></div>}
                {inactiveCount > 0 && <div className="h2-activity-item"><div className="h2-activity-icon" style={{ background: 'rgba(232,93,80,0.08)' }}>👻</div><div className="h2-activity-text"><strong>{inactiveCount} inactive channels</strong> detected</div></div>}
                <div className="h2-activity-item"><div className="h2-activity-icon" style={{ background: 'rgba(55,138,221,0.08)' }}>📂</div><div className="h2-activity-text"><strong>{categories.length} categories</strong> configured</div></div>
                <div className="h2-activity-item"><div className="h2-activity-icon" style={{ background: 'var(--mint-dim)' }}>🧹</div><div className="h2-activity-text"><strong>{channels.length} channels</strong> synced</div></div>
              </div>
            </div>
            <div className="h2-panel">
              <div className="h2-panel-header"><span className="h2-panel-title">New in Discover</span><Link href="/discover" className="h2-panel-link">Explore →</Link></div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '10px' }}>3 new channels in your top categories</div>
              <div className="h2-disc-row">
                <div className="h2-disc-card">
                  <div className="h2-disc-avatar" style={{ background: 'rgba(232,135,92,0.15)', color: 'var(--orange)' }}>SS</div>
                  <div className="h2-disc-name">Sky Sports F1</div>
                  <div className="h2-disc-subs">2.1M subs</div>
                </div>
                <div className="h2-disc-card">
                  <div className="h2-disc-avatar" style={{ background: 'rgba(62,207,160,0.1)', color: 'var(--accent)' }}>JC</div>
                  <div className="h2-disc-name">Jacob Collier</div>
                  <div className="h2-disc-subs">4.8M subs</div>
                </div>
                <div className="h2-disc-card">
                  <div className="h2-disc-avatar" style={{ background: 'rgba(239,159,39,0.08)', color: 'var(--amber)' }}>VX</div>
                  <div className="h2-disc-name">Vox</div>
                  <div className="h2-disc-subs">12M subs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player modal */}
      {playingVideo && (
        <div className="f2-player-overlay" onClick={() => setPlayingVideo(null)}>
          <div className="f2-player-modal" onClick={e => e.stopPropagation()}>
            <div className="f2-player-header">
              <div className="f2-player-info"><div className="f2-player-title">{playingVideo.title}</div><div className="f2-player-channel">{playingVideo.channel}</div></div>
              <div className="f2-player-actions">
                <a className="f2-player-yt" href={`https://youtube.com/watch?v=${playingVideo.id}`} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
                <button className="f2-player-close" onClick={() => setPlayingVideo(null)}>✕</button>
              </div>
            </div>
            <div className="f2-player-embed"><iframe src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen /></div>
          </div>
        </div>
      )}
    </>
  );
}
