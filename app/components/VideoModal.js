'use client';
import { useState, useMemo } from 'react';
import { useChannelData } from './ChannelDataContext';
import { timeAgo } from '../../lib/youtube';
import YouTubePlayer from './YouTubePlayer';

export default function VideoModal({ video, onClose }) {
  const { channels, categoryColours, chCats, formatCount, feedVideos } = useChannelData();
  const [notes, setNotes] = useState('');

  if (!video) return null;

  const channel = channels.find(c => c.channelId === video.channelId || c.id === video.channelId);
  const cats = channel ? chCats(channel) : [];
  const cat = cats[0] || '';
  const catCol = categoryColours[cat] || 'var(--accent)';
  const initials = (channel?.name || video.channel || '??').substring(0, 2).toUpperCase();

  // More from this channel
  const moreVideos = useMemo(() => {
    if (!video.channelId) return [];
    return feedVideos
      .filter(v => v.channelId === video.channelId && v.id !== video.id)
      .slice(0, 3);
  }, [feedVideos, video]);

  return (
    <div className="vm-backdrop" onClick={onClose}>
      <div className="vm-modal" onClick={e => e.stopPropagation()}>

        {/* Top bar */}
        <div className="vm-top">
          <div className="vm-top-left">
            {cat && (
              <div className="vm-cat" style={{ background: `${catCol}14`, color: catCol }}>
                <div className="vm-cat-dot" style={{ background: catCol }} />
                {cat}
              </div>
            )}
            <span className="vm-source">via Feed</span>
          </div>
          <div className="vm-top-right">
            <a className="vm-btn" href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" title="Open on YouTube">
              <svg viewBox="0 0 16 16"><path d="M12 9V13a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4" /><path d="M8 8L14 2" /><path d="M10 2h4v4" /></svg>
            </a>
            <button className="vm-close" onClick={onClose} title="Close">
              <svg viewBox="0 0 16 16"><path d="M4 4l8 8M12 4l-8 8" /></svg>
            </button>
          </div>
        </div>

        {/* Video player */}
        <div className="vm-video">
          <YouTubePlayer
            videoId={video.id}
            videoTitle={video.title}
            channelName={video.channel || channel?.name}
          />
        </div>

        {/* Scrollable content */}
        <div className="vm-content">

          {/* Video info */}
          <div className="vm-info">
            <div className="vm-title">{video.title}</div>
            <div className="vm-stats">
              <span>{timeAgo(video.publishedAt)}</span>
              {video.type === 'short' && <span className="vm-short-badge">SHORT</span>}
            </div>
          </div>

          {/* Channel */}
          {channel && (
            <div className="vm-channel">
              <div className="vm-ch-avatar" style={{ background: `${catCol}1A`, color: catCol }}>{initials}</div>
              <div className="vm-ch-info">
                <div className="vm-ch-name-row">
                  <span className="vm-ch-name">{channel.name}</span>
                  {channel.favourited && (
                    <svg viewBox="0 0 16 16" fill="none" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                      <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" />
                    </svg>
                  )}
                </div>
                <div className="vm-ch-meta">
                  {channel.subscriberCount ? formatCount(channel.subscriberCount) + ' subs' : ''}
                  {channel.videoCount ? ' · ' + channel.videoCount + ' videos' : ''}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="vm-notes">
            <div className="vm-notes-row">
              <span className="vm-notes-label">Your notes</span>
              <span className="vm-pro-badge">Pro</span>
            </div>
            <textarea
              className="vm-notes-input"
              placeholder="Why did you save this? What's worth remembering?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="vm-notes-hint">Only visible to you. Notes are saved automatically.</div>
          </div>

          {/* More from channel */}
          {moreVideos.length > 0 && (
            <div className="vm-more">
              <div className="vm-more-header">
                <span className="vm-more-title">More from {channel?.name || video.channel}</span>
              </div>
              <div className="vm-more-grid">
                {moreVideos.map(v => (
                  <div key={v.id} className="vm-more-card">
                    <div className="vm-more-thumb">
                      <img src={v.thumbnail} alt="" loading="lazy" />
                      <div className="vm-more-overlay">
                        <svg viewBox="0 0 24 24"><polygon points="8,5 19,12 8,19" fill="rgba(255,255,255,0.9)" /></svg>
                      </div>
                    </div>
                    <div className="vm-more-info">
                      <div className="vm-more-title-text">{v.title}</div>
                      <div className="vm-more-date">{timeAgo(v.publishedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
