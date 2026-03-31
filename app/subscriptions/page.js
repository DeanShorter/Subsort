'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { autoCategoriseAll } from '../../lib/auto-categorise';
import EditChannelModal from '../components/EditChannelModal';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
import BulkEditModal from '../components/BulkEditModal';
import ChannelPanel from '../components/ChannelPanel';
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
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [chanView, setChanView] = useState('table');
  const [editingId, setEditingId] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState(new Set());
  const [sorting, setSorting] = useState(false);
  const [showSortConfirm, setShowSortConfirm] = useState(false);
  const [showManageCats, setShowManageCats] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const catTabsRef = useRef(null);
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
    if (activeCategory === '__favs__') result = result.filter(c => c.favourited);
    else if (activeCategory === '__uncat__') result = result.filter(c => chIsUncategorised(c));
    else if (activeCategory !== 'all') result = result.filter(c => chHasCat(c, activeCategory));
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
  }, [channels, activeCategory, activeSubcategory, search, sortKey, sortDir, chCats, chHasCat, chIsUncategorised, filterStatus, getChannelState]);

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
      await autoCategoriseAll(channels, reload, dbCategories);
    } catch (e) { console.error('Auto-sort failed:', e); }
    finally { setSorting(false); }
  }, [user, channels, sorting, reload, dbCategories]);

  // ── Subcats for active category ────────────────────
  const activeSubs = activeCategory !== 'all' && activeCategory !== '__favs__' && activeCategory !== '__uncat__'
    ? (subcategories[activeCategory] || []) : [];

  // ── Date formatter ─────────────────────────────────
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
      {/* PAGE HEADER */}
      <div className="s2-topbar">
        <div className="s2-topbar-row">
          <div className="s2-topbar-left">
            <span className="page-title" style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-.3px' }}>Subscriptions <span style={{ fontWeight: 400, fontSize: 15, color: 'var(--text-muted)', marginLeft: 8 }}>{filtered.length} channels</span></span>
          </div>
          <div className="f2-header-right">
            <input className="s2-search-pill" type="text" placeholder="Search channels..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="s2-icon-btn" title="Grid view" onClick={() => setChanView('grid')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="6" height="5" rx="1" stroke={chanView === 'grid' ? 'var(--accent)' : '#999'} strokeWidth="1.2" /><rect x="9" y="2" width="6" height="5" rx="1" stroke={chanView === 'grid' ? 'var(--accent)' : '#999'} strokeWidth="1.2" /><rect x="1" y="9" width="6" height="5" rx="1" stroke={chanView === 'grid' ? 'var(--accent)' : '#999'} strokeWidth="1.2" /><rect x="9" y="9" width="6" height="5" rx="1" stroke={chanView === 'grid' ? 'var(--accent)' : '#999'} strokeWidth="1.2" /></svg>
            </button>
            <button className="s2-icon-btn" title="Table view" onClick={() => setChanView('table')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke={chanView === 'table' ? 'var(--accent)' : '#999'} strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* INSIGHTS ROW */}
      <div className="s2-insights">
        <div className="s2-insight">
          <div className="s2-insight-header" style={{ background: 'var(--accent-soft)' }}>
            <div>
              <div className="s2-insight-stat" style={{ color: 'var(--accent)' }}>{channels.filter(c => chIsUncategorised(c)).length}</div>
              <div className="s2-insight-label" style={{ color: 'var(--accent-text)' }}>uncategorised</div>
            </div>
            <div className="s2-insight-icon" style={{ background: 'var(--accent)' }}>
              <svg viewBox="0 0 14 14"><path d="M2 4h10M4 7h6M6 10h2" /></svg>
            </div>
          </div>
          <div className="s2-insight-body">
            <div className="s2-insight-quote">"{channels.filter(c => chIsUncategorised(c)).length} channels with no category. That's a messy drawer. Let me sort it."</div>
            <button className="s2-insight-cta" style={{ background: 'var(--accent)' }} onClick={() => setShowSortConfirm(true)} disabled={sorting}>
              {sorting ? 'Sorting...' : 'Auto-sort'}
              <svg viewBox="0 0 14 14"><path d="M5 3l4.5 4-4.5 4" /></svg>
            </button>
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
        {/* CATEGORY BAR */}
        <div className="s2-cat-bar">
          <div className="s2-cat-tabs" ref={catTabsRef} style={{ gap: 6 }}>
            <button className={`s2-cat-tab${activeCategory === 'all' ? ' active' : ''}`} onClick={() => { setActiveCategory('all'); setActiveSubcategory(null); }}>
              All <span className="s2-ct-count">{channels.length}</span>
            </button>
            <button className={`s2-cat-tab${activeCategory === '__favs__' ? ' active' : ''}`} onClick={() => { setActiveCategory('__favs__'); setActiveSubcategory(null); }}>
              Favourites <span className="s2-ct-count">{channels.filter(c => c.favourited).length}</span>
            </button>
            {categories.map(cat => (
              <button key={cat} className={`s2-cat-tab${activeCategory === cat ? ' active' : ''}`}
                onClick={() => { setActiveCategory(prev => prev === cat ? 'all' : cat); setActiveSubcategory(null); }}>
                {cat} <span className="s2-ct-count">{channels.filter(c => chHasCat(c, cat)).length}</span>
              </button>
            ))}
          </div>
          <div className="s2-cat-bar-right">
            <div className="s2-filter-pills">
              {['all', 'active', 'inactive', 'dead'].map(s => (
                <button key={s} className={`s2-fpill${filterStatus === s ? ' active' : ' inactive'}`}
                  onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <button className="s2-sort-pill" onClick={() => {
              const keys = ['name', 'subscribers', 'videoCount', 'subDate', 'category'];
              const idx = keys.indexOf(sortKey);
              setSortKey(keys[(idx + 1) % keys.length]);
              setSortDir('asc');
            }}>
              <svg viewBox="0 0 12 12"><path d="M2 3h8M3 6h6M4 9h4" /></svg>
              {({ name: 'Name', subscribers: 'Subs', videoCount: 'Videos', subDate: 'Subscribed', category: 'Category' })[sortKey] || 'Name'}
            </button>
            <div style={{ position: 'relative' }}>
              <button className="s2-sort-pill" onClick={() => setShowColumnsMenu(v => !v)}>
                <svg viewBox="0 0 12 12"><rect x="1" y="1" width="4" height="10" rx="1" stroke="currentColor" fill="none" strokeWidth="1.1" /><rect x="7" y="1" width="4" height="10" rx="1" stroke="currentColor" fill="none" strokeWidth="1.1" /></svg>
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
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(col.key)}
                        onChange={() => setHiddenCols(prev => {
                          const next = new Set(prev);
                          next.has(col.key) ? next.delete(col.key) : next.add(col.key);
                          return next;
                        })}
                      />
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
          <div className="h2-empty-state" style={{ margin: '40px 0' }}>
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
                  <tr key={ch.id} className={isSelected ? 's2-row-selected' : ''} onClick={() => bulkMode ? toggleChannelSelect(ch.id) : setEditingId(ch.id)}>
                    <td><div className={`h2-task-check${isSelected ? ' checked' : ''}`} onClick={e => { e.stopPropagation(); toggleChannelSelect(ch.id); }}>{isSelected && '✓'}</div></td>
                    <td><button className={`ch-table-fav${ch.favourited ? ' starred' : ''}`} onClick={e => { e.stopPropagation(); toggleFavourite(ch.id); }}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" /></svg></button></td>
                    <td><div className="s2-ch-name"><div className="s2-ch-avatar" style={{ background: `${col}33` }}>{ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : initials}</div>{ch.name}</div></td>
                    {!hiddenCols.has('category') && <td><div className="s2-ch-cat"><span className="s2-ct-dot" style={{ background: col }} />{cats[0] || '—'}</div></td>}
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
              This will automatically categorise your {channels.filter(c => chIsUncategorised(c)).length} uncategorised channels using AI.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="s2-btn-ghost" onClick={() => setShowSortConfirm(false)}>Cancel</button>
              <button className="s2-btn-primary" onClick={handleAutoSort}>Sort now</button>
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
