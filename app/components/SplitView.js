'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useChannelData } from './ChannelDataContext';
import { timeAgo } from '../../lib/youtube';

export function useVideoInfo() {
  const { categoryColours, channels, chCats } = useChannelData();
  return useCallback((video) => {
    const ch = channels.find(c => c.channelId === video.channelId);
    const cats = ch ? chCats(ch) : [];
    const cat = cats[0] || '';
    const col = categoryColours[cat] || 'var(--accent)';
    return { cat, col, channelName: video.channel || ch?.name || '' };
  }, [channels, chCats, categoryColours]);
}

function SplitPanel({ video, index, panelCount, onRemove, onSwap }) {
  const getVideoInfo = useVideoInfo();
  const info = getVideoInfo(video);

  return (
    <div className="split-panel">
      <div className="sp-video">
        <div className="sp-video-inner">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=${index === 0 ? 1 : 0}&rel=0&modestbranding=1&controls=1&enablejsapi=1`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
      <div className="sp-info">
        <div className="sp-info-left">
          <div className="sp-cat" style={{ background: `${info.col}1A`, color: info.col }}>
            <div className="sp-cat-dot" style={{ background: info.col }} />
            {info.cat || 'Uncategorised'}
          </div>
          <div className="sp-info-text">
            <div className="sp-title">{video.title}</div>
            <div className="sp-channel">{info.channelName} · {timeAgo(video.publishedAt)}</div>
          </div>
        </div>
        <div className="sp-now">
          <div className="sp-now-bars">
            <div className={`sp-now-bar ${index === 0 ? 'muted' : 'unmuted'}`} />
            <div className={`sp-now-bar ${index === 0 ? 'muted' : 'unmuted'}`} />
            <div className={`sp-now-bar ${index === 0 ? 'muted' : 'unmuted'}`} />
          </div>
        </div>
        <div className="sp-info-controls">
          {panelCount === 2 && (
            <button className="sp-btn" title="Swap panels" onClick={onSwap}>
              <svg viewBox="0 0 14 14"><path d="M4 2l-3 3 3 3" /><path d="M10 6l3 3-3 3" /><path d="M1 5h10M13 9H3" /></svg>
            </button>
          )}
          <button className="sp-btn close-btn" title="Close panel" onClick={onRemove}>
            <svg viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SplitView({ panels, onRemovePanel, onSwapPanels }) {
  if (panels.length === 0) return null;

  return (
    <div className="split-view layout-equal">
      {panels.map((video, i) => (
        <React.Fragment key={video.id + '-' + i}>
          {i > 0 && (
            <div className="split-handle">
              <div className="split-handle-dots">
                <div className="split-handle-dot" /><div className="split-handle-dot" /><div className="split-handle-dot" />
              </div>
            </div>
          )}
          <SplitPanel
            video={video}
            index={i}
            panelCount={panels.length}
            onRemove={() => onRemovePanel(i)}
            onSwap={onSwapPanels}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

export function SplitMinibar({ panels, visible, onScrollToSplit, scrollContainerRef }) {
  const getVideoInfo = useVideoInfo();
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drawerRef = useRef(null);

  const handleDragStart = useCallback((e) => {
    if (!visible) return;
    e.preventDefault();
    const startY = e.clientY || e.touches?.[0]?.clientY;
    const startHeight = drawerHeight;
    setDragging(true);

    const onMove = (ev) => {
      const y = ev.clientY || ev.touches?.[0]?.clientY;
      const delta = y - startY;
      const newHeight = Math.max(0, Math.min(500, startHeight + delta));
      setDrawerHeight(newHeight);
    };

    const onEnd = () => {
      setDragging(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      // Snap: if dragged less than 80px, close. If more, keep open
      setDrawerHeight(prev => prev < 80 ? 0 : prev);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, [visible, drawerHeight]);

  // Close drawer when minibar hides (scrolled back to split view)
  useEffect(() => {
    if (!visible) setDrawerHeight(0);
  }, [visible]);

  if (panels.length === 0) return null;

  return (
    <>
      {/* Minibar */}
      <div
        className={`split-minibar${visible ? ' show' : ''}`}
        style={{ cursor: visible ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <div className="minibar-icon">
          <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="12" rx="1.5" /><rect x="8" y="1" width="5" height="12" rx="1.5" /></svg>
        </div>
        <div className="minibar-drag-handle" onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
          <div className="minibar-drag-dot" /><div className="minibar-drag-dot" /><div className="minibar-drag-dot" />
        </div>
        <div className="minibar-videos">
          {panels.map((video, i) => {
            const info = getVideoInfo(video);
            return (
              <React.Fragment key={video.id + '-mini-' + i}>
                {i > 0 && <span className="minibar-sep">+</span>}
                <div className="minibar-vid">
                  <div className="minibar-dot" style={{ background: info.col }} />
                  <span className="minibar-name">{video.title}</span>
                  <div className="minibar-eq">
                    <div className={`minibar-eq-bar ${i === 0 ? 'off' : 'on'}`} />
                    <div className={`minibar-eq-bar ${i === 0 ? 'off' : 'on'}`} />
                    <div className={`minibar-eq-bar ${i === 0 ? 'off' : 'on'}`} />
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="minibar-back" onClick={e => { e.stopPropagation(); onScrollToSplit(); }}>
          <svg viewBox="0 0 12 12"><polyline points="6 2 6 10" /><polyline points="3 5 6 2 9 5" /></svg>
          Back to split view
        </div>
      </div>

      {/* Draggable drawer — shows split view at user-chosen height */}
      {visible && drawerHeight > 0 && (
        <div
          className="split-drawer"
          ref={drawerRef}
          style={{ height: drawerHeight }}
        >
          <div className="split-drawer-inner">
            {panels.map((video, i) => (
              <div key={video.id + '-drawer-' + i} className="split-drawer-panel">
                <iframe
                  src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=${i === 0 ? 1 : 0}&rel=0&modestbranding=1&controls=1&enablejsapi=1`}
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
