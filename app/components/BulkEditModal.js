'use client';
import { useState, useMemo } from 'react';
import { useChannelData } from './ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { showToast } from './Toast';

export default function BulkEditModal({ selectedIds, channels, onClose, onSaved }) {
  const { categories, subcategories, categoryColours, dbCategories, dbSubcategories, chCats } = useChannelData();
  const [action, setAction] = useState(null); // 'change_cat', 'remove_cat', 'change_sub'
  const [targetCategory, setTargetCategory] = useState('');
  const [targetSubcategory, setTargetSubcategory] = useState('');
  const [saving, setSaving] = useState(false);

  // Analyse selected channels
  const selected = useMemo(() => {
    return channels.filter(ch => selectedIds.has(ch.id));
  }, [channels, selectedIds]);

  const selectedCats = useMemo(() => {
    const cats = new Set();
    selected.forEach(ch => chCats(ch).forEach(c => cats.add(c)));
    return [...cats];
  }, [selected, chCats]);

  const isSameCategory = selectedCats.length === 1;
  const commonCategory = isSameCategory ? selectedCats[0] : null;
  const availableSubs = commonCategory ? (subcategories[commonCategory] || []) : [];

  const handleSave = async () => {
    if (!action) return;
    setSaving(true);

    try {
      if (action === 'remove_cat') {
        // Remove all category assignments and subcategories for selected channels
        for (const ch of selected) {
          const currentCats = chCats(ch);
          for (const cat of currentCats) {
            const dbCat = dbCategories.find(c => c.name === cat);
            if (dbCat) {
              await supabase.from('channel_categories').delete()
                .eq('channel_id', ch.id)
                .eq('category_id', dbCat.id);
            }
          }
          // Clear subcategory
          await supabase.from('channels').update({ subcategory_id: null }).eq('id', ch.id);
        }
        showToast(`Removed categories from ${selected.length} channels`);
      } else if (action === 'change_cat') {
        if (!targetCategory) return;
        const dbCat = dbCategories.find(c => c.name === targetCategory);
        if (!dbCat) return;

        for (const ch of selected) {
          // Remove existing categories and subcategory
          await supabase.from('channel_categories').delete().eq('channel_id', ch.id);
          await supabase.from('channels').update({ subcategory_id: null }).eq('id', ch.id);
          // Add new category
          await supabase.from('channel_categories').insert({
            channel_id: ch.id,
            category_id: dbCat.id,
          });
        }
        showToast(`Moved ${selected.length} channels to ${targetCategory}`);
      } else if (action === 'change_sub') {
        if (!targetSubcategory) return;
        const dbSub = dbSubcategories.find(s => s.name === targetSubcategory);
        if (!dbSub) return;

        for (const ch of selected) {
          await supabase.from('channels').update({ subcategory_id: dbSub.id }).eq('id', ch.id);
        }
        showToast(`Updated subcategory for ${selected.length} channels`);
      }

      await onSaved();
      onClose();
    } catch (e) {
      console.error('[BulkEdit] Error:', e);
      showToast('Bulk edit failed: ' + e.message, 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mcm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mcm-modal" style={{ maxWidth: 480 }}>
        <div className="mcm-header">
          <h2 className="mcm-title">Bulk Edit — {selected.length} channels</h2>
          <button className="mcm-close" onClick={onClose}>✕</button>
        </div>

        <div className="mcm-body" style={{ padding: '16px 20px' }}>
          {/* Summary */}
          <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--text-mid)' }}>
            {isSameCategory ? (
              <span>All selected channels are in <strong style={{ color: 'var(--text)' }}>{commonCategory}</strong></span>
            ) : (
              <span>Selected channels span <strong style={{ color: 'var(--text)' }}>{selectedCats.length} categories</strong>: {selectedCats.join(', ')}</span>
            )}
          </div>

          {/* Action selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            <button
              className={`ph-btn${action === 'change_cat' ? ' active' : ''}`}
              onClick={() => setAction('change_cat')}
              style={{ justifyContent: 'flex-start' }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M4 7h6M5 10h4" /></svg>
              Change category
            </button>
            <button
              className={`ph-btn${action === 'remove_cat' ? ' active' : ''}`}
              onClick={() => setAction('remove_cat')}
              style={{ justifyContent: 'flex-start' }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7h8" /></svg>
              Remove from category
            </button>
            {isSameCategory && availableSubs.length > 0 && (
              <button
                className={`ph-btn${action === 'change_sub' ? ' active' : ''}`}
                onClick={() => setAction('change_sub')}
                style={{ justifyContent: 'flex-start' }}
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 2v10M2 5h6" /></svg>
                Change subcategory
              </button>
            )}
          </div>

          {/* Target selection */}
          {action === 'change_cat' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-dim)', marginBottom: 8 }}>Move to category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`f2-cat-btn${targetCategory === cat ? ' active' : ''}`}
                    onClick={() => setTargetCategory(cat)}
                  >
                    <span className="f2-cat-dot" style={{ background: categoryColours[cat] || 'var(--accent)' }} />
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {action === 'change_sub' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--text-dim)', marginBottom: 8 }}>Change subcategory</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {availableSubs.map(sub => (
                  <button
                    key={sub}
                    className={`f2-subcat-btn${targetSubcategory === sub ? ' active' : ''}`}
                    onClick={() => setTargetSubcategory(sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {action === 'remove_cat' && (
            <div style={{ padding: 12, background: 'rgba(232,93,80,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(232,93,80,0.1)', fontSize: 12, color: 'var(--text-mid)', marginBottom: 16 }}>
              This will remove all category assignments from {selected.length} channels. They'll appear as uncategorised.
            </div>
          )}
        </div>

        <div className="mcm-footer">
          <button className="ph-btn" onClick={onClose}>Cancel</button>
          <button
            className="ph-btn primary"
            onClick={handleSave}
            disabled={saving || !action || (action === 'change_cat' && !targetCategory) || (action === 'change_sub' && !targetSubcategory)}
          >
            {saving ? 'Saving...' : `Apply to ${selected.length} channels`}
          </button>
        </div>
      </div>
    </div>
  );
}
