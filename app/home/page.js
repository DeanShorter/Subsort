'use client';
import { useMemo, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { useStash } from '../../hooks/useStash';
import { calculateHealthScore, buildHealthScoreInput } from '../../lib/health-score';
import { timeAgo } from '../../lib/youtube';
import Link from 'next/link';

export default function HomePage() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours,
    chCats, chIsUncategorised, getChannelState, formatCount,
    feedVideos, feedVideosLoaded, setFeedVideos, loading,
  } = useChannelData();
  const { items: stashItems, collections: stashCollections } = useStash(user);

  // Load feed videos from cache if not already loaded
  useEffect(() => {
    if (!channels.length || feedVideosLoaded) return;
    (async () => {
      const channelIds = channels.map(c => c.channelId).filter(Boolean);
      if (!channelIds.length) return;
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const allCached = [];
      for (let i = 0; i < channelIds.length; i += 300) {
        const batch = channelIds.slice(i, i + 300);
        const { data } = await supabase.from('cached_videos').select('*').in('channel_id', batch).gte('published_at', since).order('published_at', { ascending: false }).limit(2000);
        if (data) allCached.push(...data);
      }
      const vids = allCached.map(row => ({
        id: row.video_id,
        title: row.title || '',
        channel: '',
        channelId: row.channel_id,
        thumbnail: row.thumbnail || `https://i.ytimg.com/vi/${row.video_id}/mqdefault.jpg`,
        publishedAt: row.published_at,
        type: row.video_type || 'video',
      }));
      setFeedVideos(vids);
    })();
  }, [channels, feedVideosLoaded, setFeedVideos]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Health score
  const healthResult = useMemo(() => {
    if (!channels.length) return null;
    const { input, needAttentionCount } = buildHealthScoreInput(
      channels, categories, subcategories, chIsUncategorised, getChannelState,
      feedVideos, stashItems, stashCollections
    );
    return calculateHealthScore(input, userName, needAttentionCount);
  }, [channels, categories, subcategories, chIsUncategorised, getChannelState, feedVideos, stashItems, stashCollections, userName]);

  // Quick stats
  const stats = useMemo(() => {
    if (!channels.length) return null;
    const sorted = [...channels].filter(c => c.subscribedAt).sort((a, b) => new Date(a.subscribedAt) - new Date(b.subscribedAt));
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    const oldestAge = oldest ? Math.floor((Date.now() - new Date(oldest.subscribedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
    const newestAgo = newest ? timeAgo(newest.subscribedAt) : '';

    // This week's uploads
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyVids = feedVideos.filter(v => v.publishedAt && new Date(v.publishedAt).getTime() >= weekAgo);
    const weeklyChannels = new Set(weeklyVids.map(v => v.channelId)).size;

    return { oldest, newest, oldestAge, newestAgo, weeklyVids: weeklyVids.length, weeklyChannels };
  }, [channels, feedVideos]);

  // Today's feed by category
  const feedSummary = useMemo(() => {
    // Show last 24 hours of videos (not just since midnight)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayVids = feedVideos.filter(v => v.publishedAt && new Date(v.publishedAt) >= cutoff);
    const catCounts = {};
    const channelSet = new Set();
    todayVids.forEach(v => {
      channelSet.add(v.channelId);
      const ch = channels.find(c => c.channelId === v.channelId);
      if (ch) {
        const cats = chCats(ch);
        const cat = cats[0] || 'Unsorted';
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }
    });
    const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] || 1;
    const catColors = ['var(--accent)', 'var(--orange)', 'var(--iris)', 'var(--ocean)', '#888'];
    return {
      total: todayVids.length,
      channelCount: channelSet.size,
      catCount: Object.keys(catCounts).length,
      rows: sorted.map(([name, count], i) => ({ name, count, pct: (count / max) * 100, color: categoryColours[name] || catColors[i] || '#888' })),
    };
  }, [feedVideos, channels, chCats, categoryColours]);

  // Favourites with latest video
  const favourites = useMemo(() => {
    const favChannels = channels.filter(c => c.favourited).slice(0, 4);
    return favChannels.map(ch => {
      const latestVid = feedVideos.find(v => v.channelId === ch.channelId);
      return { ...ch, latestVid };
    });
  }, [channels, feedVideos]);

  // On This Day — subscription anniversaries
  const onThisDay = useMemo(() => {
    const today = new Date();
    const m = today.getMonth();
    const d = today.getDate();
    return channels.filter(ch => {
      if (!ch.subscribedAt) return false;
      const sub = new Date(ch.subscribedAt);
      return sub.getMonth() === m && sub.getDate() === d && sub.getFullYear() < today.getFullYear();
    }).map(ch => {
      const years = today.getFullYear() - new Date(ch.subscribedAt).getFullYear();
      const vidsSince = feedVideos.filter(v => v.channelId === ch.channelId).length;
      return { ...ch, years, vidsSince };
    })[0] || null;
  }, [channels, feedVideos]);

  // Latest uploads
  const latestUploads = useMemo(() => {
    return feedVideos
      .filter(v => v.publishedAt)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 5)
      .map(v => {
        const ch = channels.find(c => c.channelId === v.channelId);
        return { ...v, channelName: ch?.name || v.channel || '' };
      });
  }, [feedVideos, channels]);

  if (loading) return <div className="home-feed-loading"><span className="spinner" /> Loading...</div>;

  if (!user) {
    return (
      <div className="hp-page">
        <div className="hp-header">
          <div className="hp-greeting">Welcome to Subsnub</div>
          <div className="hp-date">Sign in to get started</div>
        </div>
        <div className="home-feed-empty">
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </div>
    );
  }

  const score = healthResult?.total ?? 0;
  const scoreMood = score >= 70 ? 'var(--accent)' : 'var(--orange)';
  const scoreQuote = healthResult?.quote || '';

  return (
    <div className="hp-page">
      {/* Header */}
      <div className="hp-header">
        <div className="hp-greeting">{greeting}, {userName}.</div>
        <div className="hp-date">{dateStr}</div>
      </div>

      {/* Critic strip */}
      {healthResult && (
        <div className="hp-critic-strip">
          <div className="hp-critic-score" style={{ background: scoreMood }}>{score}</div>
          <span className="hp-critic-copy">&ldquo;{scoreQuote}&rdquo;</span>
          <Link href="/critic" className="hp-critic-link">
            The Critic
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        </div>
      )}

      <div className="hp-content">
        {/* Quick stats */}
        {stats && (
          <div className="hp-quick-stats">
            <div className="hp-qstat">
              <div className="hp-qstat-val">{channels.length}</div>
              <div className="hp-qstat-lbl">subscriptions</div>
            </div>
            <div className="hp-qstat">
              <div className="hp-qstat-val">{stats.weeklyVids}</div>
              <div className="hp-qstat-lbl">uploaded this week</div>
              <div className="hp-qstat-detail">from {stats.weeklyChannels} channels</div>
            </div>
            <div className="hp-qstat">
              <div className="hp-qstat-val hp-qstat-val-sm">{stats.oldest?.name || '—'}</div>
              <div className="hp-qstat-lbl">longest subscription</div>
              <div className="hp-qstat-detail">{stats.oldest ? `since ${new Date(stats.oldest.subscribedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · ${stats.oldestAge} years` : ''}</div>
            </div>
            <div className="hp-qstat">
              <div className="hp-qstat-val hp-qstat-val-sm">{stats.newest?.name || '—'}</div>
              <div className="hp-qstat-lbl">newest subscription</div>
              <div className="hp-qstat-detail">{stats.newestAgo}</div>
            </div>
          </div>
        )}

        <div className="hp-grid">
          {/* LEFT COLUMN */}
          <div>
            {/* Today's feed */}
            <div className="hp-section">
              <div className="hp-section-head">
                <span className="hp-section-title">Recent feed</span>
                <Link href="/feeds" className="hp-section-link">Open feed <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
              </div>
              <div className="hp-feed-card">
                <div className="hp-feed-headline">{feedSummary.total} new videos</div>
                <div className="hp-feed-sub">from {feedSummary.channelCount} channels across {feedSummary.catCount} categories</div>
                <div className="hp-feed-cats">
                  {feedSummary.rows.map(r => (
                    <div key={r.name} className="hp-feed-cat-row">
                      <span className="hp-feed-cat-label">{r.name}</span>
                      <div className="hp-feed-cat-bar-wrap"><div className="hp-feed-cat-bar" style={{ width: `${r.pct}%`, background: r.color }} /></div>
                      <span className="hp-feed-cat-count">{r.count} video{r.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                  {feedSummary.rows.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No uploads today yet</div>}
                </div>
              </div>
            </div>

            {/* On This Day */}
            {onThisDay && (
              <div className="hp-section">
                <div className="hp-section-head">
                  <span className="hp-section-title">On this day</span>
                </div>
                <div className="hp-otd-card">
                  <div className="hp-otd-item">
                    <div className="hp-otd-icon tex-pinstripe" style={{ background: 'var(--iris)' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#fff" strokeWidth="1.2" /><path d="M7 4v3.5h2.5" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" /></svg>
                    </div>
                    <div className="hp-otd-body">
                      <div className="hp-otd-label">ON THIS DAY</div>
                      <div className="hp-otd-text">&ldquo;{onThisDay.years} year{onThisDay.years !== 1 ? 's' : ''} ago today you subscribed to {onThisDay.name}. {onThisDay.vidsSince > 0 ? `They've uploaded ${onThisDay.vidsSince} videos since.` : ''} Still going strong.&rdquo;</div>
                      <div className="hp-otd-channel">
                        <div className="hp-otd-ch-av" style={{ background: categoryColours[chCats(onThisDay)[0]] || 'var(--iris)' }}>
                          {onThisDay.thumbnail ? <img src={onThisDay.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (onThisDay.name || '??').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="hp-otd-ch-name">{onThisDay.name}</span>
                        <span className="hp-otd-ch-meta">&middot; {formatCount(onThisDay.subscriberCount)} subs</span>
                      </div>
                      <Link href={`/subscriptions/${encodeURIComponent(onThisDay.customUrl?.replace(/^@/, '') || onThisDay.channelId || onThisDay.id)}`} className="hp-otd-cta">View channel</Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Favourites */}
            <div className="hp-section">
              <div className="hp-section-head">
                <span className="hp-section-title">Your favourites</span>
                <Link href="/subscriptions" className="hp-section-link">
                  View all {channels.filter(c => c.favourited).length}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </Link>
              </div>
              <div className="hp-fav-card">
                {favourites.length > 0 ? favourites.map(ch => (
                  <Link key={ch.id} href={`/subscriptions/${encodeURIComponent(ch.customUrl?.replace(/^@/, '') || ch.channelId || ch.id)}`} className="hp-fav-item">
                    <div className="hp-fav-av" style={{ background: categoryColours[chCats(ch)[0]] || 'var(--accent)' }}>
                      {ch.thumbnail ? <img src={ch.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (ch.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="hp-fav-info">
                      <div className="hp-fav-name">{ch.name}</div>
                      <div className="hp-fav-video">{ch.latestVid?.title || 'No recent uploads'}</div>
                    </div>
                    <div className="hp-fav-meta">
                      <div className="hp-fav-star">&#9733;</div>
                      <div>{ch.latestVid ? timeAgo(ch.latestVid.publishedAt) : ''}</div>
                    </div>
                  </Link>
                )) : (
                  <div style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>Star your favourite channels to see them here</div>
                )}
              </div>
            </div>

            {/* Latest uploads */}
            <div className="hp-section">
              <div className="hp-section-head">
                <span className="hp-section-title">Latest uploads</span>
                <Link href="/feeds" className="hp-section-link">View feed <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
              </div>
              <div className="hp-uploads-card">
                {latestUploads.map(v => (
                  <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="hp-upload-row">
                    <div className="hp-upload-thumb">
                      {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div className="hp-upload-info">
                      <div className="hp-upload-title">{v.title}</div>
                      <div className="hp-upload-channel">{v.channelName}</div>
                    </div>
                    <div className="hp-upload-time">{timeAgo(v.publishedAt)}</div>
                  </a>
                ))}
                {latestUploads.length === 0 && <div style={{ padding: 20, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>No uploads yet</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
