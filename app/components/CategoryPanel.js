'use client';
import { useState, useMemo, useCallback } from 'react';
import { useChannelData } from './ChannelDataContext';
import { useAuth } from './AuthContext';
import { supabase } from '../../lib/supabase';
import { showToast } from './Toast';

export default function CategoryPanel({ selectedCats, onToggleCat, onClose, onAutoSort }) {
  const { categories, subcategories, categoryColours, channels, chCats, chHasCat, dbCategories, dbSubcategories, reload } = useChannelData();
  const { user } = useAuth();
  const [searchQ, setSearchQ] = useState('');
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [editingCat, setEditingCat] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [addingSubTo, setAddingSubTo] = useState(null);
  const [newSubValue, setNewSubValue] = useState('');
  const [editingSub, setEditingSub] = useState(null);
  const [editSubValue, setEditSubValue] = useState('');

  // Delete confirmation modals
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null); // { name, count }
  const [deleteSubConfirm, setDeleteSubConfirm] = useState(null); // { name, parentName }
  const [postDeletePrompt, setPostDeletePrompt] = useState(null); // { count }

  const toggleExpand = (cat) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const filteredCats = useMemo(() => {
    if (!searchQ.trim()) return categories;
    const q = searchQ.toLowerCase();
    return categories.filter(c => c.toLowerCase().includes(q));
  }, [categories, searchQ]);

  const getCatCount = (cat) => channels.filter(c => chHasCat(c, cat)).length;
  const getSubCount = (cat, sub) => channels.filter(c => chHasCat(c, cat) && c.subcategory === sub).length;
  const favCount = channels.filter(c => c.favourited).length;

  // ── Add subcategory ──────────────────────────────
  const handleAddSub = useCallback(async (catName) => {
    if (!newSubValue.trim() || !user) return;
    const dbCat = dbCategories.find(c => c.name === catName);
    if (!dbCat) { showToast('Category not found'); return; }

    const name = newSubValue.trim();
    const { error } = await supabase.from('subcategories')
      .insert({ name, category_id: dbCat.id, sort_order: 999, user_id: user.id });
    if (error) { showToast('Failed to add subcategory'); console.error(error); }
    else {
      showToast(`Added subcategory: ${name}`);
      reload();
    }
    setNewSubValue('');
    setAddingSubTo(null);
  }, [newSubValue, user, dbCategories, reload]);

  // ── Rename subcategory ───────────────────────────
  const handleRenameSub = useCallback(async (subName) => {
    if (!editSubValue.trim() || !user) return;
    const dbSub = dbSubcategories.find(s => s.name === subName);
    if (!dbSub) return;

    const { error } = await supabase.from('subcategories').update({ name: editSubValue.trim() }).eq('id', dbSub.id);
    if (error) { showToast('Failed to rename subcategory'); console.error(error); }
    else { showToast(`Renamed to: ${editSubValue.trim()}`); reload(); }
    setEditingSub(null);
    setEditSubValue('');
  }, [editSubValue, user, dbSubcategories, reload]);

  // ── Delete subcategory (with modal) ─────────────
  const confirmDeleteSub = useCallback((subName, parentName) => {
    setDeleteSubConfirm({ name: subName, parentName });
  }, []);

  const executeDeleteSub = useCallback(async () => {
    if (!user || !deleteSubConfirm) return;
    const dbSub = dbSubcategories.find(s => s.name === deleteSubConfirm.name);
    if (!dbSub) return;

    const { error } = await supabase.from('subcategories').delete().eq('id', dbSub.id);
    if (error) { showToast('Failed to delete subcategory'); console.error(error); }
    else { showToast(`Deleted: ${deleteSubConfirm.name}`); reload(); }
    setDeleteSubConfirm(null);
  }, [user, dbSubcategories, deleteSubConfirm, reload]);

  // ── Rename category ──────────────────────────────
  const handleRename = useCallback(async (oldName) => {
    if (!editValue.trim() || !user) return;
    const dbCat = dbCategories.find(c => c.name === oldName);
    if (!dbCat) return;

    const { error } = await supabase.from('categories').update({ name: editValue.trim() }).eq('id', dbCat.id);
    if (error) { showToast('Failed to rename'); console.error(error); }
    else {
      showToast(`Renamed to: ${editValue.trim()}`);
      reload();
    }
    setEditingCat(null);
    setEditValue('');
  }, [editValue, user, dbCategories, reload]);

  // ── Delete category (with modal) ─────────────────
  const confirmDeleteCat = useCallback((catName) => {
    const count = getCatCount(catName);
    setDeleteCatConfirm({ name: catName, count });
  }, [channels, chHasCat]);

  const executeDeleteCat = useCallback(async () => {
    if (!user || !deleteCatConfirm) return;
    const dbCat = dbCategories.find(c => c.name === deleteCatConfirm.name);
    if (!dbCat) return;
    const affectedCount = deleteCatConfirm.count;

    await supabase.from('channel_categories').delete().eq('category_id', dbCat.id);
    await supabase.from('subcategories').delete().eq('category_id', dbCat.id);
    const { error } = await supabase.from('categories').delete().eq('id', dbCat.id);
    if (error) { showToast('Failed to delete'); console.error(error); }
    else {
      reload();
      setDeleteCatConfirm(null);
      if (affectedCount > 0) {
        setPostDeletePrompt({ count: affectedCount });
      }
      return;
    }
    setDeleteCatConfirm(null);
  }, [user, dbCategories, deleteCatConfirm, reload]);

  return (
    <div className="cp-panel">
      <div className="cp-head">
        <span className="cp-title">Categories</span>
        <button className="cp-toggle" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="cp-search">
        <input type="text" placeholder="Search categories..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>

      <div className="cp-list">
        {/* All */}
        <div className={`cp-item${selectedCats.size === 0 ? ' on' : ''}`} onClick={() => onToggleCat('__all__')}>
          <div className="cp-item-left">
            <div className={`cp-check${selectedCats.size === 0 ? ' on' : ''}`}>
              {selectedCats.size === 0 && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <span className="cp-name">All</span>
          </div>
          <span className="cp-count">{channels.length}</span>
        </div>

        {/* Favourites */}
        <div className={`cp-item${selectedCats.has('__favs__') ? ' on' : ''}`} onClick={() => onToggleCat('__favs__')}>
          <div className="cp-item-left">
            <div className={`cp-check${selectedCats.has('__favs__') ? ' on' : ''}`}>
              {selectedCats.has('__favs__') && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <span className="cp-name">Favourites</span>
          </div>
          <span className="cp-count">{favCount}</span>
        </div>

        <div className="cp-divider" />

        {/* Categories */}
        {filteredCats.map(cat => {
          const isOn = selectedCats.has(cat);
          const subs = subcategories[cat] || [];
          const isExpanded = expandedCats.has(cat) || addingSubTo === cat;
          const count = getCatCount(cat);
          const isEditing = editingCat === cat;

          return (
            <div key={cat}>
              <div className={`cp-item${isOn ? ' on' : ''}`}>
                <div className="cp-item-left" onClick={() => !isEditing && onToggleCat(cat)}>
                  <div className={`cp-check${isOn ? ' on' : ''}`}>
                    {isOn && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  {isEditing ? (
                    <input
                      className="cp-rename-input"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(cat); if (e.key === 'Escape') setEditingCat(null); }}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="cp-name">{cat}</span>
                  )}
                </div>
                <div className="cp-item-right">
                  {isEditing ? (
                    <>
                      <button className="cp-action-btn cp-action-confirm" onClick={e => { e.stopPropagation(); handleRename(cat); }} title="Save">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="#00A651" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <button className="cp-action-btn" onClick={e => { e.stopPropagation(); setEditingCat(null); }} title="Cancel">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      </button>
                    </>
                  ) : (
                    <div className="cp-item-actions">
                      <button className="cp-action-btn" title="Add subcategory" onClick={e => { e.stopPropagation(); setAddingSubTo(cat); setExpandedCats(prev => new Set(prev).add(cat)); }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                      </button>
                      <button className="cp-action-btn" title="Edit" onClick={e => { e.stopPropagation(); setEditingCat(cat); setEditValue(cat); }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7 2.5l2.5 2.5M3 7l-1 3 3-1 5.5-5.5-2.5-2.5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                      <button className="cp-action-btn cp-action-del" title="Delete" onClick={e => { e.stopPropagation(); confirmDeleteCat(cat); }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2h3v1M3 3v7a1 1 0 001 1h4a1 1 0 001-1V3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  )}
                  {!isEditing && subs.length > 0 && (
                    <button className={`cp-chevron${isExpanded ? ' open' : ''}`} onClick={e => { e.stopPropagation(); toggleExpand(cat); }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  )}
                  {!isEditing && <span className="cp-count">{count}</span>}
                </div>
              </div>

              {/* Subcategories */}
              {isExpanded && (
                <>
                  {subs.map(sub => {
                    const isEditingSub = editingSub?.cat === cat && editingSub?.sub === sub;
                    return (
                      <div key={sub} className="cp-sub-item">
                        <div className="cp-sub-left">
                          <div className="cp-sub-dash" />
                          {isEditingSub ? (
                            <input
                              className="cp-sub-input"
                              value={editSubValue}
                              onChange={e => setEditSubValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRenameSub(sub); if (e.key === 'Escape') setEditingSub(null); }}
                              autoFocus
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <span className="cp-sub-name">{sub}</span>
                          )}
                        </div>
                        <div className="cp-sub-right">
                          {isEditingSub ? (
                            <>
                              <button className="cp-action-btn cp-action-confirm" onClick={() => handleRenameSub(sub)} title="Save">
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="#00A651" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </button>
                              <button className="cp-action-btn" onClick={() => setEditingSub(null)} title="Cancel">
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" /></svg>
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="cp-sub-actions">
                                <button className="cp-action-btn" title="Edit" onClick={e => { e.stopPropagation(); setEditingSub({ cat, sub }); setEditSubValue(sub); }}>
                                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7 2.5l2.5 2.5M3 7l-1 3 3-1 5.5-5.5-2.5-2.5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                                <button className="cp-action-btn cp-action-del" title="Delete" onClick={e => { e.stopPropagation(); confirmDeleteSub(sub, cat); }}>
                                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2h3v1M3 3v7a1 1 0 001 1h4a1 1 0 001-1V3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </button>
                              </div>
                              <span className="cp-sub-count">{getSubCount(cat, sub)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* Add new subcategory input */}
                  {addingSubTo === cat && (
                    <div className="cp-sub-item">
                      <div className="cp-sub-left">
                        <div className="cp-sub-dash" />
                        <input
                          className="cp-sub-input"
                          placeholder="Subcategory name..."
                          value={newSubValue}
                          onChange={e => setNewSubValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddSub(cat); if (e.key === 'Escape') { setAddingSubTo(null); setNewSubValue(''); } }}
                          autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="cp-action-btn cp-action-confirm" onClick={() => handleAddSub(cat)} title="Add">
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="#00A651" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        <button className="cp-action-btn" onClick={() => { setAddingSubTo(null); setNewSubValue(''); }} title="Cancel">
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="cp-foot">
        <button className="cp-add-btn">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 3v8M3 7h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>
          Add category
        </button>
      </div>

      {/* ── Delete category confirmation modal ── */}
      {deleteCatConfirm && (
        <div className="modal-overlay open" onClick={() => setDeleteCatConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Delete &ldquo;{deleteCatConfirm.name}&rdquo;?</h2>
            <p className="subtitle">
              {deleteCatConfirm.count} channel{deleteCatConfirm.count !== 1 ? 's are' : ' is'} assigned to this category.
              They&rsquo;ll be uncategorised until you reassign them.
            </p>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteCatConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={executeDeleteCat}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post-delete auto-sort prompt ── */}
      {postDeletePrompt && (
        <div className="modal-overlay open" onClick={() => setPostDeletePrompt(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Gone.</h2>
            <p className="subtitle">
              {postDeletePrompt.count} channel{postDeletePrompt.count !== 1 ? 's are' : ' is'} now homeless.
              Want me to auto-sort them?
            </p>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setPostDeletePrompt(null)}>Not now</button>
              <button className="btn-save" onClick={() => { setPostDeletePrompt(null); onAutoSort?.(); }}>Auto-sort</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete subcategory confirmation modal ── */}
      {deleteSubConfirm && (
        <div className="modal-overlay open" onClick={() => setDeleteSubConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Delete &ldquo;{deleteSubConfirm.name}&rdquo;?</h2>
            <p className="subtitle">
              {getSubCount(deleteSubConfirm.parentName, deleteSubConfirm.name)} channel{getSubCount(deleteSubConfirm.parentName, deleteSubConfirm.name) !== 1 ? 's' : ''} will move back to {deleteSubConfirm.parentName}.
            </p>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteSubConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={executeDeleteSub}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
