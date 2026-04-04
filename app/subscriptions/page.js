'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { showToast } from '../components/Toast';
import { autoCategoriseAll, persistAutoSort } from '../../lib/auto-categorise';
import EditChannelModal from '../components/EditChannelModal';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
import BulkEditModal from '../components/BulkEditModal';
import ChannelPanel from '../components/ChannelPanel';
import CategoryPanel from '../components/CategoryPanel';
import { trackEvent } from '../../lib/track';
import { useDragScroll } from '../../hooks/useDragScroll';

export default function Subscriptions2Page() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours, loading,
    chCats, chHasCat, chIsUncategorised, formatCount, toggleFavourite, getChannelState,
    dbCategories, reload,
  } = useChannelData();

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [selectedCatFilters, setSelectedCatFilters] = useState(new Set());
  const [showCatPanel, setShowCatPanel] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [chanView, setChanView] = useState('table');
  const [editingId, setEditingId] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState(new Set());
  const [sorting, setSorting] = useState(false);
  const [showSortConfirm, setShowSortConfirm] = useState(false);
  const [unmatchedChannels, setUnmatchedChannels] = useState([]);
  const [showManageCats, setShowManageCats] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const catTabsRef = useRef(null);
  const searchWrapRef = useRef(null);
  const columnsWrapRef = useRef(null);
  useDragScroll(catTabsRef);
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [colWidths, setColWidths] = useState({});
  const resizingCol = useRef(null);
  const toggleCol = (col) => setHiddenCols(prev => { const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); return next; });

  const onResizeStart = useCallback((e, col) => {
    e.preventDefault();
    e.stopPropagation();
    const th = e.target.closest('th');
    const startX = e.clientX;
    const startW = th.offsetWidth;
    resizingCol.current = col;
    const onMove = (ev) => {
      const delta = ev.clientX - startX;
      setColWidths(prev => ({ ...prev, [col]: Math.max(60, startW + delta) }));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      resizingCol.current = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // ── Filter + sort ──────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...channels];
    // Multi-select category filtering
    if (selectedCatFilters.size > 0) {
      result = result.filter(c => {
        for (const f of selectedCatFilters) {
          if (f === '__favs__' && c.favourited) return true;
          if (f === '__uncat__' && chIsUncategorised(c)) return true;
          if (f !== '__favs__' && f !== '__uncat__' && chHasCat(c, f)) return true;
        }
        return false;
      });
    } else if (activeCategory === '__favs__') {
      result = result.filter(c => c.favourited);
    } else if (activeCategory === '__uncat__') {
      result = result.filter(c => chIsUncategorised(c));
    } else if (activeCategory !== 'all') {
      result = result.filter(c => chHasCat(c, activeCategory));
    }
    if (activeSubcategory) result = result.filter(c => c.subcategory === activeSubcategory);
    if (search) { const q = search.toLowerCase(); result = result.filter(c => (c.name || '').toLowerCase().includes(q)); }
    if (filterStatus !== 'all') result = result.filter(c => getChannelState(c) === filterStatus);

    const dir = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = (a.name || '').localeCompare(b.name || ''); break;
        case 'subscribers': cmp = (a.subscriberCount || 0) - (b.subscriberCount || 0); break;
        case 'videoCount': cmp = (a.videoCount || 0) - (b.videoCount || 0); break;
        case 'subDate': cmp = (a.subscribedAt || '').localeCompare(b.subscribedAt || ''); break;
        case 'category': cmp = (chCats(a)[0] || '').localeCompare(chCats(b)[0] || ''); break;
        case 'subcategory': cmp = (a.subcategory || '').localeCompare(b.subcategory || ''); break;
        case 'favourited': cmp = (a.favourited ? 1 : 0) - (b.favourited ? 1 : 0); break;
        case 'status': {
          const order = { dead: 0, inactive: 1, active: 2 };
          cmp = (order[getChannelState(a)] || 0) - (order[getChannelState(b)] || 0);
          break;
        }
        default: cmp = 0;
      }
      return cmp * dir;
    });
    return result;
  }, [channels, activeCategory, activeSubcategory, selectedCatFilters, search, sortKey, sortDir, chCats, chHasCat, chIsUncategorised, filterStatus, getChannelState]);

  // ── Category panel toggle ──────────────────────────
  const handleToggleCat = useCallback((cat) => {
    if (cat === '__all__') {
      setSelectedCatFilters(new Set());
      setActiveCategory('all');
      setActiveSubcategory(null);
    } else if (cat === '__favs__') {
      setSelectedCatFilters(prev => {
        const next = new Set(prev);
        next.has('__favs__') ? next.delete('__favs__') : next.add('__favs__');
        return next;
      });
      setActiveCategory(prev => prev === '__favs__' ? 'all' : '__favs__');
    } else if (cat === '__uncat__') {
      setSelectedCatFilters(prev => {
        const next = new Set(prev);
        next.has('__uncat__') ? next.delete('__uncat__') : next.add('__uncat__');
        return next;
      });
      setActiveCategory(prev => prev === '__uncat__' ? 'all' : '__uncat__');
      setActiveSubcategory(null);
    } else {
      setSelectedCatFilters(prev => {
        const next = new Set(prev);
        next.has(cat) ? next.delete(cat) : next.add(cat);
        return next;
      });
    }
  }, []);

  // ── Sort column click ──────────────────────────────
  const handleColumnSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Bulk select ────────────────────────────────────
  const toggleChannelSelect = useCallback((id) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (next.size === 0) setBulkMode(false);
      return next;
    });
    if (!bulkMode) setBulkMode(true);
  }, [bulkMode]);

  // ── Auto-sort ──────────────────────────────────────
  const handleAutoSort = useCallback(async () => {
    if (!user || sorting) return;
    setSorting(true);
    setShowSortConfirm(false);
    try {
      const { assignments, assigned, unmatched } = autoCategoriseAll(channels, chIsUncategorised);
      if (!assigned && !unmatched.length) { showToast('No unsorted channels to sort'); setSorting(false); return; }

      if (assigned > 0) {
        await persistAutoSort(supabase, user, assignments, dbCategories);
        await reload();
        showToast(`Sorted ${assigned} channel${assigned !== 1 ? 's' : ''}`);
      }

      if (unmatched.length > 0) {
        setUnmatchedChannels(unmatched);
      }
    } catch (e) { console.error('Auto-sort failed:', e); showToast(`Auto-sort failed: ${e.message}`); }
    finally { setSorting(false); }
  }, [user, channels, sorting, reload, dbCategories, chIsUncategorised]);

  // ── Subcats for active category ────────────────────
  const activeSubs = activeCategory !== 'all' && activeCategory !== '__favs__' && activeCategory !== '__uncat__'
    ? (subcategories[activeCategory] || []) : [];

  // ── Date formatter ─────────────────────────────────
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

  // ── Click outside to close search & columns ────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showSearch && searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        if (!search) {
          setShowSearch(false);
        }
      }
      if (showColumnsMenu && columnsWrapRef.current && !columnsWrapRef.current.contains(e.target)) {
        setShowColumnsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearch, showColumnsMenu, search]);

  // ── Keyboard navigation ───────────────────────────
  useEffect(() => {
    if (!editingId) return;
    const handleKey = (e) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'Escape') return;
      e.preventDefault();
      if (e.key === 'Escape') { setEditingId(null); return; }
      const idx = filtered.findIndex(c => c.id === editingId);
      if (idx === -1) return;
      const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      if (next >= 0 && next < filtered.length) {
        setEditingId(filtered[next].id);
        // Scroll the row into view
        const row = document.querySelector(`tr[data-id="${filtered[next].id}"]`);
        row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editingId, filtered]);

  // ── Loading / auth ─────────────────────────────────
  if (loading) return <div className="home-feed-loading"><span className="spinner" /> Loading...</div>;

  if (!user) {
    return (
      <>
        <div className="s2-topbar"><div className="s2-topbar-row"><div className="s2-topbar-left"><span className="f2-title">Subscriptions</span></div></div></div>
        <div className="home-feed-empty"><p className="home-feed-empty-text">Sign in to manage your subscriptions.</p><button className="btn-accent" onClick={signIn}>Sign in with Google</button></div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
    {/* Category panel — expanded or collapsed strip */}
    {showCatPanel ? (
      <CategoryPanel
        selectedCats={selectedCatFilters}
        onToggleCat={handleToggleCat}
        onClose={() => setShowCatPanel(false)}
        onAutoSort={handleAutoSort}
        activeSub={activeSubcategory}
        onToggleSub={(sub) => setActiveSubcategory(prev => prev === sub ? null : sub)}
      />
    ) : (
      <div className="cp-collapsed" onClick={() => setShowCatPanel(true)}>
        <div className="cp-collapsed-header">
          <button className="cp-expand-btn">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <span className="cp-collapsed-label">Categories</span>
        {selectedCatFilters.size > 0 && (
          <span className="cp-collapsed-badge">{selectedCatFilters.size}</span>
        )}
      </div>
    )}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      {/* PAGE HEADER */}
      <div className="s2-topbar">
        <div className="s2-topbar-row">
          <div className="s2-topbar-left">
            <span className="page-title" style={{ fontSize: 21, fontWeight: 500, letterSpacing: '-.3px' }}>Subscriptions <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--text-muted)', marginLeft: 8 }}>{filtered.length} of {channels.length} channels</span></span>
          </div>
        </div>
      </div>

      {/* INSIGHTS ROW */}
      <div className="s2-insights">
        <div className="s2-insight">
          <div className="s2-insight-header" style={{ background: 'var(--accent-soft)' }}>
            <div>
              <div className="s2-insight-stat" style={{ color: 'var(--accent)' }}>{channels.filter(c => chIsUncategorised(c)).length}</div>
              <div className="s2-insight-label" style={{ color: 'var(--accent-text)' }}>unsorted</div>
            </div>
            <div className="s2-insight-icon" style={{ background: 'var(--accent)' }}>
              <svg viewBox="0 0 14 14"><path d="M2 4h10M4 7h6M6 10h2" /></svg>
            </div>
          </div>
          <div className="s2-insight-body">
            <div className="s2-insight-quote">"{channels.filter(c => chIsUncategorised(c)).length} channels with no category. That's a messy drawer. Let me sort it."</div>
            <div className="s2-insight-actions">
              <button className="s2-insight-cta" style={{ background: 'var(--accent)' }} onClick={() => setShowSortConfirm(true)} disabled={sorting}>
                {sorting ? 'Sorting...' : 'Auto-sort'}
                <svg viewBox="0 0 14 14"><path d="M5 3l4.5 4-4.5 4" /></svg>
              </button>
              <span className="s2-insight-link" onClick={() => handleToggleCat('__uncat__')}>view unsorted channels &rsaquo;</span>
            </div>
          </div>
        </div>

        <div className="s2-insight">
          <div className="s2-insight-header" style={{ background: 'var(--orange-soft)' }}>
            <div>
              <div className="s2-insight-stat" style={{ color: 'var(--orange)' }}>{channels.filter(c => { const d = c.subscribedAt; return d && (Date.now() - new Date(d).getTime()) > 7 * 365 * 24 * 60 * 60 * 1000; }).length}</div>
              <div className="s2-insight-label" style={{ color: 'var(--orange-text)' }}>7+ year subs</div>
            </div>
            <div className="s2-insight-icon" style={{ background: 'var(--orange)' }}>
              <svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" /><path d="M7 4.5v3l2 1.5" /></svg>
            </div>
          </div>
          <div className="s2-insight-body">
            <div className="s2-insight-quote">"Long-term loyalty. But maybe it's time to check if you still watch them?"</div>
            <button className="s2-insight-cta" style={{ background: 'var(--orange)' }} onClick={() => { setSortKey('subDate'); setSortDir('asc'); }}>
              Review
              <svg viewBox="0 0 14 14"><path d="M5 3l4.5 4-4.5 4" /></svg>
            </button>
          </div>
        </div>

        <div className="s2-insight">
          <div className="s2-insight-header" style={{ background: 'var(--iris-soft)' }}>
            <div>
              <div className="s2-insight-stat" style={{ color: 'var(--iris)' }}>{channels.filter(c => c.favourited).length}</div>
              <div className="s2-insight-label" style={{ color: 'var(--iris-text)' }}>favourites</div>
            </div>
            <div className="s2-insight-icon" style={{ background: 'var(--iris)' }}>
              <svg viewBox="0 0 14 14"><path d="M7 1.5l1.5 3 3.5.4-2.5 2.5.5 3.3L7 9.2l-3 1.5.5-3.3L2 5l3.5-.5z" fill="#fff" stroke="none" /></svg>
            </div>
          </div>
          <div className="s2-insight-body">
            <div className="s2-insight-quote">"Found channels similar to your favourites. Worth a look?"</div>
            <button className="s2-insight-cta" style={{ background: 'var(--iris)' }} onClick={() => { setActiveCategory('__favs__'); setActiveSubcategory(null); }}>
              Discover
              <svg viewBox="0 0 14 14"><path d="M5 3l4.5 4-4.5 4" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="s2-content">
        {/* CONTROL ROW */}
        <div className="s2-ctrl-row">
          <div className="s2-ctrl-left">
            {selectedCatFilters.size > 0 && (
              <>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Showing:</span>
                {[...selectedCatFilters].map(f => (
                  <span key={f} className="s2-filter-tag">
                    {f === '__favs__' ? 'Favourites' : f === '__uncat__' ? 'Unsorted' : f}
                    <span className="s2-filter-tag-x" onClick={() => handleToggleCat(f)}>&times;</span>
                  </span>
                ))}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 4 }} onClick={() => { setSelectedCatFilters(new Set()); setActiveCategory('all'); setActiveSubcategory(null); }}>Clear all</span>
              </>
            )}
          </div>
          <div className="s2-ctrl-right">
            <div ref={searchWrapRef} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="s2-ctrl-icon" onClick={() => { if (showSearch && !search) { setShowSearch(false); } else { setShowSearch(true); } }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="#999" strokeWidth="1.3" /><path d="M10.5 10.5l3 3" stroke="#999" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </button>
              {showSearch && (
                <>
                  <input className="s2-search-pill" type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} autoFocus style={{ width: 140 }} />
                  {search && (
                    <button className="s2-ctrl-icon" onClick={() => setSearch('')} style={{ marginLeft: -4 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="#999" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    </button>
                  )}
                </>
              )}
            </div>
            <button className="s2-sort-pill" onClick={() => setFilterStatus(filterStatus === 'all' ? 'active' : filterStatus === 'active' ? 'inactive' : filterStatus === 'inactive' ? 'dead' : 'all')}>
              Status: {filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
            </button>
            <button className="s2-sort-pill" onClick={() => {
              const keys = ['name', 'subscribers', 'videoCount', 'subDate', 'category'];
              const idx = keys.indexOf(sortKey);
              setSortKey(keys[(idx + 1) % keys.length]);
              setSortDir('asc');
            }}>
              <svg viewBox="0 0 12 12" width="11" height="11"><path d="M2 3h8M3 6h6M4 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              Sort: {({ name: 'Name', subscribers: 'Subs', videoCount: 'Videos', subDate: 'Subscribed', category: 'Category' })[sortKey] || 'Name'}
            </button>
            <div style={{ position: 'relative' }} ref={columnsWrapRef}>
              <button className="s2-sort-pill" onClick={() => setShowColumnsMenu(v => !v)}>
                <svg viewBox="0 0 12 12" width="11" height="11"><rect x="1" y="1" width="4" height="10" rx="1" stroke="currentColor" fill="none" strokeWidth="1.1" /><rect x="7" y="1" width="4" height="10" rx="1" stroke="currentColor" fill="none" strokeWidth="1.1" /></svg>
                Columns
              </button>
              {showColumnsMenu && (
                <div className="s2-columns-dropdown">
                  {[
                    { key: 'category', label: 'Category' },
                    { key: 'subcategory', label: 'Subcategory' },
                    { key: 'subscribers', label: 'Subscribers' },
                    { key: 'videoCount', label: 'Videos' },
                    { key: 'subDate', label: 'Subscribed' },
                    { key: 'status', label: 'Status' },
                  ].map(col => (
                    <label key={col.key} className="s2-columns-item">
                      <input type="checkbox" checked={!hiddenCols.has(col.key)} onChange={() => setHiddenCols(prev => { const next = new Set(prev); next.has(col.key) ? next.delete(col.key) : next.add(col.key); return next; })} />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedChannels.size > 0 && (
              <button className="s2-insight-cta" style={{ background: 'var(--accent)', fontSize: 12 }} onClick={() => setShowBulkEdit(true)}>
                Edit {selectedChannels.size}
              </button>
            )}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="h2-empty-state" style={{ margin: '40px' }}>
            <span className="h2-empty-emoji">🤷</span>
            <span className="h2-empty-text">No channels match your filters</span>
          </div>
        ) : null}

        {/* TABLE VIEW */}
        {chanView === 'table' && filtered.length > 0 && (
          <table className="s2-tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <div className={`h2-task-check${selectedChannels.size === filtered.length && filtered.length > 0 ? ' checked' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (selectedChannels.size === filtered.length) {
                        setSelectedChannels(new Set());
                      } else {
                        setSelectedChannels(new Set(filtered.map(c => c.id)));
                        if (!bulkMode) setBulkMode(true);
                      }
                    }}>
                    {selectedChannels.size === filtered.length && filtered.length > 0 && '✓'}
                  </div>
                </th>
                <th style={{ width: 30, textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ opacity: 0.5 }}>
                      <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" />
                    </svg>
                  </span>
                </th>
                <th className="s2-sortable" style={colWidths.name ? { width: colWidths.name } : {}} onClick={() => handleColumnSort('name')}>
                  Name {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                  <span className="s2-col-resizer" onMouseDown={e => onResizeStart(e, 'name')} />
                </th>
                {!hiddenCols.has('category') && <th className="s2-sortable" style={colWidths.category ? { width: colWidths.category } : {}}>
                  <span onClick={() => handleColumnSort('category')}>Category {sortKey === 'category' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('category'); }} title="Hide column">✕</button>
                  <span className="s2-col-resizer" onMouseDown={e => onResizeStart(e, 'category')} />
                </th>}
                {!hiddenCols.has('subcategory') && <th className="s2-sortable" style={colWidths.subcategory ? { width: colWidths.subcategory } : {}}>
                  <span onClick={() => handleColumnSort('subcategory')}>Subcategory {sortKey === 'subcategory' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('subcategory'); }} title="Hide column">✕</button>
                  <span className="s2-col-resizer" onMouseDown={e => onResizeStart(e, 'subcategory')} />
                </th>}
                {!hiddenCols.has('subscribers') && <th className="s2-sortable" style={colWidths.subscribers ? { width: colWidths.subscribers } : {}}>
                  <span onClick={() => handleColumnSort('subscribers')}>Subs {sortKey === 'subscribers' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('subscribers'); }} title="Hide column">✕</button>
                  <span className="s2-col-resizer" onMouseDown={e => onResizeStart(e, 'subscribers')} />
                </th>}
                {!hiddenCols.has('videoCount') && <th className="s2-sortable" style={colWidths.videoCount ? { width: colWidths.videoCount } : {}}>
                  <span onClick={() => handleColumnSort('videoCount')}>Videos {sortKey === 'videoCount' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('videoCount'); }} title="Hide column">✕</button>
                  <span className="s2-col-resizer" onMouseDown={e => onResizeStart(e, 'videoCount')} />
                </th>}
                {!hiddenCols.has('subDate') && <th className="s2-sortable" style={colWidths.subDate ? { width: colWidths.subDate } : {}}>
                  <span onClick={() => handleColumnSort('subDate')}>Subscribed {sortKey === 'subDate' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('subDate'); }} title="Hide column">✕</button>
                  <span className="s2-col-resizer" onMouseDown={e => onResizeStart(e, 'subDate')} />
                </th>}
                {!hiddenCols.has('status') && <th className="s2-sortable" style={colWidths.status ? { width: colWidths.status } : {}} onClick={() => handleColumnSort('status')}>
                  Status {sortKey === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('status'); }} title="Hide column">✕</button>
                  <span className="s2-col-resizer" onMouseDown={e => onResizeStart(e, 'status')} />
                </th>}
                {hiddenCols.size > 0 && <th style={{ width: 30 }}>
                  <button className="s2-col-restore" onClick={() => setHiddenCols(new Set())} title="Show all columns">+</button>
                </th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ch => {
                const cats = chCats(ch);
                const col = categoryColours[cats[0]] || 'var(--accent)';
                const initials = (ch.name || '?').substring(0, 2).toUpperCase();
                const state = getChannelState(ch);
                const isSelected = selectedChannels.has(ch.id);
                return (
                  <tr key={ch.id} data-id={ch.id} className={`${isSelected ? 's2-row-selected' : ''}${editingId === ch.id ? ' selected' : ''}`} onClick={() => bulkMode ? toggleChannelSelect(ch.id) : setEditingId(ch.id)}>
                    <td><div className={`h2-task-check${isSelected ? ' checked' : ''}`} onClick={e => { e.stopPropagation(); toggleChannelSelect(ch.id); }}>{isSelected && '✓'}</div></td>
                    <td><button className={`ch-table-fav${ch.favourited ? ' starred' : ''}`} onClick={e => { e.stopPropagation(); toggleFavourite(ch.id); }}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" /></svg></button></td>
                    <td><div className="s2-ch-name"><div className="s2-ch-avatar" style={{ background: `${col}33` }}>{ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : initials}</div>{ch.name}</div></td>
                    {!hiddenCols.has('category') && <td>{cats[0] ? <span className="s2-cat-pill">{cats[0]}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>}
                    {!hiddenCols.has('subcategory') && <td>{ch.subcategory || <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>}
                    {!hiddenCols.has('subscribers') && <td className="s2-num">{formatCount(ch.subscriberCount)}</td>}
                    {!hiddenCols.has('videoCount') && <td className="s2-num">{ch.videoCount?.toLocaleString() || '—'}</td>}
                    {!hiddenCols.has('subDate') && <td className="s2-num">{fmtDate(ch.subscribedAt)}</td>}
                    {!hiddenCols.has('status') && <td><span className={`s2-status ${state}`}>{state === 'dead' ? 'Dead' : state === 'inactive' ? 'Inactive' : 'Active'}</span></td>}
                    {hiddenCols.size > 0 && <td></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* GRID VIEW */}
        {chanView === 'grid' && filtered.length > 0 && (
          <div className="s2-grid">
            {filtered.map((ch, i) => {
              const cats = chCats(ch);
              const col = categoryColours[cats[0]] || 'var(--accent)';
              const initials = (ch.name || '?').substring(0, 2).toUpperCase();
              return (
                <div key={ch.id} className="s2-grid-card" style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}
                  onClick={() => setEditingId(ch.id)}>
                  <div className="s2-grid-banner" style={{ background: `linear-gradient(135deg,${col},${col}44)` }} />
                  <div className="s2-grid-avatar" style={{ background: `${col}33` }}>
                    {ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : initials}
                  </div>
                  <span className={`s2-grid-fav${ch.favourited ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleFavourite(ch.id); }}>★</span>
                  <div className="s2-grid-body">
                    <div className="s2-grid-name">{ch.name}</div>
                    <div className="s2-grid-cat"><span className="s2-ct-dot" style={{ background: col }} />{cats[0] || 'Uncategorised'}</div>
                    <div className="s2-grid-stats">
                      <div><span className="s2-grid-val">{formatCount(ch.subscriberCount)}</span> subs</div>
                      <div><span className="s2-grid-val">{ch.videoCount?.toLocaleString() || '0'}</span> videos</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit channel modal (kept for manage categories) */}
      {showManageCats && <ManageCategoriesModal onClose={() => setShowManageCats(false)} />}
      {showBulkEdit && (
        <BulkEditModal
          selectedIds={selectedChannels}
          channels={channels}
          onClose={() => setShowBulkEdit(false)}
          onSaved={async () => { await reload(); setBulkMode(false); setSelectedChannels(new Set()); }}
        />
      )}

      {/* Auto-sort confirm */}
      {showSortConfirm && (
        <div className="f2-player-overlay" onClick={() => setShowSortConfirm(false)}>
          <div className="h2-panel" style={{ maxWidth: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Auto-sort channels?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 16, lineHeight: 1.5 }}>
              This will automatically categorise your {channels.filter(c => chIsUncategorised(c)).length} unsorted channels.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="s2-btn-ghost" onClick={() => setShowSortConfirm(false)}>Cancel</button>
              <button className="s2-btn-primary" onClick={handleAutoSort}>Sort now</button>
            </div>
          </div>
        </div>
      )}

      {/* Unmatched channels modal */}
      {unmatchedChannels.length > 0 && (
        <div className="modal-overlay open" onClick={() => setUnmatchedChannels([])}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2>{unmatchedChannels.length} channel{unmatchedChannels.length !== 1 ? 's' : ''} couldn&rsquo;t be sorted</h2>
            <p className="subtitle">These channels don&rsquo;t have enough data to suggest a category. You can assign them manually or leave them unsorted.</p>
            <div style={{ maxHeight: 360, overflowY: 'auto', margin: '16px 0' }}>
              {unmatchedChannels.map(ch => (
                <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, flexShrink: 0, overflow: 'hidden' }}>
                    {ch.thumbnail ? <img src={ch.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (ch.name || '??').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</div>
                  </div>
                  <select
                    style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--border-subtle)', fontSize: 12, fontFamily: 'var(--font-body)', background: 'var(--bg-primary)', cursor: 'pointer' }}
                    defaultValue=""
                    onChange={async (e) => {
                      const catName = e.target.value;
                      if (!catName) return;
                      const cat = dbCategories.find(c => c.name === catName);
                      if (cat) {
                        await supabase.from('channel_categories').upsert(
                          { channel_id: ch.id, category_id: cat.id, user_id: user.id },
                          { onConflict: 'channel_id,category_id', ignoreDuplicates: true }
                        );
                        setUnmatchedChannels(prev => prev.filter(c => c.id !== ch.id));
                        reload();
                        showToast(`${ch.name} → ${catName}`);
                      }
                    }}
                  >
                    <option value="">Assign category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setUnmatchedChannels([])}>Leave unsorted</button>
            </div>
          </div>
        </div>
      )}
    </div>
    {/* Channel slide panel */}
    {editingId && <ChannelPanel channelId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  );
}
