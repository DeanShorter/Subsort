'use client';
import { useEffect, useRef, useCallback } from 'react';
import { trackEvent } from '../../lib/track';

// YouTube IFrame API states
const STATES = {
  '-1': 'unstarted',
  '0': 'ended',
  '1': 'playing',
  '2': 'paused',
  '3': 'buffering',
  '5': 'cued',
};

export default function YouTubePlayer({ videoId, videoTitle, channelName, onClose }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const sessionRef = useRef({
    videoId,
    startTime: null,
    totalWatchTime: 0,
    lastPlayStart: null,
    playCount: 0,
    pauseCount: 0,
    completed: false,
  });

  const logSession = useCallback(() => {
    const s = sessionRef.current;
    if (!s.startTime) return;

    // Calculate final watch time if still playing
    if (s.lastPlayStart) {
      s.totalWatchTime += (Date.now() - s.lastPlayStart) / 1000;
      s.lastPlayStart = null;
    }

    const duration = (Date.now() - s.startTime) / 1000;

    trackEvent('video_session', {
      video_id: s.videoId,
      title: videoTitle,
      channel: channelName,
      total_watch_seconds: Math.round(s.totalWatchTime),
      session_seconds: Math.round(duration),
      play_count: s.playCount,
      pause_count: s.pauseCount,
      completed: s.completed,
    });

    console.log('[YTPlayer] Session logged:', {
      videoId: s.videoId,
      watchTime: Math.round(s.totalWatchTime) + 's',
      sessionTime: Math.round(duration) + 's',
      plays: s.playCount,
      pauses: s.pauseCount,
      completed: s.completed,
    });
  }, [videoTitle, channelName]);

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    function createPlayer() {
      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            sessionRef.current.startTime = Date.now();
            console.log('[YTPlayer] Ready:', videoId);
          },
          onStateChange: (event) => {
            const state = STATES[event.data] || 'unknown';
            const s = sessionRef.current;

            console.log('[YTPlayer] State:', state);

            switch (event.data) {
              case 1: // playing
                s.playCount++;
                s.lastPlayStart = Date.now();
                trackEvent('video_play', { video_id: videoId });
                break;

              case 2: // paused
                s.pauseCount++;
                if (s.lastPlayStart) {
                  s.totalWatchTime += (Date.now() - s.lastPlayStart) / 1000;
                  s.lastPlayStart = null;
                }
                trackEvent('video_pause', { video_id: videoId });
                break;

              case 0: // ended
                s.completed = true;
                if (s.lastPlayStart) {
                  s.totalWatchTime += (Date.now() - s.lastPlayStart) / 1000;
                  s.lastPlayStart = null;
                }
                trackEvent('video_complete', { video_id: videoId });
                break;
            }
          },
        },
      });
    }

    // Wait for API to load
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    // Log session on unmount (when modal closes)
    return () => {
      logSession();
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch (e) {}
      }
    };
  }, [videoId, logSession]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
