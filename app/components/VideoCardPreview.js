'use client';
import { useRef, useState, useCallback } from 'react';
import { trackEvent } from '../../lib/track';

export default function VideoCardPreview({ video, categoryColour, isNew, onAddToSplit, splitFull }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false); // once loaded, never reset
  const iframeRef = useRef(null);
  const hoverTimer = useRef(null);
  const cardRef = useRef(null);

  const buildSrc = useCallback((isMuted) => {
    return `https://www.youtube.com/embed/${video.id}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&controls=1&mute=${isMuted ? 1 : 0}`;
  }, [video.id]);

  const startVideo = useCallback(() => {
    if (!iframeRef.current || loaded) return; // don't restart if already loaded
    iframeRef.current.src = buildSrc(true);
    setPlaying(true);
    setMuted(true);
    setLoaded(true);
    trackEvent(video.type === 'short' ? 'video_preview_short' : 'video_preview_video', { video_id: video.id });
  }, [video.id, video.type, buildSrc, loaded]);

  const handleMouseEnter = useCallback(() => {
    if (loaded) return; // already loaded — don't restart
    hoverTimer.current = setTimeout(startVideo, 400);
  }, [startVideo, loaded]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    // Don't stop if unmuted or already loaded with interaction
    // Only stop auto-preview (muted, no explicit play)
  }, []);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const newMuted = !muted;
    setMuted(newMuted);
    setLoaded(true); // mark as loaded on any interaction
    if (!playing) {
      // Start playing if not already
      if (iframeRef.current) iframeRef.current.src = buildSrc(newMuted);
      setPlaying(true);
    } else if (iframeRef.current) {
      iframeRef.current.src = buildSrc(newMuted);
    }
  }, [muted, playing, buildSrc]);

  const handlePlayClick = useCallback(() => {
    if (loaded) return; // already playing
    if (iframeRef.current) iframeRef.current.src = buildSrc(true);
    setPlaying(true);
    setMuted(true);
    setLoaded(true);
    trackEvent(video.type === 'short' ? 'video_preview_short' : 'video_preview_video', { video_id: video.id });
  }, [loaded, buildSrc, video.id, video.type]);

  const catCol = categoryColour || 'var(--accent)';

  return (
    <div className="vcard" ref={cardRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} data-video-id={video.id}>
      <div className={`vc-thumb${playing ? ' playing' : ''}`} onClick={!loaded ? handlePlayClick : undefined}>
        <div className="vc-thumb-bg">
          <img src={video.thumbnail} alt="" loading="lazy" onLoad={e => e.currentTarget.style.opacity = '1'} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.3s' }} />
        </div>
        <div className="vc-iframe-wrap">
          <iframe ref={iframeRef} src="" allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
        </div>
        {!loaded && (
          <div className="vc-overlay">
            <div className="vc-play">
              <svg viewBox="0 0 16 16"><polygon points="5,3 13,8 5,13" fill="#111" /></svg>
            </div>
          </div>
        )}
        {video.type === 'short' && <span className="feed-shorts-badge" style={{ position: 'absolute', top: 8, left: 8, zIndex: 3 }}>SHORT</span>}
        {isNew && !loaded && <span className="vc-new">New</span>}
        <button className="vc-unmute" onClick={toggleMute}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2L4 6H1v4h3l4 4V2z" />
            {muted ? <line x1="12" y1="6" x2="12" y2="10" /> : <><path d="M12 5.5a4 4 0 010 5" /><path d="M14 3.5a7 7 0 010 9" /></>}
          </svg>
          <span>{muted ? 'Unmute' : 'Mute'}</span>
        </button>
        {onAddToSplit && !splitFull && (
          <button className="vc-split-btn" onClick={e => { e.stopPropagation(); onAddToSplit(video); }}>
            <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="12" rx="1" /><rect x="8" y="1" width="5" height="12" rx="1" /></svg>
            Split
          </button>
        )}
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
