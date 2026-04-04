'use client';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import { useChannelData } from '../../components/ChannelDataContext';

export default function ChannelDetailPage() {
  const { channelSlug } = useParams();
  const slug = decodeURIComponent(channelSlug);
  const { user } = useAuth();
  const {
    channels, categories, subcategories, categoryColours,
    chCats, formatCount, getChannelState, feedVideos, toggleFavourite,
  } = useChannelData();

  // Find channel by customUrl, channelId, or id
  const ch = useMemo(() => {
    return channels.find(c =>
      c.customUrl?.replace(/^@/, '') === slug ||
      c.channelId === slug ||
      c.id === slug
    );
  }, [channels, slug]);

  // Recent videos for this channel
  const recentVids = useMemo(() => {
    if (!ch) return [];
    return feedVideos
      .filter(v => v.channelId === ch.channelId)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 5);
  }, [ch, feedVideos]);

  // Upload frequency
  const uploadStats = useMemo(() => {
    if (!ch) return { frequency: null, lastUpload: null, thisYear: 0 };
    const vids = feedVideos
      .filter(v => v.channelId === ch.channelId && v.publishedAt)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const lastUpload = vids[0]?.publishedAt || null;
    const thisYear = vids.filter(v => new Date(v.publishedAt).getFullYear() === new Date().getFullYear()).length;
    let frequency = null;
    if (vids.length >= 2) {
      const newest = new Date(vids[0].publishedAt);
      const oldest = new Date(vids[vids.length - 1].publishedAt);
      const daySpan = (newest - oldest) / (1000 * 60 * 60 * 24);
      if (daySpan > 0) {
        const perWeek = (vids.length - 1) / (daySpan / 7);
        if (perWeek >= 5) frequency = '~Daily';
        else if (perWeek >= 2) frequency = `~${Math.round(perWeek)}/week`;
        else if (perWeek >= 0.8) frequency = '~Weekly';
        else if (perWeek >= 0.4) frequency = '~Biweekly';
        else frequency = '~Monthly';
      }
    }
    return { frequency, lastUpload, thisYear };
  }, [ch, feedVideos]);

  // Related channels (same category)
  const relatedChannels = useMemo(() => {
    if (!ch) return [];
    const cats = chCats(ch);
    if (!cats.length) return [];
    return channels
      .filter(c => c.id !== ch.id && chCats(c).some(cat => cats.includes(cat)))
      .slice(0, 4);
  }, [ch, channels, chCats]);

  // Activity bars (placeholder from feed videos)
  const activityBars = useMemo(() => {
    if (!ch) return [];
    const vids = feedVideos.filter(v => v.channelId === ch.channelId && v.publishedAt);
    const bars = [];
    const now = Date.now();
    for (let i = 47; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const count = vids.filter(v => { const t = new Date(v.publishedAt).getTime(); return t >= weekStart && t < weekEnd; }).length;
      bars.push(count);
    }
    const max = Math.max(...bars, 1);
    return bars.map(c => Math.max(2, (c / max) * 100));
  }, [ch, feedVideos]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const timeAgoShort = (d) => {
    if (!d) return '—';
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  if (!ch) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="chd-breadcrumb">
          <Link href="/subscriptions">Subscriptions</Link>
          <span>/</span>
          <span>{slug}</span>
        </div>
        <div className="stash-empty" style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Channel not found</div>
          <Link href="/subscriptions" style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none', marginTop: 12 }}>Back to Subscriptions</Link>
        </div>
      </div>
    );
  }

  const cats = chCats(ch);
  const cat = cats[0] || '';
  const col = categoryColours[cat] || 'var(--accent)';
  const state = getChannelState(ch);
  const handle = ch.customUrl ? `@${ch.customUrl.replace(/^@/, '')}` : '';
  const initials = (ch.name || '??').substring(0, 2).toUpperCase();
  const ytUrl = ch.customUrl
    ? `https://youtube.com/@${ch.customUrl.replace(/^@/, '')}`
    : `https://youtube.com/channel/${ch.channelId || ch.id}`;

  // Subscription age
  const subAge = ch.subscribedAt
    ? Math.floor((Date.now() - new Date(ch.subscribedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const subLabel = subAge === null ? 'Unknown' : subAge >= 5 ? 'OG' : subAge >= 2 ? 'Veteran' : subAge >= 1 ? 'Regular' : 'Newcomer';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>

      {/* Breadcrumb */}
      <div className="chd-breadcrumb">
        <Link href="/subscriptions">Subscriptions</Link>
        <span>/</span>
        <span>{ch.name}</span>
      </div>

      {/* Channel header */}
      <div className="chd-header">
        <div className="chd-header-left">
          <div className="chd-avatar" style={{ background: col }}>
            {ch.thumbnail ? <img src={ch.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
          </div>
          <div>
            <div className="chd-name">{ch.name}</div>
            {handle && <div className="chd-handle">{handle}</div>}
            <div className="chd-header-stats">
              <div className="chd-header-stat">
                <div className="chd-header-stat-value">{formatCount(ch.subscriberCount)}</div>
                <div className="chd-header-stat-label">subscribers</div>
              </div>
              <div className="chd-header-stat">
                <div className="chd-header-stat-value">{ch.videoCount?.toLocaleString() || '—'}</div>
                <div className="chd-header-stat-label">videos</div>
              </div>
              <div className="chd-header-stat">
                <div className="chd-header-stat-value">{formatCount(ch.viewCount)}</div>
                <div className="chd-header-stat-label">total views</div>
              </div>
            </div>
          </div>
        </div>
        <div className="chd-header-actions">
          <button className="chd-btn" onClick={() => toggleFavourite(ch.id)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.8 3.6L13 5.7l-3 2.8.7 4.1L7 10.5l-3.7 2.1.7-4.1-3-2.8 4.2-.6z" fill={ch.favourited ? 'var(--orange)' : 'none'} stroke={ch.favourited ? 'var(--orange)' : 'currentColor'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {ch.favourited ? 'Favourited' : 'Favourite'}
          </button>
          <a className="chd-btn chd-btn-primary" href={ytUrl} target="_blank" rel="noopener noreferrer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l5 4-5 4z" fill="#fff" /></svg>
            Open on YouTube
          </a>
        </div>
      </div>

      {/* Two-column body */}
      <div className="chd-body">

        {/* Left column */}
        <div className="chd-main">

          {/* Critic assessment */}
          <div className="chd-section">
            <div className="chd-section-title">THE CRITIC&rsquo;S ASSESSMENT</div>
            <div className="chd-critic-card">
              <div className="chd-critic-head tex-pinstripe" style={{ background: state === 'dead' ? 'var(--text-muted)' : state === 'inactive' ? 'var(--orange)' : 'var(--accent)' }}>
                <div className="chd-critic-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3 3 .4-2.2 2.1.5 3L6 8l-2.8 1.5.5-3L1.5 4.4l3-.4z" fill="#fff" /></svg>
                </div>
                <span className="chd-critic-label">The Critic — {state === 'active' ? 'Impressed' : state === 'inactive' ? 'Concerned' : 'Unimpressed'}</span>
              </div>
              <div className="chd-critic-body">
                <div className="chd-critic-quote">
                  {state === 'active' && ch.favourited && `"Consistent uploads, growing subscriber base, and the content stays focused. This is a channel that knows what it is. You subscribed ${subAge ? subAge + ' years' : 'a while'} ago and they haven't given you a reason to leave. Keeper."`}
                  {state === 'active' && !ch.favourited && `"Active channel with regular uploads. ${cats.length ? `Fits well in ${cats[0]}.` : 'Needs a category though.'} Solid addition to your subscriptions."`}
                  {state === 'inactive' && `"This one's gone quiet. No recent uploads and the momentum has dropped off. Might be worth checking in — or letting go."`}
                  {state === 'dead' && `"No uploads, low activity. This channel is dead weight in your subscription list. Time to scrub."`}
                </div>
              </div>
            </div>
          </div>

          {/* Upload activity */}
          <div className="chd-section">
            <div className="chd-section-title">UPLOAD ACTIVITY (LAST 12 MONTHS)</div>
            <div className="chd-activity-chart">
              {activityBars.map((pct, i) => (
                <div key={i} className="chd-activity-bar" style={{ height: `${pct}%`, background: 'var(--accent)' }} />
              ))}
            </div>
            <div className="chd-activity-stats">
              <div>
                <div className="chd-activity-stat-value">{uploadStats.frequency || '—'}</div>
                <div className="chd-activity-stat-label">Upload frequency</div>
              </div>
              <div>
                <div className="chd-activity-stat-value">{uploadStats.lastUpload ? timeAgoShort(uploadStats.lastUpload) : '—'}</div>
                <div className="chd-activity-stat-label">Last upload</div>
              </div>
              <div>
                <div className="chd-activity-stat-value">{uploadStats.thisYear}</div>
                <div className="chd-activity-stat-label">Videos this year</div>
              </div>
              <div>
                <div className="chd-activity-stat-value" style={{ color: state === 'active' ? 'var(--accent)' : state === 'inactive' ? 'var(--orange)' : 'var(--text-muted)' }}>
                  {state === 'active' ? 'Consistent' : state === 'inactive' ? 'Irregular' : 'Inactive'}
                </div>
                <div className="chd-activity-stat-label">Upload pattern</div>
              </div>
            </div>
          </div>

          {/* Recent uploads */}
          <div className="chd-section">
            <div className="chd-section-title">RECENT UPLOADS</div>
            {recentVids.length > 0 ? recentVids.map(v => (
              <a key={v.id} className="chd-upload-item" href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">
                <div className="chd-upload-thumb">
                  {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div className="chd-upload-info">
                  <div className="chd-upload-title">{v.title}</div>
                  <div className="chd-upload-meta">{timeAgoShort(v.publishedAt)}</div>
                </div>
              </a>
            )) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No recent uploads available</div>
            )}
            {ch.videoCount > 5 && (
              <a className="chd-show-more" href={ytUrl + '/videos'} target="_blank" rel="noopener noreferrer">
                Show all {ch.videoCount?.toLocaleString()} videos
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </a>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="chd-sidebar">

          {/* Your relationship */}
          <div className="chd-sb-section">
            <div className="chd-sb-title">YOUR RELATIONSHIP</div>
            <div className="chd-tier-badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
              <span>🏅</span> {subLabel} — subscribed {subAge != null ? `${subAge} year${subAge !== 1 ? 's' : ''}` : '—'}
            </div>
            <div className="chd-rel-rows">
              <div className="chd-rel-row"><span className="chd-rel-label">Subscribed</span><span className="chd-rel-value">{fmtDate(ch.subscribedAt)}</span></div>
              <div className="chd-rel-row"><span className="chd-rel-label">Channel created</span><span className="chd-rel-value">{fmtDate(ch.channelCreatedAt)}</span></div>
              <div className="chd-rel-row"><span className="chd-rel-label">Status</span><span className="chd-rel-value" style={{ color: state === 'active' ? 'var(--accent)' : state === 'inactive' ? 'var(--orange)' : 'var(--text-muted)' }}>{state === 'active' ? 'Active' : state === 'inactive' ? 'Inactive' : 'Dead'}</span></div>
            </div>
          </div>

          {/* Category */}
          <div className="chd-sb-section">
            <div className="chd-sb-title">CATEGORY</div>
            <div className="chd-cat-tags">
              {cats.length > 0 ? cats.map(c => (
                <span key={c} className="chd-cat-tag" style={{ background: `${categoryColours[c] || 'var(--accent)'}15`, color: categoryColours[c] || 'var(--accent)' }}>{c}</span>
              )) : (
                <span className="chd-cat-tag" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Unsorted</span>
              )}
            </div>
            {ch.subcategory && (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Subcategory</div>
                <div className="chd-cat-tags" style={{ marginTop: 6 }}>
                  <span className="chd-cat-tag" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>{ch.subcategory}</span>
                </div>
              </>
            )}
          </div>

          {/* Related channels */}
          {relatedChannels.length > 0 && (
            <div className="chd-sb-section">
              <div className="chd-sb-title">ALSO IN {cat.toUpperCase()}{ch.subcategory ? ` › ${ch.subcategory.toUpperCase()}` : ''}</div>
              {relatedChannels.map(rc => {
                const rcInitials = (rc.name || '??').substring(0, 2).toUpperCase();
                const rcCol = categoryColours[chCats(rc)[0]] || 'var(--accent)';
                return (
                  <Link key={rc.id} href={`/subscriptions/${encodeURIComponent(rc.customUrl?.replace(/^@/, '') || rc.channelId || rc.id)}`} className="chd-related-item">
                    <div className="chd-related-av" style={{ background: rcCol }}>
                      {rc.thumbnail ? <img src={rc.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : rcInitials}
                    </div>
                    <div>
                      <div className="chd-related-name">{rc.name}</div>
                      <div className="chd-related-sub">{formatCount(rc.subscriberCount)} subscribers</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="chd-sb-section">
            <div className="chd-sb-title">ACTIONS</div>
            <div className="chd-action-list">
              <a className="chd-action-item" href={ytUrl} target="_blank" rel="noopener noreferrer">
                <div className="chd-action-icon" style={{ background: 'var(--bg-primary)' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M3 6h6M4 9h4" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </div>
                View on YouTube
              </a>
              <button className="chd-action-item destructive">
                <div className="chd-action-icon" style={{ background: '#FCEBEB' }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#E24B4A" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </div>
                Unsubscribe
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
