'use client';
import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthContext';
import { useStash } from '../../../../hooks/useStash';
import { timeAgo } from '../../../../lib/youtube';

function SimpleView({ collectionItems, removeFromStash, moveToCollection }) {
  return (
    <div className="stash-video-grid">
      {collectionItems.map(item => {
        const initials = (item.channel_name || '??').substring(0, 2).toUpperCase();
        return (
          <div key={item.id} className="stash-video-card">
            <div className="stash-video-thumb">
              {item.thumbnail
                ? <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span className="stash-video-thumb-text">Thumbnail</span>
              }
              {item.duration && <span className="stash-video-duration">{item.duration}</span>}
            </div>
            <div className="stash-video-info">
              <div className="stash-video-title">{item.title}</div>
              <div className="stash-video-channel">
                <div className="stash-video-avatar" style={{ background: 'var(--accent)' }}>{initials}</div>
                {item.channel_name}
              </div>
              <div className="stash-video-meta">{item.saved_at ? timeAgo(item.saved_at) : ''}</div>
              <div className="stash-video-actions">
                <a className="stash-video-btn-watch" href={`https://www.youtube.com/watch?v=${item.video_id}`} target="_blank" rel="noopener noreferrer">Watch</a>
                <button className="stash-video-btn-collect" onClick={() => moveToCollection(item.id, null)}>Remove from collection</button>
                <button className="stash-video-btn-collect" onClick={() => removeFromStash(item.video_id)}>Delete</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CuratedOverview({ collection, collectionItems, onSelectVideo, toggleWatched }) {
  const completedCount = collectionItems.filter(i => i.watched).length;
  const progressPct = collectionItems.length ? (completedCount / collectionItems.length) * 100 : 0;

  return (
    <div className="cur-wrap">
      <div className="cur-header">
        <div className="cur-type-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M3 6h6M4 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Curated collection
        </div>
        <div className="cur-title">{collection.name}</div>
        {collection.description && <div className="cur-desc">{collection.description}</div>}
        <div className="cur-meta">
          <div className="cur-meta-item">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l5 4-5 4z" fill="currentColor" /></svg>
            <span className="cur-meta-value">{collectionItems.length} videos</span>
          </div>
          <div className="cur-meta-item">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" /><path d="M7 4.5v3l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            <span className="cur-meta-value">Created {collection.created_at ? new Date(collection.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
          </div>
        </div>
      </div>

      <div className="cur-progress">
        <div className="cur-progress-bar"><div className="cur-progress-fill" style={{ width: `${progressPct}%` }} /></div>
        <div className="cur-progress-text">{completedCount} of {collectionItems.length} completed</div>
      </div>

      <div className="cur-video-list">
        {collectionItems.map((item, i) => {
          const initials = (item.channel_name || '??').substring(0, 2).toUpperCase();
          const isCompleted = item.watched;
          // Find the first unwatched item
          const firstUnwatched = collectionItems.findIndex(it => !it.watched);
          const isCurrent = i === firstUnwatched;

          return (
            <div key={item.id} className={`cur-video-item${isCompleted ? ' completed' : ''}${isCurrent ? ' active' : ''}`} onClick={() => onSelectVideo(item, i)}>
              <div className={`cur-video-num ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                {isCompleted
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : i + 1
                }
              </div>
              <div className="cur-video-thumb">
                {item.thumbnail
                  ? <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888' }}>Thumbnail</div>
                }
                {item.duration && <div className="cur-video-dur">{item.duration}</div>}
              </div>
              <div className="cur-video-info">
                <div className="cur-video-title">{item.title}</div>
                <div className="cur-video-channel">
                  <div className="cur-video-channel-av" style={{ background: 'var(--ocean)' }}>{initials}</div>
                  {item.channel_name}
                </div>
                {item.context_note && (
                  <div className="cur-video-context">
                    <div className="cur-video-context-label">Why this video</div>
                    {item.context_note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CuratedPlayer({ collection, collectionItems, activeIndex, onChangeIndex, toggleWatched, updateItem }) {
  const [activeTab, setActiveTab] = useState('context');
  const item = collectionItems[activeIndex];
  const completedCount = collectionItems.filter(i => i.watched).length;

  if (!item) return null;

  const initials = (item.channel_name || '??').substring(0, 2).toUpperCase();

  return (
    <div className="cur-player-wrap">
      {/* Sidebar */}
      <div className="cur-player-sidebar">
        <div className="cur-player-sidebar-header">
          <div className="cur-player-sidebar-title">{collection.name}</div>
          <div className="cur-player-sidebar-progress">{completedCount} of {collectionItems.length} completed</div>
        </div>
        <div className="cur-player-sidebar-list">
          {collectionItems.map((it, i) => {
            const isCompleted = it.watched;
            const isCurrent = i === activeIndex;
            return (
              <div key={it.id} className={`cur-sb-item${isCurrent ? ' active' : ''}${isCompleted ? ' completed' : ''}`} onClick={() => onChangeIndex(i)}>
                <div className={`cur-sb-num ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                  {isCompleted
                    ? <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2.5 5.5l2 2 3.5-3.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : i + 1
                  }
                </div>
                <div className={`cur-sb-title${isCompleted ? ' done' : ''}`}>{it.title}</div>
                {it.duration && <div className="cur-sb-dur">{it.duration}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <div className="cur-player-main">
        <div className="cur-player-video">
          <iframe
            src={`https://www.youtube.com/embed/${item.video_id}?rel=0&modestbranding=1`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>

        <div className="cur-player-info">
          <div className="cur-player-title">{item.title}</div>
          <div className="cur-player-channel">
            <div className="cur-player-channel-av">{initials}</div>
            {item.channel_name}
            {item.duration && <><span style={{ color: 'var(--text-muted)' }}>&middot;</span><span>{item.duration}</span></>}
          </div>
          <div className="cur-player-actions">
            <a className="cur-pv-btn primary" href={`https://www.youtube.com/watch?v=${item.video_id}`} target="_blank" rel="noopener noreferrer">Open on YouTube</a>
            <button className="cur-pv-btn" onClick={() => toggleWatched(item.id, !item.watched)}>
              {item.watched ? 'Mark incomplete' : 'Mark complete'}
            </button>
          </div>
        </div>

        <div className="cur-player-tabs">
          {['context', 'notes'].map(tab => (
            <button key={tab} className={`cur-player-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'context' ? 'Context' : 'My Notes'}
            </button>
          ))}
        </div>

        <div className="cur-player-tab-content">
          {activeTab === 'context' && (
            <>
              {item.context_note && (
                <div className="cur-context-highlight">
                  <div className="cur-context-highlight-label">Why this video</div>
                  <div className="cur-context-highlight-text">{item.context_note}</div>
                </div>
              )}
              {activeIndex < collectionItems.length - 1 && (
                <div className="cur-context-section">
                  <div className="cur-context-label">WHAT&rsquo;S NEXT</div>
                  <div className="cur-context-text">{collectionItems[activeIndex + 1]?.title}</div>
                </div>
              )}
            </>
          )}
          {activeTab === 'notes' && (
            <textarea
              className="cur-notes-area"
              placeholder="Add your notes for this video..."
              defaultValue={item.notes || ''}
              onBlur={e => updateItem(item.id, { notes: e.target.value })}
            />
          )}
        </div>

        <div className="cur-player-nav">
          <button className={`cur-nav-btn${activeIndex === 0 ? ' disabled' : ''}`} onClick={() => activeIndex > 0 && onChangeIndex(activeIndex - 1)} disabled={activeIndex === 0}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Previous
          </button>
          <span className="cur-nav-progress">{activeIndex + 1} of {collectionItems.length}</span>
          <button className={`cur-nav-btn primary${activeIndex === collectionItems.length - 1 ? ' disabled' : ''}`} onClick={() => activeIndex < collectionItems.length - 1 && onChangeIndex(activeIndex + 1)} disabled={activeIndex === collectionItems.length - 1}>
            Next
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const { name } = useParams();
  const collectionName = decodeURIComponent(name);
  const { user } = useAuth();
  const { collections, items, removeFromStash, moveToCollection, toggleWatched, updateItem } = useStash(user);
  const [activeVideoIndex, setActiveVideoIndex] = useState(null);

  const collection = collections.find(c => c.name === collectionName);
  const collectionItems = useMemo(() => {
    if (!collection) return [];
    return items
      .filter(i => i.collection_id === collection.id)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || new Date(a.saved_at) - new Date(b.saved_at));
  }, [collection, items]);

  const isCurated = collection?.collection_type === 'curated';

  const handleSelectVideo = useCallback((item, index) => {
    setActiveVideoIndex(index);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="stash-header">
        <div className="stash-header-row">
          <div className="stash-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/stash" style={{ color: 'var(--ocean-text)', textDecoration: 'none', fontSize: 14, display: 'flex' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            {collectionName}
            <span>{collectionItems.length} videos</span>
          </div>
          {isCurated && activeVideoIndex !== null && (
            <button className="stash-header-stat" style={{ cursor: 'pointer', border: 'none', background: 'var(--bg-card)' }} onClick={() => setActiveVideoIndex(null)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M4 7h6M6 10h2" stroke="var(--ocean)" strokeWidth="1.2" strokeLinecap="round" /></svg>
              Overview
            </button>
          )}
        </div>
      </div>

      <div className="stash-content">
        {collectionItems.length > 0 ? (
          isCurated ? (
            activeVideoIndex !== null ? (
              <CuratedPlayer
                collection={collection}
                collectionItems={collectionItems}
                activeIndex={activeVideoIndex}
                onChangeIndex={setActiveVideoIndex}
                toggleWatched={toggleWatched}
                updateItem={updateItem}
              />
            ) : (
              <CuratedOverview
                collection={collection}
                collectionItems={collectionItems}
                onSelectVideo={handleSelectVideo}
                toggleWatched={toggleWatched}
              />
            )
          ) : (
            <SimpleView
              collectionItems={collectionItems}
              removeFromStash={removeFromStash}
              moveToCollection={moveToCollection}
            />
          )
        ) : (
          <div className="stash-empty">
            <div className="stash-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ocean)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
                <path d="M17 21v-8a1 1 0 00-1-1H8a1 1 0 00-1 1v8" />
                <path d="M7 3v4h10V3" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No videos in this collection</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.5 }}>
              Add videos from your Feed or move them here from your Stash.
            </div>
            <Link href="/stash" style={{ marginTop: 16, fontSize: 14, color: 'var(--ocean)', fontWeight: 500, textDecoration: 'none' }}>Back to Stash</Link>
          </div>
        )}
      </div>
    </div>
  );
}
