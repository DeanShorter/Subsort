'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { trackEvent } from '../../lib/track';

export default function VideoCardPreview({ video, globalMuted, onToggleMute, categoryColour, isNew }) {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef(null);
  const hoverTimer = useRef(null);
  const cardRef = useRef(null);

  const startVideo = useCallback(() => {
    if (!iframeRef.current) return;
    const muteParam = globalMuted ? '&mute=1' : '&mute=0';
    iframeRef.current.src = `https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&controls=1${muteParam}`;
    setPlaying(true);
    trackEvent(video.type === 'short' ? 'video_preview_short' : 'video_preview_video', { video_id: video.id });
  }, [video.id, video.type, globalMuted]);

  const stopVideo = useCallback(() => {
    if (iframeRef.current) iframeRef.current.src = '';
    setPlaying(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(startVideo, 400);
  }, [startVideo]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    if (globalMuted) {
      setTimeout(() => {
        if (cardRef.current && !cardRef.current.matches(':hover')) {
          stopVideo();
        }
      }, 300);
    }
  }, [globalMuted, stopVideo]);

  const handleUnmute = useCallback((e) => {
    e.stopPropagation();
    onToggleMute?.();
  }, [onToggleMute]);

  // Update mute state when globalMuted changes while playing
  useEffect(() => {
    if (playing && iframeRef.current) {
      const muteParam = globalMuted ? '&mute=1' : '&mute=0';
      iframeRef.current.src = `https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&controls=1${muteParam}`;
    }
  }, [globalMuted, playing, video.id]);

  const catCol = categoryColour || 'var(--accent)';

  return (
    <div className="vcard" ref={cardRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className={`vc-thumb${playing ? ' playing' : ''}`}>
        <div className="vc-thumb-bg">
          <img src={video.thumbnail} alt="" loading="lazy" onLoad={e => e.currentTarget.style.opacity = '1'} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.3s' }} />
        </div>
        <div className="vc-iframe-wrap">
          <iframe ref={iframeRef} src="" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
        </div>
        <div className="vc-overlay">
          <div className="vc-play">
            <svg viewBox="0 0 16 16"><polygon points="5,3 13,8 5,13" fill="#111" /></svg>
          </div>
        </div>
        {video.type === 'short' && <span className="feed-shorts-badge" style={{ position: 'absolute', top: 8, left: 8, zIndex: 3 }}>SHORT</span>}
        {isNew && <span className="vc-new">New</span>}
        <button className="vc-unmute" onClick={handleUnmute}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2L4 6H1v4h3l4 4V2z" />
            {globalMuted ? <line x1="12" y1="6" x2="12" y2="10" /> : <><path d="M12 5.5a4 4 0 010 5" /><path d="M14 3.5a7 7 0 010 9" /></>}
          </svg>
          <span>{globalMuted ? 'Unmute' : 'Mute'}</span>
        </button>
      </div>
      <div className="vc-info">
        <div className="vc-info-text">
          <div className="vc-title">{video.title}</div>
          <div className="vc-channel">
            <span className="vc-cat-dot" style={{ background: catCol }} />
            {video.channel} · {video.timeAgo}
          </div>
        </div>
        {playing && (
          <div className="vc-now">
            <div className="vc-now-bars"><div className="vc-now-bar" /><div className="vc-now-bar" /><div className="vc-now-bar" /></div>
            <span className="vc-now-text">Playing</span>
          </div>
        )}
      </div>
    </div>
  );
}
