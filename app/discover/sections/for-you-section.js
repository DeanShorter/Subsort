'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../components/AuthContext';
import { trackEvent } from '../../../lib/track';
import Link from 'next/link';

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function ForYouSection() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      try {
        const { data: { session } } = await (await import('../../../lib/supabase')).supabase.auth.getSession();
        if (!session?.access_token) { setLoading(false); return; }
        const res = await fetch('/api/discover/foryou', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (!cancelled) {
          setChannels(data.channels || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  return (
    <div className="dsc-section">
      <div className="dsc-section-header">
        <div>
          <div className="dsc-section-title">For you</div>
        </div>
      </div>
      {loading ? (
        <div className="foryou-scroll">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="foryou-card skeleton-card">
              <div className="skeleton-avatar skeleton-shimmer" />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '70%' }} />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '50%', height: 11 }} />
              <div className="skeleton-badge skeleton-shimmer" />
              <div className="skeleton-line skeleton-shimmer" style={{ width: '40%', height: 11 }} />
            </div>
          ))}
        </div>
      ) : channels.length > 0 ? (
        <div className="foryou-scroll" ref={scrollRef}>
          {channels.map((ch, idx) => (
            <a
              key={ch.youtube_channel_id}
              className="foryou-card"
              href={`https://youtube.com/channel/${ch.youtube_channel_id}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('foryou_card_clicked', { channel_id: ch.youtube_channel_id, position: idx, subcategory: ch.category })}
            >
              <div className="foryou-avatar">
                {ch.thumbnail_url
                  ? <img src={ch.thumbnail_url} alt="" />
                  : <span>{(ch.title || '??').substring(0, 2).toUpperCase()}</span>
                }
              </div>
              <div className="foryou-name">{ch.title}</div>
              <div className="foryou-subs">{formatCount(ch.subscriber_count)} subscribers</div>
              {ch.category && <span className="foryou-badge">{ch.category}</span>}
              {ch.subsnub_users > 0 && <div className="foryou-users">{ch.subsnub_users} on Subsnub</div>}
            </a>
          ))}
        </div>
      ) : (
        <div className="dsc-foryou-empty">
          Categorise more of your subscriptions to see personalised recommendations. <Link href="/subscriptions">Go to Subscriptions</Link>
        </div>
      )}
    </div>
  );
}
