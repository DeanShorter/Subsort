'use client';
import { useChannelData } from './ChannelDataContext';

export default function ChannelCard({ channel, view = 'hybrid', index = 0, selected = false, onSelect, onClick }) {
  const { chCats, formatCount, categoryColours } = useChannelData();

  const ch = channel;
  const cats = chCats(ch);
  const initials = (ch.name || '?').substring(0, 2).toUpperCase();

  const catBadges = cats.map(c => {
    const col = categoryColours[c] || 'var(--accent)';
    return (
      <span key={c} className="ch-badge" style={{ background: `${col}22`, color: col }}>{c}</span>
    );
  });
  const subcatBadge = ch.subcategory
    ? <span className="ch-badge">{ch.subcategory}</span>
    : null;

  const selectEl = onSelect ? (
    <div
      className={`card-select${selected ? ' selected' : ''}`}
      onClick={e => { e.stopPropagation(); onSelect(ch.id); }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
    </div>
  ) : null;

  const menuEl = (
    <button className="ch-menu" title="Options" onClick={e => { e.stopPropagation(); onClick?.(ch.id); }}>
      <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
    </button>
  );

  // ── List view ──────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className={`ch-list-row${selected ? ' selected-card' : ''}`} onClick={() => onClick?.(ch.id)}>
        {selectEl}
        <button
          className={`ch-list-star${ch.favourited ? ' starred' : ''}`}
          onClick={e => e.stopPropagation()}
          title={ch.favourited ? 'Remove from favourites' : 'Add to favourites'}
        >
          <svg viewBox="0 0 24 24" fill={ch.favourited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
        <div className="ch-name">{ch.name || 'Unknown'}</div>
        <span className="ch-list-stat">{ch.subscriberCount ? formatCount(ch.subscriberCount) + ' subs' : '—'}</span>
        <span className="ch-list-stat">{ch.videoCount ? formatCount(ch.videoCount) + ' videos' : '—'}</span>
        <div className="ch-badges">{catBadges}{subcatBadge}</div>
        {menuEl}
      </div>
    );
  }

  // ── Grid view ──────────────────────────────────────────
  if (view === 'grid') {
    const ph = index % 5;
    return (
      <div className={`channel-card${selected ? ' selected-card' : ''}`} onClick={() => onClick?.(ch.id)}>
        {selectEl}
        <div className="card-banner">
          {ch.bannerUrl
            ? <img src={ch.bannerUrl} alt="" loading="lazy" />
            : <div className={`card-banner-placeholder ph-${ph}`} />
          }
        </div>
        <div className="card-body">
          <div className="card-name-row">
            <div className="card-avatar">
              {ch.thumbnail
                ? <img src={ch.thumbnail} alt="" />
                : <div className="card-avatar-placeholder">{initials}</div>
              }
            </div>
            <div className="card-name">{ch.name || 'Unknown'}</div>
          </div>
          {(ch.subscriberCount || ch.videoCount) ? (
            <div className="card-meta">
              {ch.subscriberCount ? <span>{formatCount(ch.subscriberCount)} subs</span> : null}
              {ch.videoCount ? <span>{formatCount(ch.videoCount)} videos</span> : null}
            </div>
          ) : null}
          <div className="ch-badges">{catBadges}{subcatBadge}</div>
        </div>
        {ch.favourited && <div className="ch-fav-dot" title="Favourite" style={{ position: 'absolute', top: '.625rem', right: '.625rem' }} />}
        {menuEl}
      </div>
    );
  }

  // ── Hybrid view (default) ──────────────────────────────
  const stats = [
    ch.subscriberCount ? `${formatCount(ch.subscriberCount)} subs` : '',
    ch.videoCount ? `${formatCount(ch.videoCount)} videos` : '',
  ].filter(Boolean);

  return (
    <div className={`ch-card${selected ? ' selected-card' : ''}`} onClick={() => onClick?.(ch.id)}>
      {selectEl}
      <div className="ch-av">
        {ch.thumbnail
          ? <img src={ch.thumbnail} alt={ch.name} />
          : <div className="ch-av-ph">{initials}</div>
        }
      </div>
      <div className="ch-body">
        <div className="ch-name">{ch.name || 'Unknown'}</div>
        {stats.length > 0 && (
          <div className="ch-stats">
            {stats.map((s, i) => (
              <span key={i}>{i > 0 && <span className="ch-dot" />}{s}</span>
            ))}
          </div>
        )}
        <div className="ch-badges">{catBadges}{subcatBadge}</div>
      </div>
      {ch.favourited && <div className="ch-fav-dot" title="Favourite" />}
      {menuEl}
    </div>
  );
}
