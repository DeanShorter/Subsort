'use client';
import { useState, useMemo } from 'react';
import { useChannelData } from './ChannelDataContext';

export default function CategoryPanel({ selectedCats, onToggleCat, onClose }) {
  const { categories, subcategories, categoryColours, channels, chCats, chHasCat } = useChannelData();
  const [searchQ, setSearchQ] = useState('');
  const [expandedCats, setExpandedCats] = useState(new Set());

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
          const isExpanded = expandedCats.has(cat);
          const count = getCatCount(cat);

          return (
            <div key={cat}>
              <div className={`cp-item${isOn ? ' on' : ''}`}>
                <div className="cp-item-left" onClick={() => onToggleCat(cat)}>
                  <div className={`cp-check${isOn ? ' on' : ''}`}>
                    {isOn && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span className="cp-name">{cat}</span>
                </div>
                <div className="cp-item-right">
                  <div className="cp-item-actions">
                    <button className="cp-action-btn" title="Add subcategory" onClick={e => { e.stopPropagation(); toggleExpand(cat); }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </button>
                    <button className="cp-action-btn" title="Edit" onClick={e => e.stopPropagation()}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7 2.5l2.5 2.5M3 7l-1 3 3-1 5.5-5.5-2.5-2.5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button className="cp-action-btn cp-action-del" title="Delete" onClick={e => e.stopPropagation()}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2h3v1M3 3v7a1 1 0 001 1h4a1 1 0 001-1V3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                  {subs.length > 0 && (
                    <button className={`cp-chevron${isExpanded ? ' open' : ''}`} onClick={e => { e.stopPropagation(); toggleExpand(cat); }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 3l3 3-3 3" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  )}
                  <span className="cp-count">{count}</span>
                </div>
              </div>

              {/* Subcategories */}
              {isExpanded && subs.map(sub => (
                <div key={sub} className="cp-sub-item">
                  <div className="cp-sub-left">
                    <div className="cp-sub-dash" />
                    <span className="cp-sub-name">{sub}</span>
                  </div>
                  <span className="cp-sub-count">{getSubCount(cat, sub)}</span>
                </div>
              ))}
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
    </div>
  );
}
