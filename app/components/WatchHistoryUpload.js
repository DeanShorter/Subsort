'use client';
import { useState, useRef, useEffect } from 'react';
import { useChannelData } from './ChannelDataContext';
import { useAuth } from './AuthContext';
import { supabase } from '../../lib/supabase';
import { showToast } from './Toast';

export default function WatchHistoryUpload() {
  const { channels } = useChannelData();
  const { user } = useAuth();
  const [watchData, setWatchData] = useState(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('subsort_watchhistory')); } catch { return null; }
  });
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef(null);

  // Load from Supabase if not in localStorage
  useEffect(() => {
    if (watchData || !user) return;
    supabase.from('watch_history').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          const restored = {
            totalEntries: data.total_entries,
            uniqueChannels: data.unique_channels,
            dateRange: { from: data.date_from, to: data.date_to },
            topChannels: data.top_channels || [],
            missingSubs: data.missing_subs || [],
            dayOfWeek: data.day_of_week || {},
            hourOfDay: data.hour_of_day || {},
          };
          localStorage.setItem('subsort_watchhistory', JSON.stringify(restored));
          setWatchData(restored);
        }
      });
  }, [user, watchData]);

  // Save to Supabase after parsing
  const saveToSupabase = async (data) => {
    if (!user) return;
    const row = {
      user_id: user.id,
      total_entries: data.totalEntries,
      unique_channels: data.uniqueChannels,
      date_from: data.dateRange.from,
      date_to: data.dateRange.to,
      top_channels: data.topChannels,
      missing_subs: data.missingSubs,
      day_of_week: data.dayOfWeek,
      hour_of_day: data.hourOfDay,
      uploaded_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('watch_history').upsert(row, { onConflict: 'user_id' });
    if (error) console.error('[WatchHistory] Save to Supabase failed:', error);
    else console.log('[WatchHistory] Saved to Supabase');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setParsing(true);
    showToast('Parsing watch history...');

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let entries;
        if (file.name.endsWith('.json')) {
          const raw = JSON.parse(ev.target.result);
          entries = (Array.isArray(raw) ? raw : []).filter(item =>
            item.titleUrl && item.title && item.title !== 'Watched a video that has been removed'
          ).map(item => ({
            title: (item.title || '').replace(/^Watched\s+/, ''),
            url: item.titleUrl || '',
            channelName: item.subtitles?.[0]?.name || '',
            channelUrl: item.subtitles?.[0]?.url || '',
            time: item.time || '',
          }));
        } else {
          const parser = new DOMParser();
          const doc = parser.parseFromString(ev.target.result, 'text/html');
          const cells = doc.querySelectorAll('.content-cell');
          entries = [];
          cells.forEach(cell => {
            const links = cell.querySelectorAll('a');
            if (links.length >= 1) {
              entries.push({
                title: links[0]?.textContent || '',
                url: links[0]?.href || '',
                channelName: links[1]?.textContent || '',
                channelUrl: links[1]?.href || '',
                time: cell.querySelector('br')?.nextSibling?.textContent?.trim() || '',
              });
            }
          });
        }

        if (!entries.length) { showToast('No watch history entries found'); setParsing(false); return; }

        const channelCounts = {};
        const dayOfWeekCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const hourCounts = {};
        let earliest = null, latest = null;

        for (const entry of entries) {
          if (!entry.channelName?.trim()) continue;
          const chName = entry.channelName;
          if (!channelCounts[chName]) channelCounts[chName] = { count: 0, channelUrl: entry.channelUrl, channelName: chName };
          channelCounts[chName].count++;

          if (entry.time) {
            const d = new Date(entry.time);
            if (!isNaN(d)) {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              dayOfWeekCounts[days[d.getDay()]]++;
              const h = d.getHours();
              hourCounts[h] = (hourCounts[h] || 0) + 1;
              if (!earliest || d < earliest) earliest = d;
              if (!latest || d > latest) latest = d;
            }
          }
        }

        const topChannels = Object.values(channelCounts).sort((a, b) => b.count - a.count);
        // Build set of all possible identifiers for subscribed channels
        const subIdentifiers = new Set();
        channels.forEach(c => {
          if (c.channelId) subIdentifiers.add(c.channelId);
          if (c.id) subIdentifiers.add(c.id);
          if (c.customUrl) subIdentifiers.add(c.customUrl.replace(/^@/, '').toLowerCase());
          if (c.name) subIdentifiers.add(c.name.toLowerCase());
        });

        const missingSubs = topChannels.filter(c => {
          if (!c.channelName || c.count < 3) return false;
          const tcUrlId = c.channelUrl?.replace(/\/$/, '').split('/').pop();
          const tcHandle = c.channelUrl?.match(/@([^/]+)/)?.[1];
          return !(
            (tcUrlId && subIdentifiers.has(tcUrlId)) ||
            (tcHandle && subIdentifiers.has(tcHandle.toLowerCase())) ||
            (c.channelName && subIdentifiers.has(c.channelName.toLowerCase()))
          );
        });

        const data = {
          totalEntries: entries.length,
          dateRange: { from: earliest?.toISOString(), to: latest?.toISOString() },
          topChannels: topChannels.slice(0, 30),
          missingSubs: missingSubs.slice(0, 20),
          dayOfWeek: dayOfWeekCounts,
          hourOfDay: hourCounts,
          uniqueChannels: Object.keys(channelCounts).length,
        };

        localStorage.setItem('subsort_watchhistory', JSON.stringify(data));
        setWatchData(data);
        saveToSupabase(data);
        showToast(`Parsed ${entries.length.toLocaleString()} watch history entries!`);
      } catch (err) {
        showToast('Failed to parse: ' + err.message);
      }
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Upload prompt
  if (!watchData) {
    return (
      <div className="s2-insight" style={{ gridColumn: '1 / -1' }}>
        <div className="s2-insight-header" style={{ background: 'var(--iris-soft)' }}>
          <div>
            <div className="s2-insight-stat" style={{ color: 'var(--iris)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--iris)" strokeWidth="1.5" strokeLinecap="round"><path d="M3 20h18M5 20V8l4 4 3-6 3 6 4-4v12" /></svg>
            </div>
            <div className="s2-insight-label" style={{ color: 'var(--iris-text)' }}>Watch History Analytics</div>
          </div>
        </div>
        <div className="s2-insight-body">
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Unlock Watch History Analytics</div>
          <div className="s2-insight-quote">Upload your YouTube watch history to discover your most-watched channels, viewing patterns, and find channels you watch but haven't subscribed to.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--iris)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>1</span>
              Go to <strong>takeout.google.com</strong> — select YouTube only, then history only
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--iris)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>2</span>
              Choose <strong>JSON</strong> format, export and unzip
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--iris)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>3</span>
              Find <strong>watch-history.json</strong> and upload below
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="s2-insight-cta" style={{ background: 'var(--iris)' }} onClick={() => fileRef.current?.click()} disabled={parsing}>
              {parsing ? 'Parsing...' : 'Upload watch-history.json'}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4.5 4-4.5 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--iris)', fontWeight: 500, textDecoration: 'none' }}>
              Google Takeout ↗
            </a>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>Your history is parsed locally — nothing leaves your browser.</div>
        </div>
        <input ref={fileRef} type="file" accept=".json,.html" onChange={handleFile} style={{ display: 'none' }} />
      </div>
    );
  }

  // Analytics loaded
  const peakDay = Object.entries(watchData.dayOfWeek).sort((a, b) => b[1] - a[1])[0];
  const peakHour = Object.entries(watchData.hourOfDay).sort((a, b) => b[1] - a[1])[0];
  const maxDayCount = Math.max(...Object.values(watchData.dayOfWeek));

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--iris)" strokeWidth="1.5" strokeLinecap="round"><path d="M3 20h18M5 20V8l4 4 3-6 3 6 4-4v12" /></svg>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Watch History Analytics</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{watchData.totalEntries.toLocaleString()} videos</span>
        </div>
        <button className="s2-sort-pill" onClick={() => fileRef.current?.click()}>Re-upload</button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="s2-insight" style={{ margin: 0 }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--iris)' }}>{watchData.totalEntries.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>videos watched</div>
          </div>
        </div>
        <div className="s2-insight" style={{ margin: 0 }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--accent)' }}>{watchData.uniqueChannels.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>unique channels</div>
          </div>
        </div>
        <div className="s2-insight" style={{ margin: 0 }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{peakDay?.[0] || '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>most active day</div>
          </div>
        </div>
        <div className="s2-insight" style={{ margin: 0 }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--orange)' }}>{watchData.missingSubs.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>watched but not subbed</div>
          </div>
        </div>
      </div>

      {/* Top channels + Missing subs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="s2-insight" style={{ margin: 0 }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Most watched channels</div>
            {watchData.topChannels.slice(0, 8).map((ch, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < 7 ? '1px solid #f0f0f0' : 'none' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 20 }}>{i + 1}</span>
                <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.channelName}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--iris)' }}>{ch.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="s2-insight" style={{ margin: 0 }}>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Watched but not subscribed</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Channels you watch regularly but haven't subscribed to</div>
            {watchData.missingSubs.length > 0 ? watchData.missingSubs.slice(0, 8).map((ch, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < 7 ? '1px solid #f0f0f0' : 'none' }}>
                <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.channelName}</span>
                <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 500 }}>{ch.count} views</span>
              </div>
            )) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>You're subscribed to everything you watch. Impressive.</div>
            )}
          </div>
        </div>
      </div>

      {/* Day of week chart */}
      <div className="s2-insight" style={{ margin: '12px 0 0' }}>
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Viewing by day of week</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
            {Object.entries(watchData.dayOfWeek).map(([day, count]) => (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: count === maxDayCount ? 'var(--iris)' : 'var(--iris-soft)', borderRadius: 4, height: `${Math.max(4, (count / maxDayCount) * 60)}px`, transition: 'height .3s' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        Data from {fmtDate(watchData.dateRange.from)} to {fmtDate(watchData.dateRange.to)}
      </div>

      <input ref={fileRef} type="file" accept=".json,.html" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  );
}
