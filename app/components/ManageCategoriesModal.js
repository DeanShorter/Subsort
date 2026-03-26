'use client';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useChannelData } from './ChannelDataContext';
import { supabase } from '../../lib/supabase';

const COLOUR_OPTIONS = ['#E85D50','#378ADD','#B07CED','#EF9F27','#D4537E','#5DCAA5','#97C459','#E8875C','#85B7EB','#3ECFA0'];

export default function ManageCategoriesModal({ onClose }) {
  const { user } = useAuth();
  const { dbCategories, dbSubcategories, channels, chHasCat, reload } = useChannelData();

  const [cats, setCats] = useState([]);
  const [subs, setSubs] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [colourPickerCat, setColourPickerCat] = useState(null);
  const [saving, setSaving] = useState(false);

  // Init from DB
  useEffect(() => {
    setCats(dbCategories.map(c => ({ ...c, _deleted: false, _new: false })));
    setSubs(dbSubcategories.map(s => ({ ...s, _deleted: false, _new: false })));
  }, [dbCategories, dbSubcategories]);

  const catCount = (catId) => {
    const cat = cats.find(c => c.id === catId);
    if (!cat) return 0;
    return channels.filter(ch => chHasCat(ch, cat.name)).length;
  };

  const catSubs = (catId) => subs.filter(s => s.category_id === catId && !s._deleted);

  // ── Category operations ─────────────────────────────
  const addCategory = () => {
    setCats(prev => [...prev, {
      id: `new-${Date.now()}`, name: '', colour: COLOUR_OPTIONS[prev.length % COLOUR_OPTIONS.length],
      sort_order: prev.length, user_id: user?.id, _new: true, _deleted: false,
    }]);
  };

  const updateCatName = (id, name) => setCats(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  const updateCatColour = (id, colour) => { setCats(prev => prev.map(c => c.id === id ? { ...c, colour } : c)); setColourPickerCat(null); };
  const deleteCat = (id) => setCats(prev => prev.map(c => c.id === id ? { ...c, _deleted: true } : c));

  // ── Subcategory operations ──────────────────────────
  const addSubcat = (catId) => {
    setSubs(prev => [...prev, {
      id: `new-${Date.now()}`, name: '', category_id: catId,
      sort_order: prev.filter(s => s.category_id === catId).length, user_id: user?.id, _new: true, _deleted: false,
    }]);
  };

  const updateSubName = (id, name) => setSubs(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  const deleteSubcat = (id) => setSubs(prev => prev.map(s => s.id === id ? { ...s, _deleted: true } : s));

  // ── Save all changes ────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Delete removed categories
      const deletedCats = cats.filter(c => c._deleted && !c._new);
      for (const c of deletedCats) {
        await supabase.from('subcategories').delete().eq('category_id', c.id);
        await supabase.from('channel_categories').delete().eq('category_id', c.id);
        await supabase.from('categories').delete().eq('id', c.id);
      }

      // Delete removed subcategories
      const deletedSubs = subs.filter(s => s._deleted && !s._new);
      for (const s of deletedSubs) {
        await supabase.from('subcategories').delete().eq('id', s.id);
      }

      // Upsert categories (new + updated)
      const activeCats = cats.filter(c => !c._deleted);
      for (let i = 0; i < activeCats.length; i++) {
        const c = activeCats[i];
        if (c._new) {
          if (!c.name.trim()) continue;
          const { data } = await supabase.from('categories').insert({
            name: c.name.trim(), colour: c.colour, sort_order: i, user_id: user.id,
          }).select().single();
          // Update local ID for subcategory references
          if (data) {
            setSubs(prev => prev.map(s => s.category_id === c.id ? { ...s, category_id: data.id } : s));
            c.id = data.id;
          }
        } else {
          await supabase.from('categories').update({
            name: c.name.trim(), colour: c.colour, sort_order: i,
          }).eq('id', c.id);
        }
      }

      // Upsert subcategories
      const activeSubs = subs.filter(s => !s._deleted);
      for (let i = 0; i < activeSubs.length; i++) {
        const s = activeSubs[i];
        if (s._new) {
          if (!s.name.trim()) continue;
          await supabase.from('subcategories').insert({
            name: s.name.trim(), category_id: s.category_id, sort_order: i, user_id: user.id,
          });
        } else {
          await supabase.from('subcategories').update({
            name: s.name.trim(), sort_order: i,
          }).eq('id', s.id);
        }
      }

      await reload();
      onClose();
    } catch (e) {
      console.error('Save categories failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const activeCats = cats.filter(c => !c._deleted);

  return (
    <div className="f2-player-overlay" onClick={onClose}>
      <div className="mcm-modal" onClick={e => e.stopPropagation()}>
        <div className="mcm-header">
          <span className="mcm-title">Manage categories</span>
          <button className="mcm-close" onClick={onClose}>✕</button>
        </div>

        <div className="mcm-body">
          {activeCats.map((cat, i) => (
            <div key={cat.id}>
              <div className="mcm-cat-row">
                <span className="mcm-drag">⠿</span>
                <div
                  className="mcm-colour"
                  style={{ background: cat.colour || 'var(--accent)' }}
                  onClick={() => setColourPickerCat(colourPickerCat === cat.id ? null : cat.id)}
                />
                <input
                  className="mcm-cat-name"
                  value={cat.name}
                  onChange={e => updateCatName(cat.id, e.target.value)}
                  placeholder="Category name..."
                />
                <span className="mcm-count">{catCount(cat.id)}</span>
                <button className="mcm-expand" onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                  {expandedCat === cat.id ? '▾' : '▸'}
                </button>
                <button className="mcm-delete" onClick={() => deleteCat(cat.id)}>✕</button>
              </div>

              {/* Colour picker */}
              {colourPickerCat === cat.id && (
                <div className="mcm-colour-picker">
                  {COLOUR_OPTIONS.map(c => (
                    <div
                      key={c}
                      className={`mcm-colour-opt${cat.colour === c ? ' selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => updateCatColour(cat.id, c)}
                    />
                  ))}
                </div>
              )}

              {/* Subcategories */}
              {expandedCat === cat.id && (
                <div className="mcm-subcats">
                  {catSubs(cat.id).map(sub => (
                    <div key={sub.id} className="mcm-subcat-row">
                      <input
                        className="mcm-subcat-name"
                        value={sub.name}
                        onChange={e => updateSubName(sub.id, e.target.value)}
                        placeholder="Subcategory name..."
                      />
                      <span className="mcm-subcat-delete" onClick={() => deleteSubcat(sub.id)}>✕</span>
                    </div>
                  ))}
                  <div className="mcm-subcat-add" onClick={() => addSubcat(cat.id)}>+ Add subcategory</div>
                </div>
              )}
            </div>
          ))}

          <div className="mcm-add-cat" onClick={addCategory}>+ Add category</div>
        </div>

        <div className="mcm-footer">
          <button className="s2-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="s2-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
