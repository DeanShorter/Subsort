'use client';
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '../components/AuthContext';
import { useStash } from '../../hooks/useStash';
import { timeAgo } from '../../lib/youtube';
import Link from 'next/link';

function CollectionIcon({ icon, color }) {
  if (icon === 'play') return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="1.5" /><path d="M8 7.5v5l4.5-2.5z" fill={color} /></svg>;
  if (icon === 'clock') return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="6.5" stroke={color} strokeWidth="1.5" /><path d="M10 6.5v3.5l2.5 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>;
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3l2.2 4.5 5 .7-3.6 3.5.8 5L10 14l-4.4 2.7.8-5L3 8.2l5-.7z" fill={color} /></svg>;
}

function StashVideoCard({ item, collections, onRemove, onMoveToCollection, onCreateAndMove }) {
  const [colOpen, setColOpen] = useState(false);
  const initials = (item.channel_name || '??').substring(0, 2).toUpperCase();
  const currentCol = collections.find(c => c.id === item.collection_id);

  return (
    <div
      className="stash-video-card"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
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
          <div className="stash-col-wrap">
            <button className="stash-video-btn-collect" onClick={() => setColOpen(!colOpen)}>
              {currentCol ? currentCol.name : 'Add to collection'}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 4l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {colOpen && (
              <div className="stash-col-dropdown">
                {item.collection_id && (
                  <div className="stash-col-dropdown-item" onClick={() => { onMoveToCollection(item.id, null); setColOpen(false); }}>
                    <span style={{ color: 'var(--text-muted)' }}>Remove from collection</span>
                  </div>
                )}
                {collections.filter(c => c.id !== item.collection_id).map(col => (
                  <div key={col.id} className="stash-col-dropdown-item" onClick={() => { onMoveToCollection(item.id, col.id); setColOpen(false); }}>
                    {col.name}
                  </div>
                ))}
                {collections.length > 0 && <div className="stash-col-dropdown-divider" />}
                <div className="stash-col-dropdown-item" onClick={() => {
                  const name = prompt('Collection name:');
                  if (name?.trim()) { onCreateAndMove(item.id, name.trim()); }
                  setColOpen(false);
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  New collection
                </div>
              </div>
            )}
          </div>
          <button className="stash-video-btn-collect" onClick={() => onRemove(item.video_id)} style={{ marginLeft: 4 }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function StashPage() {
  const { user, signIn } = useAuth();
  const { collections, items, loading, removeFromStash, moveToCollection, createCollection, deleteCollection } = useStash(user);
  const [criticDismissed, setCriticDismissed] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [showNewCol, setShowNewCol] = useState(false);
  const [dragOverCol, setDragOverCol] = useState(null);

  const collectionCounts = useMemo(() => {
    const counts = {};
    items.forEach(item => {
      if (item.collection_id) counts[item.collection_id] = (counts[item.collection_id] || 0) + 1;
    });
    return counts;
  }, [items]);

  const recentItems = useMemo(() => items.slice(0, 12), [items]);
  const watchedCount = items.filter(i => i.watched).length;

  const colColors = ['var(--accent-soft)', 'var(--orange-soft)', 'var(--iris-soft)', 'var(--ocean-soft)'];
  const colIconColors = ['var(--accent)', 'var(--orange)', 'var(--iris)', 'var(--ocean)'];

  const handleCreateAndMove = useCallback(async (itemId, colName) => {
    const col = await createCollection(colName);
    if (col) moveToCollection(itemId, col.id);
  }, [createCollection, moveToCollection]);

  const handleDrop = useCallback((e, collectionId) => {
    e.preventDefault();
    setDragOverCol(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId) moveToCollection(itemId, collectionId);
  }, [moveToCollection]);

  const handleDragOver = useCallback((e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  }, []);

  if (loading) return <div className="home-feed-loading"><span className="spinner" /> Loading stash...</div>;

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="stash-header">
          <div className="stash-header-row">
            <div className="stash-title">Stash <span>your saved videos</span></div>
          </div>
        </div>
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to use your stash.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="stash-header">
        <div className="stash-header-row">
          <div className="stash-title">Stash <span>your saved videos</span></div>
          <div className="stash-header-right">
            <div className="stash-header-stat">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="9" rx="1.5" stroke="var(--ocean)" strokeWidth="1.2" /><path d="M4 7l2 2 4-4" stroke="var(--ocean)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <strong>{items.length}</strong> saved
            </div>
            <div className="stash-header-stat">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="var(--ocean)" strokeWidth="1.2" strokeLinecap="round" /></svg>
              <strong>{collections.length}</strong> collections
            </div>
          </div>
        </div>
      </div>

      <div className="stash-content">
        {/* Critic strip */}
        {!criticDismissed && items.length > 0 && (
          <div className="stash-critic-strip">
            <div className="stash-critic-icon" style={{ background: 'var(--orange)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.8 3.6 4 .5-2.9 2.8.7 4L7 10.5l-3.6 1.9.7-4L1.2 5.6l4-.5z" fill="#fff" /></svg>
            </div>
            <div className="stash-critic-msg">
              {watchedCount === 0 && items.length > 3
                ? `"${items.length} videos saved, 0 watched. That's not a stash, Dean — that's a to-do list you're ignoring."`
                : watchedCount > 0
                ? `"${items.length} saved, ${watchedCount} watched. At least you're making progress."`
                : `"${items.length} videos stashed. I'll be watching to see if you actually watch them."`
              }
            </div>
            <button className="stash-critic-dismiss" onClick={() => setCriticDismissed(true)}>Dismiss</button>
          </div>
        )}

        {!criticDismissed && items.length === 0 && (
          <div className="stash-critic-strip">
            <div className="stash-critic-icon" style={{ background: 'var(--orange)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.8 3.6 4 .5-2.9 2.8.7 4L7 10.5l-3.6 1.9.7-4L1.2 5.6l4-.5z" fill="#fff" /></svg>
            </div>
            <div className="stash-critic-msg">&ldquo;Nothing saved yet. When you find a video worth coming back to, hit the save button on your Feed. I&rsquo;ll keep it safe.&rdquo;</div>
          </div>
        )}

        {/* Collections */}
        <div className="stash-section-header">
          <div className="stash-section-title">
            Collections
            <span className="stash-section-count">{collections.length}</span>
          </div>
        </div>

        <div className="stash-collections-row">
          {collections.map((col, i) => (
            <Link
              key={col.id}
              href={`/stash/collection/${encodeURIComponent(col.name)}`}
              className={`stash-collection-card${dragOverCol === col.id ? ' drag-over' : ''}`}
              style={{ background: colColors[i % colColors.length], textDecoration: 'none', color: 'inherit' }}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => { e.preventDefault(); handleDrop(e, col.id); }}
            >
              <div className="stash-collection-card-icon">
                <CollectionIcon icon={col.icon || 'star'} color={colIconColors[i % colIconColors.length]} />
              </div>
              <div className="stash-collection-card-name">{col.name}</div>
              <div className="stash-collection-card-count">{collectionCounts[col.id] || 0} videos</div>
            </Link>
          ))}
          {showNewCol ? (
            <div className="stash-collection-add" style={{ justifyContent: 'center', gap: 8 }}>
              <input
                className="cp-add-input"
                placeholder="Collection name..."
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newColName.trim()) { createCollection(newColName.trim()); setNewColName(''); setShowNewCol(false); }
                  if (e.key === 'Escape') { setShowNewCol(false); setNewColName(''); }
                }}
                autoFocus
                style={{ width: '140px' }}
              />
            </div>
          ) : (
            <div className="stash-collection-add" onClick={() => setShowNewCol(true)}>
              <div className="stash-collection-add-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="var(--ocean)" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>New collection</span>
            </div>
          )}
        </div>

        {/* Recently saved */}
        <div className="stash-section-header">
          <div className="stash-section-title">
            Recently saved
            <span className="stash-section-count">{items.length} videos</span>
          </div>
        </div>

        {recentItems.length > 0 ? (
          <div className="stash-video-grid">
            {recentItems.map(item => (
              <StashVideoCard
                key={item.id}
                item={item}
                collections={collections}
                onRemove={removeFromStash}
                onMoveToCollection={moveToCollection}
                onCreateAndMove={handleCreateAndMove}
              />
            ))}
          </div>
        ) : (
          <div className="stash-empty">
            <div className="stash-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ocean)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" />
                <path d="M17 21v-8a1 1 0 00-1-1H8a1 1 0 00-1 1v8" />
                <path d="M7 3v4h10V3" />
              </svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Your stash is empty</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.5 }}>
              Save videos from your feed to watch later. They&rsquo;ll appear here organised by when you saved them.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
