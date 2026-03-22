'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { autoCategoriseAll } from '../../lib/auto-categorise';
import ChannelCard from '../components/ChannelCard';
import ChannelTable from '../components/ChannelTable';
import EditChannelModal from '../components/EditChannelModal';
import PageHeader from '../components/PageHeader';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'subscribers', label: 'Subscribers' },
  { value: 'videoCount', label: 'Video count' },
  { value: 'subDate', label: 'Latest' },
];

export default function SubscriptionsPage() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, subcategories, categoryColours, loading,
    chCats, chHasCat, chIsUncategorised, formatCount,
    dbCategories, reload,
  } = useChannelData();

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [sortIdx, setSortIdx] = useState(0);
  const [chanView, setChanView] = useState('hybrid');
  const [editingId, setEditingId] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState(new Set());
  const [sorting, setSorting] = useState(false);
  const [showSortConfirm, setShowSortConfirm] = useState(false);

  // ── Filter + sort ──────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...channels];

    // Category
    if (activeCategory === '__favs__') result = result.filter(c => c.favourited);
    else if (activeCategory === '__uncat__') result = result.filter(c => chIsUncategorised(c));
    else if (activeCategory !== 'all') result = result.filter(c => chHasCat(c, activeCategory));

    // Subcategory
    if (activeSubcategory) result = result.filter(c => c.subcategory === activeSubcategory);

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => (c.name || '').toLowerCase().includes(q));
    }

    // Sort
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
        case 'created': cmp = (a.channelCreatedAt || '').localeCompare(b.channelCreatedAt || ''); break;
        case 'favourited': cmp = (a.favourited ? 1 : 0) - (b.favourited ? 1 : 0); break;
        case 'state': {
          const order = { dead: 0, inactive: 1, active: 2 };
          const aState = a.videoCount === 0 || (a.subscriberCount < 100 && a.videoCount < 5) ? 'dead' : a.subscriberCount < 500 ? 'inactive' : 'active';
          const bState = b.videoCount === 0 || (b.subscriberCount < 100 && b.videoCount < 5) ? 'dead' : b.subscriberCount < 500 ? 'inactive' : 'active';
          cmp = (order[aState] || 0) - (order[bState] || 0);
          break;
        }
        default: cmp = 0;
      }
      return cmp * dir;
    });

    return result;
  }, [channels, activeCategory, activeSubcategory, search, sortKey, sortDir, chHasCat, chIsUncategorised, chCats]);

  // ── Handlers ───────────────────────────────────────────
  const cycleSort = useCallback(() => {
    const next = (sortIdx + 1) % SORT_OPTIONS.length;
    setSortIdx(next);
    setSortKey(SORT_OPTIONS[next].value);
  }, [sortIdx]);

  const handleColumnSort = useCallback((key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' || key === 'category' || key === 'subcategory' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const handleCategoryClick = useCallback((cat) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
  }, []);

  // Available subcategories for active category
  const activeSubs = useMemo(() => {
    if (activeCategory === 'all' || activeCategory === '__favs__' || activeCategory === '__uncat__') return [];
    return subcategories[activeCategory] || [];
  }, [activeCategory, subcategories]);

  const uncatCount = useMemo(() => channels.filter(c => chIsUncategorised(c)).length, [channels, chIsUncategorised]);

  // ── Bulk mode ────────────────────────────────────────
  const toggleBulkMode = useCallback(() => {
    setBulkMode(prev => {
      if (prev) setSelectedChannels(new Set());
      return !prev;
    });
  }, []);

  const toggleChannelSelect = useCallback((id) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Auto-categorise ──────────────────────────────────
  const handleAutoCategorise = useCallback(async () => {
    setSorting(true);
    setShowSortConfirm(false);
    try {
      const { assignments, assigned, skipped } = autoCategoriseAll(channels, chIsUncategorised);
      if (assigned === 0) {
        alert(`All channels already have categories (${skipped} skipped).`);
        setSorting(false);
        return;
      }

      // Save each assignment to Supabase
      for (const { channel, category } of assignments) {
        // Ensure category exists in DB
        let catRow = dbCategories.find(c => c.name === category);
        if (!catRow) {
          const { data } = await supabase.from('categories')
            .insert({ name: category, user_id: user.id })
            .select()
            .single();
          catRow = data;
        }
        if (catRow) {
          await supabase.from('channel_categories').delete().eq('channel_id', channel.id);
          await supabase.from('channel_categories').insert({
            user_id: user.id,
            channel_id: channel.id,
            category_id: catRow.id,
          });
        }
      }

      await reload();
      alert(`Auto-categorised ${assigned} channels (${skipped} already had categories).`);
    } catch (e) {
      console.error('[AutoCat] Failed:', e);
      alert('Auto-categorise failed. Check console for details.');
    } finally {
      setSorting(false);
    }
  }, [channels, chIsUncategorised, dbCategories, user, reload]);

  // Register callbacks so the sidebar can set category/subcategory
  useEffect(() => {
    window.__subsortCat = (cat) => handleCategoryClick(cat);
    window.__subsortSub = (cat, sub) => {
      setActiveCategory(cat);
      setActiveSubcategory(prev => prev === sub ? null : sub);
    };
    return () => { delete window.__subsortCat; delete window.__subsortSub; };
  }, [handleCategoryClick]);

  if (loading) {
    return <div className="home-feed-loading"><span className="spinner" /> Loading subscriptions…</div>;
  }

  if (!user) {
    return (
      <main className="home-main">
        <div className="db-header"><h1 className="page-title">Subscriptions</h1></div>
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to see your subscriptions.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </main>
    );
  }

  return (
    <main className="home-main" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topbar controls */}
      <div className="sticky-bar">
        <PageHeader
          title="Subscriptions"
          count={`${channels.length} subscription${channels.length !== 1 ? 's' : ''}`}
        />
        <div className="ct-controls-row">
          <button className="ct-pill-btn" onClick={cycleSort}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M4 7h6M6 10h2" /></svg>
            Sort: <span>{SORT_OPTIONS[sortIdx].label}</span>
          </button>

          <button className="ct-pill-btn" onClick={() => window.__subsortScrollToCats?.()}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h10M4 7h6M6 10h2" /></svg>
            Filters
          </button>

          <div className="view-toggles">
            {['grid', 'list', 'hybrid'].map(mode => (
              <button
                key={mode}
                className={`view-toggle-btn${chanView === mode ? ' active' : ''}`}
                title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                onClick={() => setChanView(mode)}
              >
                {mode === 'grid' && <svg viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>}
                {mode === 'list' && <svg viewBox="0 0 14 14"><path d="M1 3h12M1 7h12M1 11h12" /></svg>}
                {mode === 'hybrid' && <svg viewBox="0 0 14 14"><rect x="1" y="1" width="3" height="12" rx="1" /><path d="M6 3h7M6 7h7M6 11h7" /></svg>}
              </button>
            ))}
          </div>

          {/* Bulk Edit */}
          <button className={`ct-pill-btn${bulkMode ? ' active' : ''}`} onClick={toggleBulkMode}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="3" width="12" height="2" rx=".5" /><rect x="1" y="7" width="8" height="2" rx=".5" /><rect x="1" y="11" width="10" height="2" rx=".5" /></svg>
            {bulkMode ? `Selected (${selectedChannels.size})` : 'Bulk Edit'}
          </button>

          {/* Sort Now */}
          <button
            className="ct-pill-btn ct-pill-accent"
            onClick={() => setShowSortConfirm(true)}
            disabled={sorting}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 1v12M1 7h12" /></svg>
            {sorting ? 'Sorting…' : 'Sort now'}
          </button>

          {/* Search */}
          <div className="feed-search-wrap" style={{ maxWidth: 220 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              className="feed-search-input"
              placeholder="Search channels…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Category + subcategory row */}
        {activeCategory !== 'all' && activeCategory !== '__favs__' && activeCategory !== '__uncat__' && (
          <div className="ct-cat-row" style={{ display: 'flex' }}>
            <span className="ct-cat-dot" style={{ background: categoryColours[activeCategory] || 'var(--accent)' }} />
            <span className="chan-topbar-title">{activeCategory}</span>
            <span className="chan-topbar-badge">{filtered.length}</span>
            {activeSubs.length > 0 && (
              <div className="ct-subcat-pills">
                {activeSubs.map(sub => (
                  <button
                    key={sub}
                    className={`subcats-topbar-pill${activeSubcategory === sub ? ' active' : ''}`}
                    onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Uncat info */}
        {uncatCount > 0 && (
          <div className="chan-uncat-row" style={{ display: 'flex' }}>
            <div className="chan-uncat-text">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span>{uncatCount} uncategorised channel{uncatCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* Channel grid / table */}
      <div className="channels-area" id="channelsArea" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>
            {channels.length === 0 ? 'No channels yet. Sync your YouTube subscriptions to get started.' : 'No channels match your filters.'}
          </p>
        ) : chanView === 'list' ? (
          <ChannelTable
            channels={filtered}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleColumnSort}
            bulkMode={bulkMode}
            setBulkMode={setBulkMode}
            selectedChannels={selectedChannels}
            onToggleSelect={toggleChannelSelect}
            onClickChannel={(id) => setEditingId(id)}
          />
        ) : (
          <div className={`channel-grid view-${chanView}`}>
            {filtered.map((ch, i) => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                view={chanView}
                index={i}
                selected={bulkMode && selectedChannels.has(ch.id)}
                onClick={(id) => bulkMode ? toggleChannelSelect(id) : setEditingId(id)}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {search || activeCategory !== 'all' ? (
          <div style={{ padding: '.5rem 0', fontSize: '.75rem', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {channels.length} channels
          </div>
        ) : null}
      </div>

      {/* Edit channel modal */}
      {editingId && (
        <EditChannelModal
          channelId={editingId}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Auto-categorise confirmation modal */}
      {showSortConfirm && (
        <div className="modal-overlay open" onClick={() => setShowSortConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Auto-categorise channels</h2>
            <p className="subtitle">
              This will automatically assign categories to your {uncatCount} uncategorised channel{uncatCount !== 1 ? 's' : ''} based on their YouTube topic data and keywords. Already-categorised channels won't be changed.
            </p>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowSortConfirm(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAutoCategorise} disabled={sorting}>
                {sorting ? 'Sorting…' : 'Auto-Categorise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
