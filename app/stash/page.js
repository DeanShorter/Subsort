'use client';
import { useState } from 'react';

const PLACEHOLDER_COLLECTIONS = [
  { name: 'Learn later', count: 8, color: 'var(--accent-soft)', icon: 'star', iconColor: 'var(--accent)' },
  { name: 'Weekend binge', count: 11, color: 'var(--orange-soft)', icon: 'play', iconColor: 'var(--orange)' },
  { name: 'Music production', count: 4, color: 'var(--iris-soft)', icon: 'clock', iconColor: 'var(--iris)' },
];

const PLACEHOLDER_VIDEOS = [
  { title: 'Why nobody satisfies like Satie', channel: 'adrian peucelle', initials: 'AP', color: 'var(--accent)', views: '124K views', ago: '2 days ago', duration: '14:22' },
  { title: 'The perfect steak, every single time', channel: 'Andy Cooks', initials: 'AC', color: 'var(--orange)', views: '890K views', ago: '5 days ago', duration: '28:05' },
  { title: 'I mass-produced a mass-producible synth', channel: 'ANDREW HUANG', initials: 'AH', color: 'var(--iris)', views: '340K views', ago: '1 week ago', duration: '11:47' },
  { title: 'The hidden satisfying maths of the superellipse', channel: 'Veritasium', initials: 'VE', color: 'var(--accent)', views: '2.1M views', ago: '1 week ago', duration: '45:12' },
  { title: 'God-tier mass football from 5IVE GUYS', channel: '5IVE GUYS FC', initials: 'GG', color: 'var(--ocean)', views: '67K views', ago: '3 days ago', duration: '8:33' },
  { title: "Why the UK's trains keep failing", channel: 'Alex O\'Connor', initials: 'AO', color: 'var(--orange)', views: '445K views', ago: '4 days ago', duration: '19:44' },
];

function CollectionIcon({ type, color }) {
  if (type === 'star') return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3l2.2 4.5 5 .7-3.6 3.5.8 5L10 14l-4.4 2.7.8-5L3 8.2l5-.7z" fill={color} /></svg>;
  if (type === 'play') return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="1.5" /><path d="M8 7.5v5l4.5-2.5z" fill={color} /></svg>;
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="6.5" stroke={color} strokeWidth="1.5" /><path d="M10 6.5v3.5l2.5 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>;
}

export default function StashPage() {
  const [criticDismissed, setCriticDismissed] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div className="stash-header">
        <div className="stash-header-row">
          <div className="stash-title">Stash <span>your saved videos</span></div>
          <div className="stash-header-right">
            <div className="stash-header-stat">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="9" rx="1.5" stroke="var(--ocean)" strokeWidth="1.2" /><path d="M4 7l2 2 4-4" stroke="var(--ocean)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <strong>23</strong> saved
            </div>
            <div className="stash-header-stat">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="var(--ocean)" strokeWidth="1.2" strokeLinecap="round" /></svg>
              <strong>3</strong> collections
            </div>
          </div>
        </div>
      </div>

      <div className="stash-content">
        {/* Critic strip */}
        {!criticDismissed && (
          <div className="stash-critic-strip">
            <div className="stash-critic-icon" style={{ background: 'var(--orange)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.8 3.6 4 .5-2.9 2.8.7 4L7 10.5l-3.6 1.9.7-4L1.2 5.6l4-.5z" fill="#fff" /></svg>
            </div>
            <div className="stash-critic-msg">"14 videos saved this week, 2 watched. That's not a stash, Dean — that's a to-do list you're ignoring."</div>
            <button className="stash-critic-dismiss" onClick={() => setCriticDismissed(true)}>Dismiss</button>
          </div>
        )}

        {/* Collections */}
        <div className="stash-section-header">
          <div className="stash-section-title">
            Collections
            <span className="stash-section-count">3</span>
          </div>
          <span className="stash-section-link">Manage</span>
        </div>

        <div className="stash-collections-row">
          {PLACEHOLDER_COLLECTIONS.map(col => (
            <div key={col.name} className="stash-collection-card" style={{ background: col.color }}>
              <div className="stash-collection-card-icon">
                <CollectionIcon type={col.icon} color={col.iconColor} />
              </div>
              <div className="stash-collection-card-name">{col.name}</div>
              <div className="stash-collection-card-count">{col.count} videos</div>
            </div>
          ))}
          <div className="stash-collection-add">
            <div className="stash-collection-add-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="var(--ocean)" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>New collection</span>
          </div>
        </div>

        {/* Recently saved */}
        <div className="stash-section-header">
          <div className="stash-section-title">
            Recently saved
            <span className="stash-section-count">23 videos</span>
          </div>
          <span className="stash-section-link">View all</span>
        </div>

        <div className="stash-video-grid">
          {PLACEHOLDER_VIDEOS.map((v, i) => (
            <div key={i} className="stash-video-card">
              <div className="stash-video-thumb">
                <span className="stash-video-thumb-text">Thumbnail</span>
                <span className="stash-video-duration">{v.duration}</span>
              </div>
              <div className="stash-video-info">
                <div className="stash-video-title">{v.title}</div>
                <div className="stash-video-channel">
                  <div className="stash-video-avatar" style={{ background: v.color }}>{v.initials}</div>
                  {v.channel}
                </div>
                <div className="stash-video-meta">{v.views} &middot; {v.ago}</div>
                <div className="stash-video-actions">
                  <button className="stash-video-btn-watch">Watch</button>
                  <button className="stash-video-btn-collect">Add to collection</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
