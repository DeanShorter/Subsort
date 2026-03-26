'use client';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import { supabase } from '../../lib/supabase';
import { trackEvent } from '../../lib/track';
import Link from 'next/link';

function Sparkline({ trend = 'flat', scoreColor = 'var(--amber)' }) {
  const heights = trend === 'up' ? [35,40,38,42,50,48,55,60,65,72]
    : trend === 'flat' ? [60,58,62,60,63,61,64,62,65,65]
    : [72,68,70,65,63,60,62,58,55,52];
  return (
    <div className="h2-spark">
      {heights.map((h, i) => (
        <div key={i} className="h2-spark-dot" style={{
          height: `${(h / 72) * 100}%`,
          background: scoreColor,
          opacity: i === heights.length - 1 ? 1 : 0.4,
        }} />
      ))}
    </div>
  );
}

export default function Home2Page() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, categoryColours, loading: dataLoading,
    chCats, formatCount, findDeadChannels,
    feedVideos, feedVideosLoaded, setFeedVideos,
  } = useChannelData();

  const [loadingVideos, setLoadingVideos] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [actionDismissed, setActionDismissed] = useState(false);

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
  const uncatCount = channels.filter(c => !chCats(c).length).length;

  const score = useMemo(() => {
    if (!channels.length) return 0;
    return Math.round(((channels.length - inactiveCount) / channels.length) * 100);
  }, [channels, inactiveCount]);

  // Mood system based on score and last scrub
  const mood = useMemo(() => {
    if (score >= 80) return 'encouraging';
    if (score >= 65) return 'nudging';
    if (score >= 50) return 'impatient';
    if (score >= 35) return 'annoyed';
    return 'giving_up';
  }, [score]);

  const scoreColour = mood === 'encouraging' ? 'var(--accent)' : mood === 'nudging' ? 'var(--amber)' : mood === 'impatient' ? 'var(--amber)' : mood === 'annoyed' ? 'var(--red)' : 'var(--text-dim)';
  const sparkTrend = mood === 'encouraging' ? 'up' : mood === 'nudging' ? 'flat' : 'down';

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const moodEmoji = { encouraging: '😎', nudging: '😐', impatient: '😤', annoyed: '😡', giving_up: '💀' };
  const moodGreeting = { encouraging: 'Not bad', nudging: 'Getting there', impatient: 'Still here?', annoyed: 'We need to talk', giving_up: 'Fine. Whatever.' };
  const moodBtnText = { encouraging: 'Keep scrubbing', nudging: 'Scrub now', impatient: 'Scrub now', annoyed: 'Fix this mess', giving_up: 'Prove me wrong' };

  const roastText = useMemo(() => {
    const active = channels.length - inactiveCount;
    if (!channels.length) return '';
    if (mood === 'encouraging') return `You scrubbed recently and your score is solid. <strong>${active} active channels</strong> out of ${channels.length}. Keep going.`;
    if (mood === 'nudging') return `<strong>${channels.length} subscriptions</strong> and you engage with ${active} of them. The other ${inactiveCount} are just paying emotional rent in your feed.`;
    if (mood === 'impatient') return `Your score dropped. Those dead channels are multiplying. <strong>${inactiveCount} inactive</strong> and counting.`;
    if (mood === 'annoyed') return `Remember when you said you'd fix your feed? You've got <strong>${inactiveCount} channels</strong> you've never watched. Just sitting there. Judging you.`;
    return `At this point I think you and your <strong>${inactiveCount} dead channels</strong> deserve each other. I'm not angry, I'm just disappointed.`;
  }, [channels, inactiveCount, mood]);

  const actionLabel = useMemo(() => {
    if (mood === 'encouraging') return "A few loose ends to tidy up when you're ready.";
    if (mood === 'nudging') return `Those ${inactiveCount} inactive channels aren't going to scrub themselves.`;
    if (mood === 'impatient') return "Your feed is getting worse, not better. Fix it.";
    if (mood === 'annoyed') return `Seriously. ${inactiveCount} channels you've never watched. Just sitting there.`;
    return "I'll be here when you're ready. If you're ever ready.";
  }, [mood, inactiveCount]);

  // Favourite videos
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

  const ringC = 2 * Math.PI * 21;
  const ringOffset = ringC - (ringC * score / 100);

  if (dataLoading) return <div className="home-feed-loading"><span className="spinner" /> Loading...</div>;

  const greetingTime = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const lastRefresh = (() => { try { const ts = localStorage.getItem('subsort_rss_ts'); return ts ? timeAgo(new Date(parseInt(ts)).toISOString()) : 'Never'; } catch { return 'Never'; } })();
  const subtitle = channels.length ? `${channels.length} subscriptions · ${categories.length} categories` : 'Sync your subscriptions to get started.';

  if (!user) {
    return (
      <main className="home-main">
        <div className="db-header-bar">
          <div className="db-greeting"><h1>Good <span>morning</span>, <span>there</span>.</h1><p>Sign in to get started.</p></div>
        </div>
        <div className="home-feed-empty"><p className="home-feed-empty-text">Sign in to get started.</p><button className="btn-accent" onClick={signIn}>Sign in with Google</button></div>
      </main>
    );
  }

  return (
    <>
      <div className="db-header-bar">
        <div className="db-greeting">
          <h1>Good <span>{greetingTime}</span>, <span>{userName}</span>.</h1>
          <p>{subtitle}</p>
        </div>
        <div className="ph-right">
          <span className="db-clock">Last refresh: {lastRefresh}</span>
        </div>
      </div>

      <div className="h2-content">
        {/* ═══ CRITIC CARD ═══ */}
        <div className={`h2-critic-card mood-${mood}`}>
          <div className="h2-critic-top">
            <div className="h2-critic-ring">
              <svg viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="21" fill="none" stroke="var(--surface-3)" strokeWidth="3.5" />
                <circle cx="26" cy="26" r="21" fill="none" stroke={scoreColour} strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray={ringC} strokeDashoffset={ringOffset} transform="rotate(-90 26 26)" />
              </svg>
              <span className="h2-critic-val" style={{ color: scoreColour }}>{score}%</span>
            </div>
            <div className="h2-critic-text">
              <div className="h2-critic-greeting">{moodEmoji[mood]} {moodGreeting[mood]}, {userName}.</div>
              <div className="h2-critic-roast" dangerouslySetInnerHTML={{ __html: roastText }} />
            </div>
            <div className="h2-critic-right">
              <button className="cb-share" title="Share your score">
                <svg viewBox="0 0 16 16"><path d="M4 8V13a1 1 0 001 1h6a1 1 0 001-1V8" /><polyline points="8 2 8 10" /><polyline points="5 5 8 2 11 5" /></svg>
              </button>
              <Sparkline trend={sparkTrend} scoreColor={scoreColour} />
            </div>
          </div>
        </div>

        {/* ═══ ACTION CARD ═══ */}
        {!actionDismissed && inactiveCount > 0 && (
          <div className={`h2-action-card mood-${mood}`}>
            <div className="h2-action-top">
              <span className="h2-action-label">{actionLabel}</span>
            </div>
            <div className="h2-action-items">
              <div className="h2-action-item">
                <div className="h2-action-dot" style={{ background: 'var(--red)' }} />
                <div className="h2-action-item-info">
                  <div className="h2-action-item-val" style={{ color: 'var(--red)' }}>{inactiveCount}</div>
                  <div className="h2-action-item-label">Inactive channels</div>
                </div>
              </div>
              <div className="h2-action-item">
                <div className="h2-action-dot" style={{ background: 'var(--amber)' }} />
                <div className="h2-action-item-info">
                  <div className="h2-action-item-val" style={{ color: 'var(--amber)' }}>{uncatCount}</div>
                  <div className="h2-action-item-label">Uncategorised</div>
                </div>
              </div>
              <div className="h2-action-item">
                <div className="h2-action-dot" style={{ background: 'var(--accent)' }} />
                <div className="h2-action-item-info">
                  <div className="h2-action-item-val" style={{ color: 'var(--accent)' }}>{favCount}</div>
                  <div className="h2-action-item-label">Favourites</div>
                </div>
              </div>
            </div>
            <div className="h2-action-cta">
              <Link href="/subscriptions2" className="h2-action-btn">{moodBtnText[mood]}</Link>
              <span className="h2-action-dismiss" onClick={() => setActionDismissed(true)}>Maybe later</span>
            </div>
          </div>
        )}

        {/* ═══ FAVOURITES ═══ */}
        {favVideos.length > 0 && (
          <div className="h2-section">
            <div className="h2-section-header">
              <div className="section-left">
                <span className="h2-section-title">⭐ New from your favourites</span>
                <span className="h2-section-count">{favVideos.length} new</span>
              </div>
              <Link href="/feeds2?cat=__favs__" className="h2-section-link">View all →</Link>
            </div>
            <div className="h2-fav-grid">
              {favVideos.map((v, i) => {
                const isNew = v.publishedAt && (Date.now() - new Date(v.publishedAt).getTime()) < 24 * 60 * 60 * 1000;
                return (
                  <div key={v.id} className="h2-fav-card" style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
                    onClick={() => { trackEvent('video_click_home'); setPlayingVideo({ id: v.id, title: v.title, channel: v.channel }); }}>
                    <div className="h2-fav-thumb">
                      <img src={v.thumbnail} alt="" loading="lazy" onLoad={e => e.currentTarget.classList.add('loaded')} />
                      <div className="h2-fav-overlay" />
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

        {/* ═══ TODAY BAR ═══ */}
        {todayVideos.length > 0 && (
          <div className="h2-section">
            <Link href="/feeds2" className="h2-today-bar">
              <span className="h2-today-icon">📬</span>
              <div className="h2-today-text">
                <div className="h2-today-title">{todayVideos.length} new videos today</div>
                <div className="h2-today-sub">across {todayCatDots.length} categories from {todayChannelCount} channels</div>
              </div>
              <div className="h2-today-cats h2-today-cats-overlap">
                {todayCatDots.map(cat => (<div key={cat} className="h2-today-dot-overlap" style={{ background: categoryColours[cat] || 'var(--accent)' }} />))}
              </div>
              <span className="h2-today-arrow">→</span>
            </Link>
          </div>
        )}

        {/* ═══ ACTIVITY + DISCOVER ═══ */}
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
                <div className="h2-disc-card"><div className="h2-disc-avatar" style={{ background: 'rgba(232,135,92,0.15)', color: 'var(--orange)' }}>SS</div><div className="h2-disc-name">Sky Sports F1</div><div className="h2-disc-subs">2.1M subs</div></div>
                <div className="h2-disc-card"><div className="h2-disc-avatar" style={{ background: 'rgba(62,207,160,0.1)', color: 'var(--accent)' }}>JC</div><div className="h2-disc-name">Jacob Collier</div><div className="h2-disc-subs">4.8M subs</div></div>
                <div className="h2-disc-card"><div className="h2-disc-avatar" style={{ background: 'rgba(239,159,39,0.08)', color: 'var(--amber)' }}>VX</div><div className="h2-disc-name">Vox</div><div className="h2-disc-subs">12M subs</div></div>
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
