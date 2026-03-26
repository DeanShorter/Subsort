'use client';
import { useState, useRef, useCallback } from 'react';
import { useChannelData } from './ChannelDataContext';

const COLUMNS = [
  { key: 'select', label: '', sortable: false, initWidth: 36, resizable: false },
  { key: 'favourited', label: 'Fav', sortable: true, initWidth: 36, resizable: false },
  { key: 'name', label: 'Name', sortable: true, initWidth: 200, minWidth: 120 },
  { key: 'category', label: 'Category', sortable: true, initWidth: 140, minWidth: 80 },
  { key: 'subcategory', label: 'Subcategory', sortable: true, initWidth: 120, minWidth: 70 },
  { key: 'subscribers', label: 'Subs', sortable: true, initWidth: 80, minWidth: 60 },
  { key: 'videoCount', label: 'Video Count', sortable: true, initWidth: 90, minWidth: 60 },
  { key: 'created', label: 'Channel Created', sortable: true, initWidth: 120, minWidth: 90 },
  { key: 'subDate', label: 'Subscribed Since', sortable: true, initWidth: 120, minWidth: 90 },
  { key: 'state', label: 'Status', sortable: true, initWidth: 80, minWidth: 60 },
];

export default function ChannelTable({
  channels,
  sortKey,
  sortDir,
  onSort,
  bulkMode,
  setBulkMode,
  selectedChannels,
  onToggleSelect,
  onClickChannel,
}) {
  const { chCats, formatCount, categoryColours, toggleFavourite, getChannelState } = useChannelData();

  // ── Resizable columns ──────────────────────────────────
  const [colWidths, setColWidths] = useState(() =>
    Object.fromEntries(COLUMNS.map(c => [c.key, c.initWidth]))
  );
  const resizing = useRef(null);

  const onResizeStart = useCallback((e, colKey) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey];
    const col = COLUMNS.find(c => c.key === colKey);
    const minW = col?.minWidth || 40;

    const onMove = (ev) => {
      const delta = ev.clientX - startX;
      setColWidths(prev => ({ ...prev, [colKey]: Math.max(minW, startWidth + delta) }));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      resizing.current = null;
    };
    resizing.current = colKey;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [colWidths]);

  // ── Select handler that auto-enables bulk mode ─────────
  const handleSelect = useCallback((id) => {
    if (!bulkMode) setBulkMode(true);
    onToggleSelect(id);
  }, [bulkMode, setBulkMode, onToggleSelect]);

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const stateLabel = (state) => {
    if (state === 'dead') return <span className="ch-state-badge dead">Dead</span>;
    if (state === 'inactive') return <span className="ch-state-badge inactive">Inactive</span>;
    return <span className="ch-state-badge active">Active</span>;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="ch-table" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
        <colgroup>
          {COLUMNS.map(col => (
            <col key={col.key} style={{ width: colWidths[col.key] + 'px' }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                className={sortKey === col.key ? 'sorted' : ''}
                onClick={() => col.sortable && onSort(col.key)}
              >
                <span>{col.label}</span>
                {col.sortable && sortKey === col.key && (
                  <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
                {col.resizable !== false && col.key !== 'select' && (
                  <span
                    className="ch-table-resizer"
                    onMouseDown={e => onResizeStart(e, col.key)}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channels.map(ch => {
            const cats = chCats(ch);
            const isSelected = selectedChannels.has(ch.id);
            const initials = (ch.name || '?').substring(0, 2).toUpperCase();
            const state = getChannelState(ch);

            return (
              <tr
                key={ch.id}
                className={isSelected ? 'selected-row' : ''}
                onClick={() => bulkMode ? handleSelect(ch.id) : onClickChannel(ch.id)}
              >
                {/* Select */}
                <td>
                  <div
                    className={`ch-table-select${isSelected ? ' checked' : ''}`}
                    onClick={e => { e.stopPropagation(); handleSelect(ch.id); }}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                </td>

                {/* Favourite */}
                <td>
                  <button
                    className={`ch-table-fav${ch.favourited ? ' starred' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleFavourite(ch.id); }}
                  >
                    <svg viewBox="0 0 16 16" fill={ch.favourited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" />
                    </svg>
                  </button>
                </td>

                {/* Name */}
                <td>
                  <div className="ch-table-name">
                    <div className="ch-table-av">
                      {ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : initials}
                    </div>
                    <span className="ch-table-label">{ch.name || 'Unknown'}</span>
                  </div>
                </td>

                {/* Category */}
                <td>
                  {cats.length > 0 ? cats.map(c => (
                    <span key={c} className="ch-table-cat">
                      <span className="hnp-cat-dot" style={{ background: categoryColours[c] || 'var(--accent)' }} />
                      {c}
                    </span>
                  )) : <span className="ch-table-muted">—</span>}
                </td>

                {/* Subcategory */}
                <td>
                  {ch.subcategory ? (
                    <span className="ch-table-subcat">
                      <span className="hnp-cat-slash" style={{ color: categoryColours[cats[0]] || 'var(--accent)' }}>/</span>
                      {ch.subcategory}
                    </span>
                  ) : <span className="ch-table-muted">—</span>}
                </td>

                {/* Subscribers */}
                <td>{ch.subscriberCount ? formatCount(ch.subscriberCount) : '—'}</td>

                {/* Video Count */}
                <td>{ch.videoCount != null ? ch.videoCount.toLocaleString() : '—'}</td>

                {/* Channel Created */}
                <td>{fmtDate(ch.channelCreatedAt)}</td>

                {/* Subscribed Since */}
                <td>{fmtDate(ch.subscribedAt)}</td>

                {/* Status */}
                <td>{stateLabel(state)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
