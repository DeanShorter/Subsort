'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { autoCategoriseAll } from '../../lib/auto-categorise';
import EditChannelModal from '../components/EditChannelModal';
import ManageCategoriesModal from '../components/ManageCategoriesModal';
import { trackEvent } from '../../lib/track';

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
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const toggleCol = (col) => setHiddenCols(prev => { const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); return next; });

  // ── Filter + sort ──────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...channels];
    if (activeCategory === '__favs__') result = result.filter(c => c.favourited);
    else if (activeCategory === '__uncat__') result = result.filter(c => chIsUncategorised(c));
    else if (activeCategory !== 'all') result = result.filter(c => chHasCat(c, activeCategory));
    if (activeSubcategory) result = result.filter(c => c.subcategory === activeSubcategory);
    if (search) { const q = search.toLowerCase(); result = result.filter(c => (c.name || '').toLowerCase().includes(q)); }

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
        default: cmp = 0;
      }
      return cmp * dir;
    });
    return result;
  }, [channels, activeCategory, activeSubcategory, search, sortKey, sortDir, chCats, chHasCat, chIsUncategorised]);

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
    <>
      {/* TOPBAR */}
      <div className="s2-topbar">
        <div className="s2-topbar-row">
          <div className="s2-topbar-left">
            <span className="f2-title">Subscriptions</span>
            <span className="ph-count">{filtered.length} channels</span>
          </div>
          <div className="s2-topbar-right">
            <button className="s2-btn-ghost" onClick={() => window.__subsortScrollToCats?.()}>
              <svg viewBox="0 0 14 14"><path d="M2 4h10M4 7h6M6 10h2" /></svg>
              Filters
            </button>
            <div className="ph-view-toggles">
              <button className={`ph-view-btn${chanView === 'compact' ? ' active' : ''}`} title="Compact" onClick={() => setChanView('compact')}>
                <svg viewBox="0 0 14 14"><path d="M1 3h12M1 7h12M1 11h12" /></svg>
              </button>
              <button className={`ph-view-btn${chanView === 'table' ? ' active' : ''}`} title="Table" onClick={() => setChanView('table')}>
                <svg viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="3" rx="0.5" /><rect x="1" y="6" width="12" height="3" rx="0.5" /><rect x="1" y="11" width="12" height="3" rx="0.5" /></svg>
              </button>
              <button className={`ph-view-btn${chanView === 'grid' ? ' active' : ''}`} title="Grid" onClick={() => setChanView('grid')}>
                <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>
              </button>
            </div>
            <button className="s2-btn-ghost" onClick={() => setBulkMode(b => !b)}>
              <svg viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2" /><path d="M5 7h4" /></svg>
              Bulk Edit
            </button>
            <button className="s2-btn-primary" onClick={() => setShowSortConfirm(true)} disabled={sorting}>
              <svg viewBox="0 0 14 14"><path d="M2 4h10M4 7h6M5 10h4" /></svg>
              {sorting ? 'Sorting...' : 'Auto-sort'}
            </button>
            <div className="ph-search-wrap">
              <svg viewBox="0 0 14 14"><circle cx="6" cy="6" r="4.5" fill="none" /><path d="M9.5 9.5L13 13" /></svg>
              <input className="ph-search" type="text" placeholder="Search channels..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Category tabs + manage button */}
        <div className="s2-cat-row-wrap">
          <div className="s2-cat-tabs">
            <button className={`s2-cat-tab${activeCategory === 'all' ? ' active' : ''}`} onClick={() => { setActiveCategory('all'); setActiveSubcategory(null); }}>
              <span className="s2-ct-dot" style={{ background: 'var(--accent)' }} />All<span className="s2-ct-count">{channels.length}</span>
            </button>
            <button className={`s2-cat-tab${activeCategory === '__favs__' ? ' active' : ''}`} onClick={() => { setActiveCategory('__favs__'); setActiveSubcategory(null); }}>
              <span style={{ fontSize: 10, color: '#EFD700' }}>★</span>Favourites<span className="s2-ct-count">{channels.filter(c => c.favourited).length}</span>
            </button>
            {categories.map(cat => (
              <button key={cat} className={`s2-cat-tab${activeCategory === cat ? ' active' : ''}`}
                onClick={() => { setActiveCategory(prev => prev === cat ? 'all' : cat); setActiveSubcategory(null); }}>
                <span className="s2-ct-dot" style={{ background: categoryColours[cat] || 'var(--accent)' }} />
                {cat}<span className="s2-ct-count">{channels.filter(c => chHasCat(c, cat)).length}</span>
              </button>
            ))}
          </div>
          <button className="s2-cat-manage" onClick={() => setShowManageCats(true)}>
            <svg viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" /></svg>
            Manage Categories
          </button>
        </div>

        {/* Subcategory tabs */}
        {activeSubs.length > 0 && (
          <div className="s2-subcat-tabs">
            <button className={`s2-subcat-tab${!activeSubcategory ? ' active' : ''}`} onClick={() => setActiveSubcategory(null)}>
              All {activeCategory}
            </button>
            {activeSubs.map(sub => (
              <button key={sub} className={`s2-subcat-tab${activeSubcategory === sub ? ' active' : ''}`}
                onClick={() => setActiveSubcategory(prev => prev === sub ? null : sub)}>
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="s2-content">
        {/* TABLE VIEW */}
        {chanView === 'table' && (
          <table className="s2-tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th style={{ width: 30 }}>Fav</th>
                <th className="s2-sortable" onClick={() => handleColumnSort('name')}>
                  Name {sortKey === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                {!hiddenCols.has('category') && <th className="s2-sortable">
                  <span onClick={() => handleColumnSort('category')}>Category {sortKey === 'category' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('category'); }} title="Hide column">✕</button>
                </th>}
                {!hiddenCols.has('subcategory') && <th className="s2-sortable">
                  <span onClick={() => handleColumnSort('subcategory')}>Subcategory {sortKey === 'subcategory' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('subcategory'); }} title="Hide column">✕</button>
                </th>}
                {!hiddenCols.has('subscribers') && <th className="s2-sortable">
                  <span onClick={() => handleColumnSort('subscribers')}>Subs {sortKey === 'subscribers' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('subscribers'); }} title="Hide column">✕</button>
                </th>}
                {!hiddenCols.has('videoCount') && <th className="s2-sortable">
                  <span onClick={() => handleColumnSort('videoCount')}>Videos {sortKey === 'videoCount' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('videoCount'); }} title="Hide column">✕</button>
                </th>}
                {!hiddenCols.has('subDate') && <th className="s2-sortable">
                  <span onClick={() => handleColumnSort('subDate')}>Subscribed {sortKey === 'subDate' && (sortDir === 'asc' ? '▲' : '▼')}</span>
                  <button className="s2-col-toggle" onClick={e => { e.stopPropagation(); toggleCol('subDate'); }} title="Hide column">✕</button>
                </th>}
                {!hiddenCols.has('status') && <th>
                  Status
                  <button className="s2-col-toggle" onClick={() => toggleCol('status')} title="Hide column">✕</button>
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
                    <td><input type="checkbox" checked={isSelected} onChange={() => toggleChannelSelect(ch.id)} onClick={e => e.stopPropagation()} /></td>
                    <td><span className={`s2-fav${ch.favourited ? ' active' : ''}`} onClick={e => { e.stopPropagation(); toggleFavourite(ch.id); }}>★</span></td>
                    <td><div className="s2-ch-name"><div className="s2-ch-avatar" style={{ background: `${col}33` }}>{ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : initials}</div>{ch.name}</div></td>
                    {!hiddenCols.has('category') && <td><div className="s2-ch-cat"><span className="s2-ct-dot" style={{ background: col }} />{cats[0] || '—'}</div></td>}
                    {!hiddenCols.has('subcategory') && <td>{ch.subcategory || <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>}
                    {!hiddenCols.has('subscribers') && <td className="s2-num">{formatCount(ch.subscriberCount)}</td>}
                    {!hiddenCols.has('videoCount') && <td className="s2-num">{ch.videoCount?.toLocaleString() || '—'}</td>}
                    {!hiddenCols.has('subDate') && <td className="s2-num">{fmtDate(ch.subscribedAt)}</td>}
                    {!hiddenCols.has('status') && <td><span className={`s2-status ${state}`}>{state === 'dead' ? 'Inactive' : state === 'inactive' ? 'Low' : 'Active'}</span></td>}
                    {hiddenCols.size > 0 && <td></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* GRID VIEW */}
        {chanView === 'grid' && (
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

        {/* COMPACT VIEW */}
        {chanView === 'compact' && (
          <div className="s2-compact">
            {filtered.map(ch => {
              const cats = chCats(ch);
              const col = categoryColours[cats[0]] || 'var(--accent)';
              const initials = (ch.name || '?').substring(0, 2).toUpperCase();
              return (
                <div key={ch.id} className="s2-compact-row" onClick={() => setEditingId(ch.id)}>
                  <span className={`s2-compact-fav${ch.favourited ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleFavourite(ch.id); }}>★</span>
                  <div className="s2-compact-avatar" style={{ background: `${col}33` }}>
                    {ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : initials}
                  </div>
                  <span className="s2-compact-name">{ch.name}</span>
                  <div className="s2-compact-cat"><span className="s2-ct-dot" style={{ background: col }} />{cats[0] || '—'}</div>
                  <span className="s2-compact-subs">{formatCount(ch.subscriberCount)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit channel modal */}
      {editingId && <EditChannelModal channelId={editingId} onClose={() => setEditingId(null)} />}
      {showManageCats && <ManageCategoriesModal onClose={() => setShowManageCats(false)} />}

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
    </>
  );
}
