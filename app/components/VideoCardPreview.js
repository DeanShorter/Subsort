'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { trackEvent } from '../../lib/track';

export default function VideoCardPreview({ video, categoryColour, categoryName, onStash, stashCollections = [] }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [stashOpen, setStashOpen] = useState(false);
  const iframeRef = useRef(null);
  const hoverTimer = useRef(null);
  const cardRef = useRef(null);
  const stashRef = useRef(null);

  useEffect(() => {
    if (!stashOpen) return;
    const handleClick = (e) => { if (stashRef.current && !stashRef.current.contains(e.target)) setStashOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [stashOpen]);

  const buildSrc = useCallback((isMuted) => {
    return `https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&controls=1&mute=${isMuted ? 1 : 0}`;
  }, [video.id]);

  const startVideo = useCallback(() => {
    if (!iframeRef.current) return;
    iframeRef.current.src = buildSrc(true);
    setPlaying(true);
    setMuted(true);
    setLoaded(true);
    trackEvent(video.type === 'short' ? 'video_preview_short' : 'video_preview_video', { video_id: video.id });
  }, [video.id, video.type, buildSrc]);

  const stopVideo = useCallback(() => {
    if (!iframeRef.current) return;
    iframeRef.current.src = '';
    setPlaying(false);
    setLoaded(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(startVideo, 400);
  }, [startVideo]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    stopVideo();
  }, [stopVideo]);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const newMuted = !muted;
    setMuted(newMuted);
    setLoaded(true);
    if (!playing) {
      if (iframeRef.current) iframeRef.current.src = buildSrc(newMuted);
      setPlaying(true);
    } else if (iframeRef.current) {
      iframeRef.current.src = buildSrc(newMuted);
    }
  }, [muted, playing, buildSrc]);

  const catCol = categoryColour || 'var(--accent)';
  const channelName = video.channel || '??';
  const initials = channelName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const avatarColors = ['#2D8C5E', '#E85D30', '#8B6FE8', '#FF8C42', '#2D9CDB', '#1a1a1a'];
  const avatarColor = avatarColors[channelName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];

  return (
    <div className="feed-card" ref={cardRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} data-video-id={video.id}>
      <div className={`feed-thumb${playing ? ' playing' : ''}`}>
        <div className="feed-thumb-bg">
          <img src={video.thumbnail} alt="" loading="lazy" onLoad={e => e.currentTarget.style.opacity = '1'} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.3s' }} />
        </div>
        <div className="feed-iframe-wrap">
          <iframe ref={iframeRef} src="" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
        </div>
        {video.duration && <div className="feed-duration">{video.duration}</div>}
        <div className="feed-thumb-tags">
          {categoryName && <div className="feed-category">{categoryName}</div>}
          {video.type === 'short' && <div className="feed-short-badge">S</div>}
        </div>
        {playing && (
          <button className="feed-unmute" onClick={toggleMute}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2L4 6H1v4h3l4 4V2z" />
              {muted ? <line x1="12" y1="6" x2="12" y2="10" /> : <><path d="M12 5.5a4 4 0 010 5" /><path d="M14 3.5a7 7 0 010 9" /></>}
            </svg>
          </button>
        )}
      </div>

      <div className="feed-info">
        <div className="feed-title">{video.title}</div>
        <div className="feed-channel-row">
          <div className="feed-avatar" style={{ background: video.channelThumbnail ? 'transparent' : avatarColor }}>
            {video.channelThumbnail ? <img src={video.channelThumbnail} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}
          </div>
          <span className="feed-channel-name">{video.channel}</span>
          <span className="feed-channel-dot">&middot;</span>
          <span className="feed-channel-time">{video.timeAgo}</span>
        </div>
        <div className="feed-actions">
          <a className="feed-btn-watch" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Watch</a>
          <div className="feed-stash-wrap" ref={stashRef}>
            <button className="feed-btn-stash" onClick={e => { e.stopPropagation(); onStash?.(video); }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
              Stash
            </button>
            {stashOpen && (
              <div className="feed-stash-dropdown" onClick={e => e.stopPropagation()}>
                {stashCollections.map(col => (
                  <div key={col.id || col.name} className="feed-stash-dropdown-item" onClick={() => { onStash?.(video, col.name); setStashOpen(false); }}>{col.name}</div>
                ))}
                {stashCollections.length > 0 && <div className="feed-stash-dropdown-divider" />}
                <div className="feed-stash-dropdown-item" onClick={() => {
                  const name = prompt('Collection name:');
                  if (name?.trim()) { onStash?.(video, name.trim()); }
                  setStashOpen(false);
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  New collection
                </div>
              </div>
            )}
          </div>
          <button className="feed-btn-more" onClick={e => { e.stopPropagation(); setStashOpen(!stashOpen); }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="1.2" fill="#999" /><circle cx="7" cy="7" r="1.2" fill="#999" /><circle cx="11" cy="7" r="1.2" fill="#999" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
