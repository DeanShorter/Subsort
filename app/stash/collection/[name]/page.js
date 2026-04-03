'use client';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../components/AuthContext';
import { useStash } from '../../../../hooks/useStash';
import { timeAgo } from '../../../../lib/youtube';

export default function CollectionPage() {
  const { name } = useParams();
  const collectionName = decodeURIComponent(name);
  const { user } = useAuth();
  const { collections, items, removeFromStash, moveToCollection } = useStash(user);

  const collection = collections.find(c => c.name === collectionName);
  const collectionItems = useMemo(() => {
    if (!collection) return [];
    return items.filter(i => i.collection_id === collection.id).sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
  }, [collection, items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="stash-header">
        <div className="stash-header-row">
          <div className="stash-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/stash" style={{ color: 'var(--ocean-text)', textDecoration: 'none', fontSize: 14 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            {collectionName}
            <span>{collectionItems.length} videos</span>
          </div>
        </div>
      </div>

      <div className="stash-content">
        {collectionItems.length > 0 ? (
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
