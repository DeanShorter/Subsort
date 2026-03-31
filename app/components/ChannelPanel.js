'use client';
import { useMemo, useState, useEffect } from 'react';
import { useChannelData } from './ChannelDataContext';

export default function ChannelPanel({ channelId, onClose }) {
  const { channels, categories, subcategories, categoryColours, chCats, formatCount, getChannelState } = useChannelData();

  const ch = channels.find(c => c.id === channelId);

  // Get watch history data for this channel
  const watchActivity = useMemo(() => {
    if (!ch || typeof window === 'undefined') return null;
    try {
      const wh = JSON.parse(localStorage.getItem('subsort_watchhistory'));
      if (!wh?.topChannels) return null;
      // Match against all possible identifiers
      const ids = new Set([
        ch.channelId,
        ch.id,
        ch.customUrl?.replace(/^@/, ''),
        ch.name?.toLowerCase(),
      ].filter(Boolean));

      const match = wh.topChannels.find(tc => {
        const tcUrlId = tc.channelUrl?.replace(/\/$/, '').split('/').pop();
        const tcHandle = tc.channelUrl?.match(/@([^/]+)/)?.[1];
        return (
          (tcUrlId && ids.has(tcUrlId)) ||
          (tcHandle && ids.has(tcHandle.toLowerCase())) ||
          (tc.channelName && ids.has(tc.channelName.toLowerCase()))
        );
      });
      if (!match) return { watched: 0, lastWatched: null, rate: 'none' };
      const pct = ch.videoCount ? Math.round((match.count / ch.videoCount) * 100) : 0;
      const rate = pct >= 50 ? 'high' : pct >= 20 ? 'medium' : pct >= 5 ? 'low' : 'minimal';
      return { watched: match.count, lastWatched: null, rate, pct };
    } catch { return null; }
  }, [ch]);

  if (!ch) return null;

  const cats = chCats(ch);
  const cat = cats[0] || '';
  const col = categoryColours[cat] || 'var(--accent)';
  const initials = (ch.name || '??').substring(0, 2).toUpperCase();
  const handle = ch.customUrl ? `@${ch.customUrl.replace(/^@/, '')}` : '';
  const state = getChannelState(ch);
  const ytUrl = ch.customUrl
    ? `https://youtube.com/@${ch.customUrl.replace(/^@/, '')}`
    : `https://youtube.com/channel/${ch.channelId || ch.id}`;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="sp-slide-panel">
      {/* Header */}
      <div className="sp-panel-header">
        <div>
          <div className="sp-panel-avatar" style={{ background: col }}>{ch.thumbnail ? <img src={ch.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}</div>
          <div className="sp-panel-name">{ch.name}</div>
          {handle && <div className="sp-panel-handle">{handle}</div>}
        </div>
        <button className="sp-panel-close" onClick={onClose}>&times;</button>
      </div>

      {/* Stats */}
      <div className="sp-panel-section">
        <div className="sp-panel-section-title">CHANNEL STATS</div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Subscribers</span><span className="sp-panel-stat-value">{ch.subscriberCount ? formatCount(ch.subscriberCount) : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Videos</span><span className="sp-panel-stat-value">{ch.videoCount != null ? ch.videoCount.toLocaleString() : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Subscribed</span><span className="sp-panel-stat-value">{fmtDate(ch.subscribedAt)}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Channel created</span><span className="sp-panel-stat-value">{fmtDate(ch.channelCreatedAt)}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Total views</span><span className="sp-panel-stat-value">{ch.viewCount ? formatCount(ch.viewCount) : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Status</span><span className={`s2-status ${state}`}>{state === 'dead' ? 'Dead' : state === 'inactive' ? 'Inactive' : 'Active'}</span></div>
      </div>

      {/* Your Activity */}
      <div className="sp-panel-section">
        <div className="sp-panel-section-title">YOUR ACTIVITY</div>
        <div className="sp-panel-stat-row">
          <span className="sp-panel-stat-label">Videos watched</span>
          <span className="sp-panel-stat-value">
            {watchActivity ? `${watchActivity.watched} of ${ch.videoCount?.toLocaleString() || '—'}` : `— of ${ch.videoCount?.toLocaleString() || '—'}`}
          </span>
        </div>
        <div className="sp-panel-bar">
          <div className="sp-panel-bar-fill" style={{ width: `${watchActivity?.pct || 0}%`, background: watchActivity?.pct >= 50 ? 'var(--accent)' : watchActivity?.pct >= 20 ? 'var(--orange)' : 'var(--text-muted)' }} />
        </div>
        <div className="sp-panel-stat-row" style={{ marginTop: 8 }}>
          <span className="sp-panel-stat-label">Watch rate</span>
          <span className="sp-panel-stat-value" style={{
            color: !watchActivity ? 'var(--text-muted)' :
              watchActivity.rate === 'high' ? 'var(--accent)' :
              watchActivity.rate === 'medium' ? 'var(--orange)' :
              watchActivity.rate === 'low' ? 'var(--text-secondary)' : 'var(--text-muted)'
          }}>
            {!watchActivity ? 'Upload watch history' :
              watchActivity.rate === 'high' ? 'High' :
              watchActivity.rate === 'medium' ? 'Medium' :
              watchActivity.rate === 'low' ? 'Low' :
              watchActivity.rate === 'minimal' ? 'Minimal' : 'None'}
          </span>
        </div>
      </div>

      {/* Category */}
      <div className="sp-panel-section">
        <div className="sp-panel-section-title">CATEGORY</div>
        <div className="sp-panel-tags">
          {cats.length > 0 ? cats.map(c => (
            <span key={c} className="sp-panel-tag" style={{ background: `${categoryColours[c] || 'var(--accent)'}15`, color: categoryColours[c] || 'var(--accent)' }}>{c}</span>
          )) : (
            <span className="sp-panel-tag" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Uncategorised</span>
          )}
        </div>
      </div>

      {/* Subcategory */}
      <div className="sp-panel-section">
        <div className="sp-panel-section-title">SUBCATEGORY</div>
        <div className="sp-panel-tags">
          {ch.subcategory ? (
            <span className="sp-panel-tag" style={{ background: `${col}15`, color: col }}>{ch.subcategory}</span>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>None assigned</span>
          )}
        </div>
      </div>

      {/* Notes */}
      {ch.notes && (
        <div className="sp-panel-section">
          <div className="sp-panel-section-title">NOTES</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ch.notes}</div>
        </div>
      )}

      {/* Critic */}
      <div className="sp-panel-critic">
        <div className="sp-panel-critic-header">
          <div className="sp-panel-critic-icon" style={{ background: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3 3 .4-2.2 2.1.5 3L6 8l-2.8 1.5.5-3L1.5 4.4l3-.4z" fill="#fff" /></svg>
          </div>
          <span className="sp-panel-critic-label" style={{ color: 'var(--accent-text)' }}>The Critic</span>
        </div>
        <div className="sp-panel-critic-quote" style={{ color: 'var(--orange-text)' }}>
          {state === 'active' && ch.favourited && `"One of your favourites. ${ch.subscriberCount > 100000 ? 'Popular choice.' : 'Solid pick.'} Keep watching."`}
          {state === 'active' && !ch.favourited && `"Active channel, regular uploads. ${cats.length === 0 ? 'Needs a category though.' : 'Doing fine.'}"`}
          {state === 'inactive' && `"This one's been quiet. Might be time to reconsider."`}
          {state === 'dead' && `"No uploads, low activity. This is dead weight, Dean."`}
        </div>
      </div>

      {/* Actions */}
      <div className="sp-panel-actions">
        <button className="sp-panel-action-btn" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }} onClick={onClose}>Recategorise</button>
        <a className="sp-panel-action-btn" style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} href={ytUrl} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
      </div>
    </div>
  );
}
