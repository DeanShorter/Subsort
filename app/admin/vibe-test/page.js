'use client';

import { useState } from 'react';
import { useAuth } from '../../components/AuthContext';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VibeTestPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  async function runTest() {
    if (!user) return;
    setLoading(true);

    try {
      const { supabase } = await import('../../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }

      const ytToken = localStorage.getItem('subsort_yt_token') || session.provider_token || '';
      const res = await fetch('/api/vibe-test', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'X-YouTube-Token': ytToken,
        },
      });
      const data = await res.json();
      setVideos(data.videos || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Test failed:', err);
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: 32, fontFamily: 'var(--font-body)', maxWidth: 1200 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Vibe System Test</h1>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>
        Fetches your recent feed videos, enriches with duration from YouTube API (cached), and generates tags in memory.
      </p>

      <button
        onClick={runTest}
        disabled={loading || !user}
        style={{ padding: '10px 24px', borderRadius: 20, fontSize: 14, fontWeight: 500, background: 'var(--iris)', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: 24 }}
      >
        {loading ? 'Running...' : 'Run Tag Test'}
      </button>

      {stats && (
        <div style={{ fontSize: 13, color: '#555', marginBottom: 20, display: 'flex', gap: 24 }}>
          <span><strong>{stats.total}</strong> videos</span>
          <span><strong>{stats.cached}</strong> durations cached</span>
          <span><strong>{stats.fetched}</strong> fetched from API</span>
          <span><strong>{stats.tagged}</strong> with content tags</span>
        </div>
      )}

      {videos.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Title</th>
              <th style={{ padding: '8px 12px' }}>Duration</th>
              <th style={{ padding: '8px 12px' }}>Length</th>
              <th style={{ padding: '8px 12px' }}>Content Tags</th>
              <th style={{ padding: '8px 12px' }}>Energy</th>
              <th style={{ padding: '8px 12px' }}>Format</th>
            </tr>
          </thead>
          <tbody>
            {videos.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px 12px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</td>
                <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums' }}>{formatDuration(v.duration_seconds)}</td>
                <td style={{ padding: '8px 12px' }}>{v.length_bucket}</td>
                <td style={{ padding: '8px 12px' }}>{v.content_tags?.join(', ') || '\u2014'}</td>
                <td style={{ padding: '8px 12px' }}>{v.energy}</td>
                <td style={{ padding: '8px 12px' }}>{v.format}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
