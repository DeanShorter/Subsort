'use client';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useChannelData } from './ChannelDataContext';
import { useAuth } from './AuthContext';
import { supabase } from '../../lib/supabase';
import { showToast } from './Toast';

export default function ChannelPanel({ channelId, onClose }) {
  const { channels, categories, subcategories, categoryColours, chCats, formatCount, getChannelState, feedVideos, dbCategories, dbSubcategories, reload } = useChannelData();
  const { user } = useAuth();
  const [editingCat, setEditingCat] = useState(false);
  const [editingSub, setEditingSub] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedSub, setSelectedSub] = useState('');

  const ch = channels.find(c => c.id === channelId);

  // Get watch history data for this channel
  const watchActivity = useMemo(() => {
    if (!ch || typeof window === 'undefined') return null;
    try {
      const wh = JSON.parse(localStorage.getItem('subsort_watchhistory'));
      if (!wh?.topChannels) return null;
      // Match against all possible identifiers
      const ids = new Set([
        ch.channelId,
        ch.id,
        ch.customUrl?.replace(/^@/, ''),
        ch.name?.toLowerCase(),
      ].filter(Boolean));

      const match = wh.topChannels.find(tc => {
        const tcUrlId = tc.channelUrl?.replace(/\/$/, '').split('/').pop();
        const tcHandle = tc.channelUrl?.match(/@([^/]+)/)?.[1];
        return (
          (tcUrlId && ids.has(tcUrlId)) ||
          (tcHandle && ids.has(tcHandle.toLowerCase())) ||
          (tc.channelName && ids.has(tc.channelName.toLowerCase()))
        );
      });
      if (!match) return { watched: 0, lastWatched: null, rate: 'none' };
      const pct = ch.videoCount ? Math.round((match.count / ch.videoCount) * 100) : 0;
      const rate = pct >= 50 ? 'high' : pct >= 20 ? 'medium' : pct >= 5 ? 'low' : 'minimal';
      return { watched: match.count, lastWatched: null, rate, pct };
    } catch { return null; }
  }, [ch]);

  // Init edit state when channel changes
  useEffect(() => {
    if (!ch) return;
    setSelectedCats([...(ch.categories || [])]);
    setSelectedSub(ch.subcategory || '');
    setEditingCat(false);
    setEditingSub(false);
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
    await supabase.from('channel_categories').delete().eq('channel_id', ch.id);
    if (selectedCats.length && dbCategories.length) {
      const inserts = selectedCats.map(catName => {
        const cat = dbCategories.find(c => c.name === catName);
        return cat ? { channel_id: ch.id, category_id: cat.id } : null;
      }).filter(Boolean);
      if (inserts.length) await supabase.from('channel_categories').insert(inserts);
    }
    showToast('Categories updated');
    setEditingCat(false);
    await reload();
  }, [ch, user, selectedCats, dbCategories, reload]);

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
      {/* Header */}
      <div className="sp-panel-header">
        <div>
          <div className="sp-panel-avatar" style={{ background: col }}>{ch.thumbnail ? <img src={ch.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : initials}</div>
          <div className="sp-panel-name">{ch.name}</div>
          {handle && <div className="sp-panel-handle">{handle}</div>}
        </div>
        <button className="sp-panel-close" onClick={onClose}>&times;</button>
      </div>

      {/* Stats */}
      <div className="sp-panel-section">
        <div className="sp-panel-section-title">CHANNEL STATS</div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Subscribers</span><span className="sp-panel-stat-value">{ch.subscriberCount ? formatCount(ch.subscriberCount) : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Videos</span><span className="sp-panel-stat-value">{ch.videoCount != null ? ch.videoCount.toLocaleString() : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Total views</span><span className="sp-panel-stat-value">{ch.viewCount ? formatCount(ch.viewCount) : '—'}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Subscribed</span><span className="sp-panel-stat-value">{fmtDate(ch.subscribedAt)}</span></div>
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Channel created</span><span className="sp-panel-stat-value">{fmtDate(ch.channelCreatedAt)}</span></div>
        {ch.country && <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Country</span><span className="sp-panel-stat-value">{ch.country}</span></div>}
        <div className="sp-panel-stat-row"><span className="sp-panel-stat-label">Status</span><span className={`s2-status ${state}`}>{state === 'dead' ? 'Dead' : state === 'inactive' ? 'Inactive' : 'Active'}</span></div>
      </div>

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

      {/* Category */}
      <div className="sp-panel-section">
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
      </div>

      {/* Subcategory */}
      <div className="sp-panel-section">
        <div className="sp-panel-section-header">
          <span className="sp-panel-section-title">SUBCATEGORY</span>
          {!editingSub ? (
            <button className="sp-panel-edit-btn" onClick={() => setEditingSub(true)}>{ch.subcategory ? 'Edit' : 'Add'}</button>
          ) : (
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="sp-panel-save-btn" onClick={saveSub}>Save</button>
              <button className="sp-panel-edit-btn" onClick={() => { setEditingSub(false); setSelectedSub(ch.subcategory || ''); }}>Cancel</button>
            </div>
          )}
        </div>
        {editingSub ? (
          <div>
            {availableSubs.length > 0 && (
              <select className="sp-panel-select" value={selectedSub} onChange={e => setSelectedSub(e.target.value)}>
                <option value="">None</option>
                {availableSubs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <input className="sp-panel-input" type="text" placeholder={availableSubs.length > 0 ? 'Or type new...' : 'Type subcategory...'} onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { setSelectedSub(e.target.value.trim()); e.target.value = ''; } }} style={{ marginTop: availableSubs.length > 0 ? 6 : 0 }} />
          </div>
        ) : (
          <div className="sp-panel-tags">
            {ch.subcategory ? (
              <span className="sp-panel-tag" style={{ background: `${col}15`, color: col }}>{ch.subcategory}</span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>None assigned</span>
            )}
          </div>
        )}
      </div>

      {/* Recent videos */}
      {(() => {
        const recentVids = feedVideos.filter(v => v.channelId === ch.channelId).slice(0, 3);
        if (!recentVids.length) return null;
        return (
          <div className="sp-panel-section">
            <div className="sp-panel-section-title">RECENT UPLOADS</div>
            {recentVids.map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: 60, height: 34, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-primary)' }}>
                  {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Notes */}
      {ch.notes && (
        <div className="sp-panel-section">
          <div className="sp-panel-section-title">NOTES</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ch.notes}</div>
        </div>
      )}

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

      {/* Actions */}
      <div className="sp-panel-actions">
        <button className="sp-panel-action-btn" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }} onClick={onClose}>Recategorise</button>
        <a className="sp-panel-action-btn" style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} href={ytUrl} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
      </div>
    </div>
  );
}
