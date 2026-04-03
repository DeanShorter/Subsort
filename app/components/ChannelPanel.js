'use client';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useChannelData } from './ChannelDataContext';
import { useAuth } from './AuthContext';
import { supabase } from '../../lib/supabase';
import { showToast } from './Toast';

export default function ChannelPanel({ channelId, onClose }) {
  const { channels, categories, subcategories, categoryColours, chCats, formatCount, getChannelState, feedVideos, dbCategories, dbSubcategories, reload, toggleFavourite } = useChannelData();
  const { user } = useAuth();
  const [editingCat, setEditingCat] = useState(false);
  const [editingSub, setEditingSub] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedSub, setSelectedSub] = useState('');
  const [showRecent, setShowRecent] = useState(false);

  const ch = channels.find(c => c.id === channelId);

  // Get watch history data for this channel
  const watchActivity = useMemo(() => {
    if (!ch || typeof window === 'undefined') return null;
    try {
      const wh = JSON.parse(localStorage.getItem('subsort_watchhistory'));
      if (!wh?.topChannels) return null;
      const ids = new Set([
        ch.channelId, ch.id, ch.customUrl?.replace(/^@/, ''), ch.name?.toLowerCase(),
      ].filter(Boolean));

      const match = wh.topChannels.find(tc => {
        const tcUrlId = tc.channelUrl?.replace(/\/$/, '').split('/').pop();
        const tcHandle = tc.channelUrl?.match(/@([^/]+)/)?.[1];
        return (tcUrlId && ids.has(tcUrlId)) || (tcHandle && ids.has(tcHandle.toLowerCase())) || (tc.channelName && ids.has(tc.channelName.toLowerCase()));
      });
      if (!match) return { watched: 0, lastWatched: null, rate: 'none' };
      const pct = ch.videoCount ? Math.round((match.count / ch.videoCount) * 100) : 0;
      const rate = pct >= 50 ? 'high' : pct >= 20 ? 'medium' : pct >= 5 ? 'low' : 'minimal';
      return { watched: match.count, lastWatched: null, rate, pct };
    } catch { return null; }
  }, [ch]);

  // Derive upload frequency and last upload from feed videos
  const uploadStats = useMemo(() => {
    if (!ch) return { lastUpload: null, frequency: null };
    const vids = feedVideos
      .filter(v => v.channelId === ch.channelId && v.publishedAt)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const lastUpload = vids[0]?.publishedAt || null;
    let frequency = null;
    if (vids.length >= 2) {
      const newest = new Date(vids[0].publishedAt);
      const oldest = new Date(vids[vids.length - 1].publishedAt);
      const daySpan = (newest - oldest) / (1000 * 60 * 60 * 24);
      if (daySpan > 0) {
        const perWeek = (vids.length - 1) / (daySpan / 7);
        if (perWeek >= 5) frequency = 'Daily';
        else if (perWeek >= 2) frequency = `${Math.round(perWeek)}/week`;
        else if (perWeek >= 0.8) frequency = 'Weekly';
        else if (perWeek >= 0.4) frequency = 'Biweekly';
        else frequency = 'Monthly';
      }
    }
    return { lastUpload, frequency };
  }, [ch, feedVideos]);

  const recentVids = useMemo(() => {
    if (!ch) return [];
    return feedVideos.filter(v => v.channelId === ch.channelId).slice(0, 5);
  }, [ch, feedVideos]);

  // Init edit state when channel changes
  useEffect(() => {
    if (!ch) return;
    setSelectedCats([...(ch.categories || [])]);
    setSelectedSub(ch.subcategory || '');
    setEditingCat(false);
    setEditingSub(false);
    setShowRecent(false);
  }, [channelId, ch]);

  // Available subcategories for selected categories
  const availableSubs = useMemo(() => {
    const all = [];
    for (const cat of selectedCats) {
      for (const sub of (subcategories[cat] || [])) {
        if (!all.includes(sub)) all.push(sub);
      }
    }
    return all;
  }, [selectedCats, subcategories]);

  // Save categories
  const saveCats = useCallback(async () => {
    if (!ch || !user) return;
    await supabase.from('channel_categories').delete().eq('channel_id', ch.id).eq('user_id', user.id);
    if (selectedCats.length && dbCategories.length) {
      const inserts = selectedCats.map(catName => {
        const cat = dbCategories.find(c => c.name === catName);
        return cat ? { channel_id: ch.id, category_id: cat.id, user_id: user.id } : null;
      }).filter(Boolean);
      if (inserts.length) await supabase.from('channel_categories').insert(inserts);
    }
    // If the channel's subcategory belongs to a removed category, clear it
    if (ch.subcategory) {
      const removedCats = (ch.categories || []).filter(c => !selectedCats.includes(c));
      const subBelongsToRemoved = removedCats.some(cat => (subcategories[cat] || []).includes(ch.subcategory));
      if (subBelongsToRemoved) {
        await supabase.from('channels').update({ subcategory_id: null }).eq('id', ch.id);
        setSelectedSub('');
      }
    }
    showToast('Categories updated');
    setEditingCat(false);
    await reload();
  }, [ch, user, selectedCats, dbCategories, subcategories, reload]);

  // Save subcategory
  const saveSub = useCallback(async () => {
    if (!ch || !user) return;
    let subId = null;
    if (selectedSub) {
      const subRow = dbSubcategories.find(s => s.name === selectedSub);
      subId = subRow?.id || null;
    }
    await supabase.from('channels').update({ subcategory_id: subId }).eq('id', ch.id);
    showToast('Subcategory updated');
    setEditingSub(false);
    await reload();
  }, [ch, user, selectedSub, dbSubcategories, reload]);

  if (!ch) return null;

  const cats = chCats(ch);
  const cat = cats[0] || '';
  const col = categoryColours[cat] || 'var(--accent)';
  const initials = (ch.name || '??').substring(0, 2).toUpperCase();
  const handle = ch.customUrl ? `@${ch.customUrl.replace(/^@/, '')}` : '';
  const state = getChannelState(ch);
  const ytUrl = ch.customUrl
    ? `https://youtube.com/@${ch.customUrl.replace(/^@/, '')}`
    : `https://youtube.com/channel/${ch.channelId || ch.id}`;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="sp-slide-panel">
      {/* Header — avatar left, name/handle right */}
      <div className="sp-panel-header">
        <div className="sp-panel-header-left">
          <div className="sp-panel-avatar" style={{ background: col }}>{ch.thumbnail ? <img src={ch.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}</div>
          <div className="sp-panel-header-info">
            <div className="sp-panel-name">{ch.name}</div>
            {handle && <div className="sp-panel-handle">{handle}</div>}
          </div>
        </div>
        <button className="sp-panel-close" onClick={onClose}>&times;</button>
      </div>

      {/* Critic */}
      <div className="sp-panel-critic">
        <div className="sp-panel-critic-header">
          <div className="sp-panel-critic-icon" style={{ background: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3 3 .4-2.2 2.1.5 3L6 8l-2.8 1.5.5-3L1.5 4.4l3-.4z" fill="#fff" /></svg>
          </div>
          <span className="sp-panel-critic-label" style={{ color: 'var(--accent-text)' }}>The Critic</span>
        </div>
        <div className="sp-panel-critic-quote" style={{ color: 'var(--orange-text)' }}>
          {state === 'active' && ch.favourited && `"One of your favourites. ${ch.subscriberCount > 100000 ? 'Popular choice.' : 'Solid pick.'} Keep watching."`}
          {state === 'active' && !ch.favourited && `"Active channel, regular uploads. ${cats.length === 0 ? 'Needs a category though.' : 'Doing fine.'}"`}
          {state === 'inactive' && `"This one's been quiet. Might be time to reconsider."`}
          {state === 'dead' && `"No uploads, low activity. This is dead weight, Dean."`}
        </div>
      </div>

      {/* Favourite + Recent uploads + YouTube buttons */}
      <div className="sp-panel-quick-actions">
        <button className={`sp-panel-qa-btn${ch.favourited ? ' sp-panel-qa-fav-on' : ''}`} onClick={() => toggleFavourite(ch.id)}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5l1.7 3.5 3.8.5-2.75 2.7.65 3.8L7 10.2 3.6 12l.65-3.8L1.5 5.5l3.8-.5z"
              fill={ch.favourited ? 'var(--orange)' : 'none'}
              stroke={ch.favourited ? 'var(--orange)' : 'currentColor'}
              strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {ch.favourited ? 'Favourited' : 'Favourite'}
        </button>
        {recentVids.length > 0 && (
          <button className="sp-panel-qa-btn" onClick={() => setShowRecent(!showRecent)}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M5 5.5v3l3.5-1.5z" fill="currentColor" />
            </svg>
            Recent uploads
          </button>
        )}
        <a className="sp-panel-qa-btn" href={ytUrl} target="_blank" rel="noopener noreferrer">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 7L7 13M13 7H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          YouTube
        </a>
      </div>

      {/* Recent uploads expandable */}
      {showRecent && (
        <div className="sp-panel-recent">
          {recentVids.map(v => (
            <div key={v.id} className="sp-panel-recent-item">
              <div className="sp-panel-recent-thumb">
                {v.thumbnail && <img src={v.thumbnail} alt="" />}
              </div>
              <div className="sp-panel-recent-info">
                <div className="sp-panel-recent-title">{v.title}</div>
                <div className="sp-panel-recent-date">{v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Divider 1: after buttons ── */}
      <div className="sp-panel-divider" />

      {/* Stats */}
      <div className="sp-panel-section">
        <div className="sp-panel-section-title">CHANNEL STATS</div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Subscribers</span><span className="sp-panel-stat-value">{ch.subscriberCount ? formatCount(ch.subscriberCount) : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Videos</span><span className="sp-panel-stat-value">{ch.videoCount != null ? ch.videoCount.toLocaleString() : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Total views</span><span className="sp-panel-stat-value">{ch.viewCount ? formatCount(ch.viewCount) : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Subscribed since</span><span className="sp-panel-stat-value">{fmtDate(ch.subscribedAt)}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Channel created</span><span className="sp-panel-stat-value">{fmtDate(ch.channelCreatedAt)}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Upload frequency</span><span className="sp-panel-stat-value">{uploadStats.frequency || '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Last upload</span><span className="sp-panel-stat-value">{uploadStats.lastUpload ? fmtDate(uploadStats.lastUpload) : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Status</span><span className={`s2-status ${state}`}>{state === 'dead' ? 'Dead' : state === 'inactive' ? 'Inactive' : 'Active'}</span></div>
      </div>

      {/* ── Divider: between stats and activity ── */}
      <div className="sp-panel-divider" />

      {/* Your Activity */}
      <div className="sp-panel-section">
        <div className="sp-panel-section-title">YOUR ACTIVITY</div>
        <div className="sp-panel-stat-row">
          <span className="sp-panel-stat-label">Videos watched</span>
          <span className="sp-panel-stat-value">
            {watchActivity ? `${watchActivity.watched} of ${ch.videoCount?.toLocaleString() || '—'}` : `— of ${ch.videoCount?.toLocaleString() || '—'}`}
          </span>
        </div>
        <div className="sp-panel-bar">
          <div className="sp-panel-bar-fill" style={{ width: `${watchActivity?.pct || 0}%`, background: watchActivity?.pct >= 50 ? 'var(--accent)' : watchActivity?.pct >= 20 ? 'var(--orange)' : 'var(--text-muted)' }} />
        </div>
        <div className="sp-panel-stat-row" style={{ marginTop: 8 }}>
          <span className="sp-panel-stat-label">Watch rate</span>
          <span className="sp-panel-stat-value" style={{
            color: !watchActivity ? 'var(--text-muted)' :
              watchActivity.rate === 'high' ? 'var(--accent)' :
              watchActivity.rate === 'medium' ? 'var(--orange)' :
              watchActivity.rate === 'low' ? 'var(--text-secondary)' : 'var(--text-muted)'
          }}>
            {!watchActivity ? 'Upload watch history' :
              watchActivity.rate === 'high' ? 'High' :
              watchActivity.rate === 'medium' ? 'Medium' :
              watchActivity.rate === 'low' ? 'Low' :
              watchActivity.rate === 'minimal' ? 'Minimal' : 'None'}
          </span>
        </div>
      </div>

      {/* ── Divider 2: after Your Activity ── */}
      <div className="sp-panel-divider" />

      {/* Category & Subcategory — single section */}
      <div className="sp-panel-section sp-panel-section-no-border">
        <div className="sp-panel-section-header">
          <span className="sp-panel-section-title">CATEGORY</span>
          {!editingCat ? (
            <button className="sp-panel-edit-btn" onClick={() => setEditingCat(true)}>Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="sp-panel-save-btn" onClick={saveCats}>Save</button>
              <button className="sp-panel-edit-btn" onClick={() => { setEditingCat(false); setSelectedCats([...(ch.categories || [])]); }}>Cancel</button>
            </div>
          )}
        </div>
        {editingCat ? (
          <div className="sp-panel-cat-list">
            {categories.map(c => (
              <label key={c} className={`sp-panel-cat-option${selectedCats.includes(c) ? ' on' : ''}`}
                onClick={() => setSelectedCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}>
                <div className={`cp-check${selectedCats.includes(c) ? ' on' : ''}`}>
                  {selectedCats.includes(c) && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                {c}
              </label>
            ))}
          </div>
        ) : (
          <div className="sp-panel-tags">
            {cats.length > 0 ? cats.map(c => (
              <span key={c} className="sp-panel-tag" style={{ background: `${categoryColours[c] || 'var(--accent)'}15`, color: categoryColours[c] || 'var(--accent)' }}>{c}</span>
            )) : (
              <span className="sp-panel-tag" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Uncategorised</span>
            )}
          </div>
        )}

        {/* Subcategory — within the same section */}
        <div className="sp-panel-section-header" style={{ marginTop: 16 }}>
          <span className="sp-panel-section-title">SUBCATEGORY</span>
          {availableSubs.length > 0 && (
            !editingSub ? (
              <div style={{ display: 'flex', gap: 4 }}>
                {!ch.subcategory && <button className="sp-panel-edit-btn" onClick={() => setEditingSub(true)}>Add</button>}
                <button className="sp-panel-edit-btn" onClick={() => setEditingSub(true)}>Edit</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="sp-panel-save-btn" onClick={saveSub}>Save</button>
                <button className="sp-panel-edit-btn" onClick={() => { setEditingSub(false); setSelectedSub(ch.subcategory || ''); }}>Cancel</button>
              </div>
            )
          )}
        </div>
        {editingSub ? (
          <div className="sp-panel-cat-list">
            {availableSubs.map(s => (
              <label key={s} className={`sp-panel-cat-option${selectedSub === s ? ' on' : ''}`}
                onClick={() => setSelectedSub(prev => prev === s ? '' : s)}>
                <div className={`cp-check${selectedSub === s ? ' on' : ''}`}>
                  {selectedSub === s && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                {s}
              </label>
            ))}
          </div>
        ) : (
          <div className="sp-panel-tags">
            {ch.subcategory ? (
              <span className="sp-panel-tag" style={{ background: `${col}15`, color: col }}>{ch.subcategory}</span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {availableSubs.length > 0 ? 'None assigned' : 'None yet.'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {ch.notes && (
        <div className="sp-panel-section sp-panel-section-no-border">
          <div className="sp-panel-section-title">NOTES</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ch.notes}</div>
        </div>
      )}
    </div>
  );
}
