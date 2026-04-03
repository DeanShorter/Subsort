'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import { trackEvent } from '../../lib/track';

export default function VideoCardPreview({ video, categoryColour, onStash, stashCollections = [] }) {
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
    if (!iframeRef.current || loaded) return;
    iframeRef.current.src = buildSrc(true);
    setPlaying(true);
    setMuted(true);
    setLoaded(true);
    trackEvent(video.type === 'short' ? 'video_preview_short' : 'video_preview_video', { video_id: video.id });
  }, [video.id, video.type, buildSrc, loaded]);

  const handleMouseEnter = useCallback(() => {
    if (loaded) return;
    hoverTimer.current = setTimeout(startVideo, 400);
  }, [startVideo, loaded]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
  }, []);

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

  const handlePlayClick = useCallback(() => {
    if (loaded) return;
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
        <button className="vc-unmute" onClick={toggleMute}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2L4 6H1v4h3l4 4V2z" />
            {muted ? <line x1="12" y1="6" x2="12" y2="10" /> : <><path d="M12 5.5a4 4 0 010 5" /><path d="M14 3.5a7 7 0 010 9" /></>}
          </svg>
          <span>{muted ? 'Unmute' : 'Mute'}</span>
        </button>
      </div>
      <div className="vc-info">
        <div className="vc-info-text">
          <div className="vc-title">{video.title}</div>
          <div className="vc-channel">
            <div className="vc-channel-avatar" style={{ background: catCol }}>{(video.channel || '??').substring(0, 2).toUpperCase()}</div>
            {video.channel}
          </div>
          <div className="vc-meta">{video.timeAgo}</div>
          <div className="vc-actions">
            <a className="vc-btn-watch" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>Watch</a>
            <div className="vc-stash-wrap" ref={stashRef}>
              <button className="vc-btn-stash" onClick={e => { e.stopPropagation(); onStash?.(video); }}>Add to Stash</button>
              <button className="vc-btn-stash-chevron" onClick={e => { e.stopPropagation(); setStashOpen(!stashOpen); }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 4l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {stashOpen && (
                <div className="vc-stash-dropdown" onClick={e => e.stopPropagation()}>
                  {stashCollections.map(col => (
                    <div key={col.id || col.name} className="vc-stash-dropdown-item" onClick={() => { onStash?.(video, col.name); setStashOpen(false); }}>{col.name}</div>
                  ))}
                  {stashCollections.length > 0 && <div className="vc-stash-dropdown-divider" />}
                  <div className="vc-stash-dropdown-item" onClick={() => {
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
