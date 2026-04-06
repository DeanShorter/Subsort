'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { useChannelData } from '../components/ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { showToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';

export default function SettingsPage() {
  const { user, userTier, signOut } = useAuth();
  const { theme, setTheme, mounted } = useTheme();
  const activeTheme = mounted ? theme : null;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      if (!res.ok) throw new Error('Deletion failed');
      // Clear all local data
      Object.keys(localStorage).filter(k => k.startsWith('subsort') || k.startsWith('subsnub')).forEach(k => localStorage.removeItem(k));
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      setDeleteError('Something went wrong. Please try again.');
      setIsDeleting(false);
    }
  };

  const { channels } = useChannelData();
  const fileRef = useRef(null);
  const [watchData, setWatchData] = useState(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('subsort_watchhistory')); } catch { return null; }
  });
  const [parsing, setParsing] = useState(false);

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
        let earliest = null, latest = null;
        const dayOfWeekCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const hourCounts = {};

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
              hourCounts[d.getHours()] = (hourCounts[d.getHours()] || 0) + 1;
              if (!earliest || d < earliest) earliest = d;
              if (!latest || d > latest) latest = d;
            }
          }
        }

        const topChannels = Object.values(channelCounts).sort((a, b) => b.count - a.count);
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
          return !((tcUrlId && subIdentifiers.has(tcUrlId)) || (tcHandle && subIdentifiers.has(tcHandle.toLowerCase())) || (c.channelName && subIdentifiers.has(c.channelName.toLowerCase())));
        });

        const data = {
          totalEntries: entries.length,
          uniqueChannels: Object.keys(channelCounts).length,
          dateRange: { from: earliest?.toISOString(), to: latest?.toISOString() },
          topChannels: topChannels.slice(0, 30),
          missingSubs: missingSubs.slice(0, 20),
          dayOfWeek: dayOfWeekCounts,
          hourOfDay: hourCounts,
        };

        localStorage.setItem('subsort_watchhistory', JSON.stringify(data));
        setWatchData(data);

        if (user) {
          supabase.from('watch_history').upsert({
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
          }, { onConflict: 'user_id' });
        }

        showToast(`Parsed ${entries.length.toLocaleString()} watch history entries!`);
      } catch (err) {
        showToast('Failed to parse: ' + err.message);
      }
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const clearWatchHistory = () => {
    localStorage.removeItem('subsort_watchhistory');
    setWatchData(null);
    if (user) supabase.from('watch_history').delete().eq('user_id', user.id);
    showToast('Watch history cleared');
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Sync usage tracking
  const [syncUsage, setSyncUsage] = useState({ used: 0, max: 1 });
  useEffect(() => {
    const maxSyncs = userTier === 'admin' ? 999 : userTier === 'pro' ? 5 : 1;
    const syncLog = JSON.parse(localStorage.getItem('subsort_sync_log') || '{}');
    const today = new Date().toDateString();
    const todaySyncs = syncLog.date === today ? (syncLog.count || 0) : 0;
    setSyncUsage({ used: todaySyncs, max: maxSyncs });
  }, [userTier]);

  return (
    <main className="home-main settings-main">
      <PageHeader title="Settings" subtitle="Manage your account, preferences, and connected services" />

      <div className="main-content">
      {/* Account */}
      <section className="settings-section">
        <h3 className="settings-section-title">Account</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Signed in as</div>
              <div className="settings-row-desc">{user?.email || 'Not signed in'}</div>
            </div>
            {user && (
              <button className="settings-btn settings-btn-danger" onClick={signOut}>Sign out</button>
            )}
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="settings-section">
        <h3 className="settings-section-title">Theme</h3>
        <p className="settings-desc">Choose how Subsnub looks to you.</p>
        <div className="settings-theme-row">
          <button
            className={`settings-theme-btn${activeTheme === 'dark' ? ' active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            Dark {activeTheme === 'dark' && '✓'}
          </button>
          <button
            className={`settings-theme-btn${activeTheme === 'light' ? ' active' : ''}`}
            onClick={() => setTheme('light')}
          >
            Light {activeTheme === 'light' && '✓'}
          </button>
        </div>
      </section>

      {/* Sync & Usage */}
      <section className="settings-section">
        <h3 className="settings-section-title">Sync</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Daily syncs</div>
              <div className="settings-row-desc">
                {syncUsage.used} / {userTier === 'admin' ? '∞' : syncUsage.max} used today
                {userTier === 'free' && syncUsage.used >= syncUsage.max && (
                  <span className="settings-limit-tag">Limit reached</span>
                )}
              </div>
            </div>
            <button
              className="settings-btn settings-btn-accent"
              onClick={() => window.__subsortTriggerSync?.()}
              disabled={syncUsage.used >= syncUsage.max && userTier !== 'admin'}
            >
              Sync now
            </button>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Current plan</div>
              <div className="settings-row-desc settings-tier-label">{userTier || 'free'}</div>
            </div>
          </div>
          {userTier === 'free' && (
            <div className="settings-upsell">
              <div className="settings-upsell-title">Upgrade to Pro</div>
              <div className="settings-upsell-desc">
                Get 5 daily syncs, priority feed refresh, and early access to new features.
              </div>
              <button className="settings-btn settings-btn-accent" onClick={() => { window.location.href = '/pricing'; }}>
                Upgrade →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Your Data */}
      <section className="settings-section">
        <h3 className="settings-section-title">Your data</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Watch history</div>
              <div className="settings-row-desc">
                {watchData
                  ? `${watchData.totalEntries.toLocaleString()} videos · ${fmtDate(watchData.dateRange?.from)} to ${fmtDate(watchData.dateRange?.to)}`
                  : 'No watch history uploaded yet'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="settings-btn settings-btn-accent" onClick={() => fileRef.current?.click()} disabled={parsing}>
                {parsing ? 'Parsing...' : watchData ? 'Re-upload' : 'Upload Takeout file'}
              </button>
              {watchData && (
                <button className="settings-btn settings-btn-danger" onClick={clearWatchHistory}>Clear</button>
              )}
            </div>
          </div>
          {!watchData && (
            <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Upload your Google Takeout watch history to unlock activity tracking on your channels.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>1</span>
                  Go to <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 500 }}>takeout.google.com</a> — select YouTube only, then history only
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>2</span>
                  Choose <strong>JSON</strong> format, export and unzip
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>3</span>
                  Find <strong>watch-history.json</strong> and upload above
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                Your history is parsed locally — nothing leaves your browser.
              </div>
            </div>
          )}
        </div>
      </section>
      <input ref={fileRef} type="file" accept=".json,.html" onChange={handleFile} style={{ display: 'none' }} />

      {/* Danger zone */}
      <section className="settings-section" style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
        <h3 className="settings-section-title" style={{ color: '#dc2626' }}>Danger zone</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Delete your account</div>
              <div className="settings-row-desc">Permanently delete your account and all associated data. This cannot be undone.</div>
            </div>
            <button className="set-delete-btn" onClick={() => setShowDeleteModal(true)}>Delete account</button>
          </div>
        </div>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="set-delete-overlay" onClick={() => !isDeleting && setShowDeleteModal(false)}>
          <div className="set-delete-modal" onClick={e => e.stopPropagation()}>
            <h2 className="set-delete-title">Delete your account?</h2>
            <div className="set-delete-list">
              This will permanently delete:
              <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>Your profile and preferences</li>
                <li>All subscription categories and favourites</li>
                <li>Your Stash collections and saved videos</li>
                <li>Health score history and Critic data</li>
                <li>All activity and event data</li>
              </ul>
            </div>
            <div className="set-delete-warning">This cannot be undone.</div>
            <div className="set-delete-label">Type DELETE to confirm:</div>
            <input
              className="set-delete-input"
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder=""
              disabled={isDeleting}
            />
            {deleteError && <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{deleteError}</div>}
            <div className="set-delete-actions">
              <button className="set-delete-cancel" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</button>
              <button
                className={`set-delete-confirm${deleteConfirm === 'DELETE' ? ' enabled' : ''}`}
                disabled={deleteConfirm !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
