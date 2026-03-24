'use client';
import { useState, useMemo, useEffect } from 'react';
import { useChannelData } from './ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { trackEvent } from '../../lib/track';

export default function EditChannelModal({ channelId, onClose }) {
  const { user } = useAuth();
  const {
    channels, categories, subcategories, categoryColours,
    dbCategories, dbSubcategories, chCats, formatCount, reload, toggleFavourite,
  } = useChannelData();

  const ch = channels.find(c => c.id === channelId);

  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedSub, setSelectedSub] = useState('');
  const [notes, setNotes] = useState('');
  const [showCatEdit, setShowCatEdit] = useState(false);
  const [showSubEdit, setShowSubEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // Init state from channel
  useEffect(() => {
    if (!ch) return;
    setSelectedCats([...(ch.categories || [])]);
    setSelectedSub(ch.subcategory || '');
    setNotes(ch.notes || '');
    setShowCatEdit(false);
    setShowSubEdit(false);
  }, [ch]);

  // Derived
  const cats = chCats(ch);
  const col = (cats[0] && categoryColours[cats[0]]) || '#38E9B1';
  const initials = ch?.name ? ch.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
  const handle = ch?.customUrl ? `@${ch.customUrl.replace(/^@/, '')}` : '';
  const ytUrl = ch?.customUrl
    ? `https://youtube.com/@${ch.customUrl.replace(/^@/, '')}`
    : `https://youtube.com/channel/${ch?.channelId || ch?.id}`;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

  const stats = [
    { v: ch?.subscriberCount ? formatCount(ch.subscriberCount) : '—', l: 'Subscribers' },
    { v: ch?.videoCount != null ? ch.videoCount.toLocaleString() : '—', l: 'Videos' },
    { v: ch?.viewCount ? formatCount(ch.viewCount) : '—', l: 'Total views' },
    { v: fmtDate(ch?.subscribedAt), l: 'Subscribed' },
    { v: fmtDate(ch?.channelCreatedAt), l: 'Created' },
  ];

  // Available subcategories from selected categories + current channel's subcategory
  const availableSubs = useMemo(() => {
    const all = [];
    for (const cat of selectedCats) {
      for (const sub of (subcategories[cat] || [])) {
        if (!all.includes(sub)) all.push(sub);
      }
    }
    // Include channel's current subcategory even if not in context yet
    if (ch?.subcategory && !all.includes(ch.subcategory)) all.push(ch.subcategory);
    return all;
  }, [selectedCats, subcategories, ch]);

  const keywords = (ch?.keywords || '').split(',').map(k => k.trim()).filter(Boolean);

  // ── Toggle category ────────────────────────────────────
  const toggleCat = (cat) => {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ── Save ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!ch || !user) return;
    setSaving(true);

    try {
      // Track which features were used
      trackEvent('category_edit');
      if (notes && notes !== ch.notes) trackEvent('add_note');

      // Update local channel object
      ch.categories = selectedCats;
      ch.subcategory = selectedSub;
      ch.notes = notes;

      // Save to Supabase — resolve subcategory ID
      let subcategoryId = null;
      if (selectedSub) {
        let subRow = dbSubcategories.find(s => s.name === selectedSub);
        if (!subRow) {
          // Create new subcategory under the first selected category
          const parentCat = dbCategories.find(c => selectedCats.includes(c.name));
          if (parentCat) {
            const { data: newSub, error: subErr } = await supabase.from('subcategories')
              .insert({ name: selectedSub, category_id: parentCat.id, sort_order: 999, user_id: user.id })
              .select()
              .single();
            if (subErr) console.error('[EditChannel] Create subcategory failed:', subErr);
            if (newSub) subcategoryId = newSub.id;
          }
        } else {
          subcategoryId = subRow.id;
        }
      }

      const { error: updateErr } = await supabase.from('channels')
        .update({ notes, subcategory_id: subcategoryId })
        .eq('id', ch.id);
      if (updateErr) console.error('[EditChannel] Channel update failed:', updateErr);

      // Update channel_categories
      await supabase.from('channel_categories').delete().eq('channel_id', ch.id);
      if (selectedCats.length && dbCategories.length) {
        const inserts = selectedCats
          .map(catName => {
            const cat = dbCategories.find(c => c.name === catName);
            return cat ? { user_id: user.id, channel_id: ch.id, category_id: cat.id } : null;
          })
          .filter(Boolean);
        if (inserts.length) {
          await supabase.from('channel_categories').insert(inserts);
        }
      }

      // Reload data
      await reload();
    } catch (e) {
      console.error('[EditChannel] Save failed:', e);
    } finally {
      setSaving(false);
      onClose();
    }
  };

  if (!ch) return null;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal ecm-modal" onClick={e => e.stopPropagation()}>
        {/* Banner */}
        <div
          className="ecm-banner"
          style={{ background: `linear-gradient(135deg,${col}88 0%,${col}44 60%,${col}22 100%)` }}
        >
          <button className="ecm-close-btn" onClick={onClose}>&#x2715;</button>
        </div>

        {/* Identity */}
        <div className="ecm-identity">
          <div className="ecm-avatar">
            {ch.thumbnail
              ? <img src={ch.thumbnail} alt="" onError={e => { e.target.style.display = 'none'; }} />
              : initials
            }
          </div>
          <div className="ecm-name-row">
            <div>
              <div className="ecm-channel-name">{ch.name || ''}</div>
              <div className="ecm-handle">{handle}</div>
            </div>
            <div className="ecm-action-btns">
              <button className={`ecm-btn${ch.favourited ? ' fav-on' : ''}`} onClick={() => { toggleFavourite(ch.id); trackEvent('favourite'); }}>
                <svg viewBox="0 0 16 16"><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" /></svg>
                {ch.favourited ? 'Favourited' : 'Favourite'}
              </button>
              <a className="ecm-btn ecm-yt" href={ytUrl} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 16 16"><path d="M14.4 4.6s-.2-1.2-.7-1.7c-.6-.7-1.4-.7-1.7-.7C9.6 2 8 2 8 2s-1.6 0-4 .2c-.3 0-1.1 0-1.7.7-.5.5-.7 1.7-.7 1.7S1.4 6 1.4 7.4v1.2c0 1.4.2 2.8.2 2.8s.2 1.2.7 1.7c.6.7 1.5.7 1.9.7 1.4.1 5.8.2 5.8.2s1.6 0 4-.2c.3 0 1.1 0 1.7-.7.5-.5.7-1.7.7-1.7s.2-1.4.2-2.8V7.4c0-1.4-.2-2.8-.2-2.8zM6.4 10.2V5.8L10.4 8l-4 2.2z" /></svg>
                YouTube
              </a>
            </div>
          </div>
        </div>

        <div className="ecm-divider" />

        {/* Stats */}
        <div className="ecm-stats">
          {stats.map((s, i) => (
            <div key={i} className="ecm-stat">
              <div className="ecm-stat-value">{s.v}</div>
              <div className="ecm-stat-label">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="ecm-divider" />

        {/* Category & subcategory fields */}
        <div className="ecm-fields">
          <div className="ecm-field-row">
            <span className="ecm-field-label">Category</span>
            <div className="ecm-field-tags">
              {selectedCats.map(c => (
                <span key={c} className="ecm-tag ecm-tag-cat">{c}</span>
              ))}
            </div>
            <button className="ecm-tag-add" onClick={() => setShowCatEdit(!showCatEdit)}>
              {showCatEdit ? 'Done' : 'Edit'}
            </button>
          </div>

          {showCatEdit && (
            <div className="ecm-cat-edit-panel" style={{ display: 'block' }}>
              <div className="cat-checkbox-list">
                {categories.map(c => (
                  <label
                    key={c}
                    className={`cat-check-item${selectedCats.includes(c) ? ' checked' : ''}`}
                    onClick={() => toggleCat(c)}
                  >
                    <input type="checkbox" checked={selectedCats.includes(c)} readOnly />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="ecm-field-row">
            <span className="ecm-field-label">Subcategory</span>
            <div className="ecm-field-tags">
              {selectedSub && <span className="ecm-tag ecm-tag-sub">{selectedSub}</span>}
            </div>
            <button className="ecm-tag-add" onClick={() => setShowSubEdit(!showSubEdit)}>
              {showSubEdit ? 'Done' : selectedSub ? 'Edit' : 'Add'}
            </button>
          </div>

          {showSubEdit && (
            <div className="ecm-subcat-edit-panel" style={{ display: 'block' }}>
              {availableSubs.length > 0 ? (
                <>
                  <select
                    className="sort-select"
                    value={selectedSub}
                    onChange={e => setSelectedSub(e.target.value)}
                  >
                    <option value="">None</option>
                    {availableSubs.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div style={{ marginTop: '.5rem' }}>
                    <input
                      className="sort-select"
                      type="text"
                      placeholder="Or type a new subcategory…"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          setSelectedSub(e.target.value.trim());
                          e.target.value = '';
                        }
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              ) : (
                <input
                  className="sort-select"
                  type="text"
                  placeholder="Type a subcategory…"
                  value={selectedSub}
                  onChange={e => setSelectedSub(e.target.value)}
                  style={{ width: '100%' }}
                />
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="ecm-notes-section">
          <div className="ecm-notes-label">Notes</div>
          <textarea
            className="ecm-notes-input"
            placeholder="Add a note about this channel…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="ecm-keywords-section">
            <div className="ecm-kw-label">Keywords</div>
            <div className="ecm-kw-list">
              {keywords.map((k, i) => <span key={i} className="ecm-kw">{k}</span>)}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
