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

const SOURCE_LABELS = {
  channel_subcategory: 'Subcategory',
  channel_category: 'Category',
  youtube_category: 'YT Cat',
  youtube_tags: 'YT Tags',
  regex_strict: 'Regex',
};

function SignalBadge({ signal }) {
  const colors = {
    channel_subcategory: '#8B6FE8',
    channel_category: '#00A651',
    youtube_category: '#FF8C42',
    youtube_tags: '#2D9CDB',
    regex_strict: '#e85d50',
  };
  const bg = colors[signal.source] || '#999';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 6, fontSize: 10, fontWeight: 500, color: '#fff', background: bg, marginRight: 3, marginBottom: 2 }}>
      {SOURCE_LABELS[signal.source] || signal.source} → {signal.tag} +{signal.weight}
    </span>
  );
}

function TagPill({ tag, type }) {
  const bg = type === 'high' ? '#1a1a1a' : '#e8e8e8';
  const color = type === 'high' ? '#fff' : '#555';
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500, background: bg, color, marginRight: 4, marginBottom: 2 }}>
      {tag}
    </span>
  );
}

export default function VibeTestPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  async function runTest() {
    setError(null);
    setLoading(true);
    try {
      if (!user) { setError('No user from useAuth()'); setLoading(false); return; }
      const { supabase } = await import('../../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setError('No Supabase session'); setLoading(false); return; }
      const ytToken = localStorage.getItem('subsort_yt_token') || session.provider_token || '';
      const res = await fetch('/api/vibe-test', {
        headers: { Authorization: `Bearer ${session.access_token}`, 'X-YouTube-Token': ytToken },
      });
      const data = await res.json();
      if (!res.ok) { setError(`API ${res.status}: ${data.error || JSON.stringify(data)}`); setLoading(false); return; }
      setVideos(data.videos || []);
      setStats(data.stats || null);
    } catch (err) { setError(err.message); }
    setLoading(false);
  }

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const th = { padding: '8px 10px', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#fff', zIndex: 1 };
  const td = { padding: '8px 10px', whiteSpace: 'nowrap', fontSize: 12 };

  return (
    <div style={{ padding: 32, fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Vibe Tagging Audit</h1>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>
        Multi-signal confidence scoring. Click a row to see signal breakdown.
      </p>

      <button onClick={runTest} disabled={loading}
        style={{ padding: '10px 24px', borderRadius: 20, fontSize: 14, fontWeight: 500, background: 'var(--iris)', color: '#fff', border: 'none', cursor: 'pointer', marginBottom: 24 }}>
        {loading ? 'Running...' : 'Run Tag Test'}
      </button>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#c00' }}>{error}</div>
      )}

      {stats && (
        <div style={{ fontSize: 13, color: '#555', marginBottom: 20, display: 'flex', gap: 24 }}>
          <span><strong>{stats.total}</strong> videos</span>
          <span><strong>{stats.cached}</strong> cached</span>
          <span><strong>{stats.fetched}</strong> API fetched</span>
          <span><strong>{stats.tagged}</strong> with content tags</span>
        </div>
      )}

      {videos.length > 0 && (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 260px)', border: '1px solid #eee', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={th}>Channel</th>
                <th style={th}>Category</th>
                <th style={th}>Subcat</th>
                <th style={{ ...th, minWidth: 250 }}>Video</th>
                <th style={th}>Dur.</th>
                <th style={th}>Length</th>
                <th style={th}>Content Tags</th>
                <th style={th}>Inferred</th>
                <th style={th}>Energy</th>
                <th style={th}>Fmt</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(v => {
                const isExp = expanded.has(v.id);
                const debug = v._debug;
                return (
                  <Fragment key={v.id}>
                    <tr onClick={() => toggleExpand(v.id)} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: isExp ? '#fafafa' : undefined }}>
                      <td style={{ ...td, color: '#555' }}>{v.channelName || '\u2014'}</td>
                      <td style={td}>{v.category || '\u2014'}</td>
                      <td style={td}>{v.subcategory || '\u2014'}</td>
                      <td style={{ ...td, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <a href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--iris)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                          {v.title}
                        </a>
                      </td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{formatDuration(v.duration_seconds)}</td>
                      <td style={td}>{v.length_bucket}</td>
                      <td style={td}>
                        {v.content_tags?.map(t => <TagPill key={t} tag={t} type="high" />) || '\u2014'}
                      </td>
                      <td style={td}>
                        {v.inferred_tags?.length ? v.inferred_tags.map(t => <TagPill key={t} tag={t} type="low" />) : '\u2014'}
                      </td>
                      <td style={td}>{v.energy}</td>
                      <td style={td}>{v.format}</td>
                    </tr>
                    {isExp && debug && (
                      <tr>
                        <td colSpan={10} style={{ padding: '12px 16px', background: '#f8f8f8', borderBottom: '2px solid #eee' }}>
                          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: 12 }}>
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>Signal votes</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {debug.signals.length ? debug.signals.map((s, i) => <SignalBadge key={i} signal={s} />) : <span style={{ color: '#999' }}>No signals</span>}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>Scores</div>
                              {Object.entries(debug.scores).length ? (
                                <div style={{ display: 'flex', gap: 12 }}>
                                  {Object.entries(debug.scores).map(([tag, score]) => (
                                    <span key={tag} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                      {tag}: <strong>{score}</strong>{score >= 4 ? ' \u2713' : ''}
                                    </span>
                                  ))}
                                </div>
                              ) : <span style={{ color: '#999' }}>No scores</span>}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>YT Category</div>
                              <span>{v.youtube_category_id || '\u2014'}</span>
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 6 }}>YT Tags</div>
                              <span style={{ color: '#777' }}>{v.youtube_tags?.slice(0, 8).join(', ') || '\u2014'}</span>
                            </div>
                            {debug.personal_override && (
                              <div style={{ color: '#c00', fontWeight: 600 }}>PERSONAL OVERRIDE</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Need Fragment for the expandable rows
import { Fragment } from 'react';
