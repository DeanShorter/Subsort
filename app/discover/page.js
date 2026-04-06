'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthContext';
import { trackEvent } from '../../lib/track';
import Link from 'next/link';

const CATEGORY_KEYWORDS = {
  Music: 'Production, performance, analysis, composition, gear reviews, covers',
  Sports: 'Football, basketball, combat sports, fitness, analysis, highlights',
  Entertainment: 'Comedy, commentary, drama, reaction, pop culture, creators',
  Lifestyle: 'Fashion, travel, home, wellness, self-improvement, vlogs',
  Technology: 'Gadgets, programming, AI, reviews, tutorials, startups',
  'Science & Education': 'Physics, biology, history, mathematics, explainers, research',
  'News & Politics': 'Current events, journalism, policy, debate, geopolitics, media',
  Gaming: 'Gameplay, reviews, esports, retro, strategy, walkthroughs',
  Food: 'Cooking, recipes, reviews, baking, street food, kitchen gear',
};

const CATEGORY_CLASSES = {
  Music: 'cat-music',
  Sports: 'cat-sports',
  Entertainment: 'cat-entertainment',
  Lifestyle: 'cat-lifestyle',
  Technology: 'cat-technology',
  'Science & Education': 'cat-science',
  'News & Politics': 'cat-news',
  Gaming: 'cat-gaming',
  Food: 'cat-food',
};

const COLLECTION_TYPES = [
  {
    key: 'learning',
    title: 'Learning paths',
    subtitle: 'Structured courses built from free YouTube content. Start at video one and work through.',
    link: '/discover/collections?type=learning',
  },
  {
    key: 'playlist',
    title: 'Playlists',
    subtitle: 'Casual channel and video lists. Browse, fork, or build your own.',
    link: '/discover/collections?type=playlist',
  },
  {
    key: 'rabbithole',
    title: 'Rabbit holes',
    subtitle: 'Themed deep-dives for when you want to disappear into one specific niche for hours.',
    link: '/discover/collections?type=rabbithole',
  },
];

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  if (hrs > 0) return `~${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `~${mins} min`;
}

function RatingStars({ rating, collectionId }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <svg key={i} className="rating-star" viewBox="0 0 14 14">
          <path d="M7 1l1.8 4 4.2.6-3 3 .8 4.2L7 11l-3.8 1.8.8-4.2-3-3 4.2-.6z" fill="#FF8C42" />
        </svg>
      );
    } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
      const pct = Math.round((rating % 1) * 100);
      const gradId = `half-star-${collectionId}-${i}`;
      stars.push(
        <svg key={i} className="rating-star" viewBox="0 0 14 14">
          <defs>
            <linearGradient id={gradId}>
              <stop offset={`${pct}%`} stopColor="#FF8C42" />
              <stop offset={`${pct}%`} stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <path d="M7 1l1.8 4 4.2.6-3 3 .8 4.2L7 11l-3.8 1.8.8-4.2-3-3 4.2-.6z" fill={`url(#${gradId})`} />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} className="rating-star" viewBox="0 0 14 14">
          <path d="M7 1l1.8 4 4.2.6-3 3 .8 4.2L7 11l-3.8 1.8.8-4.2-3-3 4.2-.6z" fill="#e0e0e0" />
        </svg>
      );
    }
  }
  return <div className="rating-stars">{stars}</div>;
}

function CollectionCard({ collection }) {
  const initials = (collection.author_name || '??').substring(0, 2).toUpperCase();
  return (
    <Link href={`/discover/collections/${collection.slug}`} className={`collection-card type-${collection.collection_type}`}>
      <div className="collection-card-header" />
      <div className="collection-card-body">
        {collection.tags?.length > 0 && (
          <div className="collection-tags">
            {collection.tags.slice(0, 3).map(tag => (
              <span key={tag} className="collection-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="collection-title">{collection.title}</div>
        <div className="collection-description">{collection.description}</div>
        {collection.average_rating > 0 && (
          <div className="collection-rating">
            <RatingStars rating={collection.average_rating} collectionId={collection.id} />
            <span className="rating-value">{collection.average_rating}</span>
            <span className="rating-count">({collection.review_count} review{collection.review_count !== 1 ? 's' : ''})</span>
          </div>
        )}
        <div className="collection-footer">
          <div className="collection-author">
            <div className="collection-author-avatar">
              {collection.author_avatar
                ? <img src={collection.author_avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <span className="collection-author-name">{collection.author_name}</span>
            <span className="collection-meta">
              {collection.video_count ? `\u00b7 ${collection.video_count} vids` : ''}
              {collection.estimated_duration_seconds ? ` \u00b7 ${formatDuration(collection.estimated_duration_seconds)}` : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DiscoverPage() {
  const { user } = useAuth();
  const [forYou, setForYou] = useState([]);
  const [forYouLoading, setForYouLoading] = useState(true);
  const [forYouReason, setForYouReason] = useState(null);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState({});
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const forYouRef = useRef(null);

  // Track page view
  useEffect(() => {
    trackEvent('discover_viewed', {});
  }, []);

  // Load For You
  useEffect(() => {
    if (!user) { setForYouLoading(false); setForYouReason('unauthenticated'); return; }
    let cancelled = false;

    async function load() {
      try {
        const { data: { session } } = await (await import('../../lib/supabase')).supabase.auth.getSession();
        if (!session?.access_token) { setForYouLoading(false); return; }
        const res = await fetch('/api/discover/foryou', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (!cancelled) {
          setForYou(data.channels || []);
          setForYouReason(data.reason || null);
          setForYouLoading(false);
        }
      } catch {
        if (!cancelled) setForYouLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  // Load categories
  useEffect(() => {
    fetch('/api/discover/categories')
      .then(r => r.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Load collections
  useEffect(() => {
    let cancelled = false;
    fetch('/api/discover/collections')
      .then(r => r.json())
      .then(data => { if (!cancelled) { setCollections(data); setCollectionsLoading(false); } })
      .catch(() => { if (!cancelled) setCollectionsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const showForYou = !forYouLoading && forYou.length > 0;
  const showForYouEmpty = !forYouLoading && forYou.length === 0 && forYouReason === 'insufficient_categories' && user;

  return (
    <div className="dsc-page">
      {/* Header */}
      <div className="dsc-header">
        <h1 className="dsc-title">Discover</h1>
      </div>

      <div className="dsc-content-top">
        {/* ── For You ── */}
        {showForYou && (
          <div className="dsc-section">
            <div className="dsc-section-header">
              <div>
                <div className="dsc-section-title">For you</div>
              </div>
            </div>
            <div className="foryou-scroll" ref={forYouRef}>
              {forYou.map((ch, idx) => (
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
          </div>
        )}
        {showForYouEmpty && (
          <div className="dsc-foryou-empty">
            Categorise more of your subscriptions to see personalised recommendations. <Link href="/subscriptions">Go to Subscriptions</Link>
          </div>
        )}

        {/* ── Browse by Category ── */}
        {categories.length > 0 && (
          <div className="dsc-section">
            <div className="dsc-section-header">
              <div>
                <div className="dsc-section-title">Browse by category</div>
              </div>
            </div>
            <div className="category-grid">
              {categories.map(cat => {
                const cls = CATEGORY_CLASSES[cat.name] || 'cat-music';
                const keywords = CATEGORY_KEYWORDS[cat.name] || '';
                return (
                  <Link
                    key={cat.name}
                    href={`/discover/category/${encodeURIComponent(cat.name)}`}
                    className={`category-card ${cls}`}
                    onClick={() => trackEvent('category_browsed', { category_name: cat.name })}
                  >
                    <span className="category-card-count">{cat.count} channels</span>
                    <div className="category-card-content">
                      <div className="category-card-name">{cat.name}</div>
                      {keywords && <div className="category-card-keywords">{keywords}</div>}
                      <span className="category-card-browse">Browse &rarr;</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Collections ── */}
      <div className="collections-wrapper">
        {COLLECTION_TYPES.map(type => {
          const items = collections[type.key] || [];
          if (!items.length && !collectionsLoading) return null;
          return (
            <div key={type.key} className="collections-subsection">
              <div className="dsc-section-header">
                <div>
                  <div className="dsc-section-title">{type.title}</div>
                  <div className="dsc-section-subtitle">{type.subtitle}</div>
                </div>
                <Link href={type.link} className="dsc-section-link">View all &rarr;</Link>
              </div>
              {collectionsLoading && !items.length ? (
                <div className="home-feed-loading"><span className="spinner" /></div>
              ) : (
                <div className="collections-grid">
                  {items.map((c, idx) => (
                    <div key={c.id} onClick={() => trackEvent('collection_viewed', { collection_id: c.id, type: c.collection_type, position: idx })}>
                      <CollectionCard collection={c} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
