'use client';
import { useChannelData } from './ChannelDataContext';

const COLUMNS = [
  { key: 'select', label: '', sortable: false, width: '36px' },
  { key: 'favourited', label: 'Fav', sortable: true, width: '36px' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'subcategory', label: 'Subcategory', sortable: true },
  { key: 'subscribers', label: 'Subs', sortable: true, width: '80px' },
  { key: 'videoCount', label: 'Video Count', sortable: true, width: '90px' },
  { key: 'created', label: 'Channel Created', sortable: true, width: '120px' },
  { key: 'subDate', label: 'Subscribed Since', sortable: true, width: '120px' },
];

export default function ChannelTable({
  channels,
  sortKey,
  sortDir,
  onSort,
  bulkMode,
  selectedChannels,
  onToggleSelect,
  onClickChannel,
}) {
  const { chCats, formatCount, categoryColours } = useChannelData();

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  return (
    <table className="ch-table">
      <thead>
        <tr>
          {COLUMNS.map(col => (
            <th
              key={col.key}
              style={col.width ? { width: col.width } : undefined}
              className={sortKey === col.key ? 'sorted' : ''}
              onClick={() => col.sortable && onSort(col.key)}
            >
              {col.label}
              {col.sortable && sortKey === col.key && (
                <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {channels.map(ch => {
          const cats = chCats(ch);
          const isSelected = bulkMode && selectedChannels.has(ch.id);
          const initials = (ch.name || '?').substring(0, 2).toUpperCase();

          return (
            <tr
              key={ch.id}
              className={isSelected ? 'selected-row' : ''}
              onClick={() => bulkMode ? onToggleSelect(ch.id) : onClickChannel(ch.id)}
            >
              {/* Select */}
              <td>
                <div
                  className={`ch-table-select${isSelected ? ' checked' : ''}`}
                  onClick={e => { e.stopPropagation(); onToggleSelect(ch.id); }}
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
                  onClick={e => e.stopPropagation()}
                >
                  <svg viewBox="0 0 24 24" fill={ch.favourited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              </td>

              {/* Name */}
              <td>
                <div className="ch-table-name">
                  <div className="ch-table-av">
                    {ch.thumbnail
                      ? <img src={ch.thumbnail} alt="" />
                      : initials
                    }
                  </div>
                  <span className="ch-table-label">{ch.name || 'Unknown'}</span>
                </div>
              </td>

              {/* Category */}
              <td>
                {cats.length > 0 ? cats.map(c => (
                  <span
                    key={c}
                    className="ch-badge"
                    style={{ background: `${categoryColours[c] || 'var(--accent)'}22`, color: categoryColours[c] || 'var(--accent)' }}
                  >{c}</span>
                )) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
              </td>

              {/* Subcategory */}
              <td>{ch.subcategory || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>

              {/* Subscribers */}
              <td>{ch.subscriberCount ? formatCount(ch.subscriberCount) : '—'}</td>

              {/* Video Count */}
              <td>{ch.videoCount != null ? ch.videoCount.toLocaleString() : '—'}</td>

              {/* Channel Created */}
              <td>{fmtDate(ch.channelCreatedAt)}</td>

              {/* Subscribed Since */}
              <td>{fmtDate(ch.subscribedAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
