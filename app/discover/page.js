'use client';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import PageHeader from '../components/PageHeader';
import { trackEvent } from '../../lib/track';

// Placeholder gradient colours for video thumbnails
const PH_GRADIENTS = [
  ['#2a4a7f', '#1a3a6f'], ['#4a2a6f', '#3a1a5f'], ['#2a6f4a', '#1a5f3a'],
  ['#6f4a2a', '#5f3a1a'], ['#5a3a3a', '#4a2a2a'], ['#3a5f5f', '#2a4f4f'],
  ['#6f2a4a', '#5f1a3a'], ['#4f4f2a', '#3f3f1a'], ['#2a5f2a', '#1a4f1a'],
  ['#5f3a5f', '#4f2a4f'],
];

function PlaceholderCard({ title, channel, tag, tagCol, gradient, isNew }) {
  const [g1, g2] = gradient || PH_GRADIENTS[Math.floor(Math.random() * PH_GRADIENTS.length)];
  return (
    <div className="feed-vcard scroll-card">
      <div className="feed-vcard-thumb">
        <div className="feed-ph-thumb" style={{ background: `linear-gradient(135deg,${g1},${g2})` }}>
          <span className="feed-ph-label">{channel}</span>
        </div>
        {isNew && <span className="feed-vcard-new">New</span>}
      </div>
      <div className="feed-vcard-info">
        <div className="feed-vcard-title">{title}</div>
        <div className="feed-vcard-channel">{channel}</div>
        {tag && <span className="feed-vcard-tag" style={tagCol ? { background: `${tagCol}22`, color: tagCol } : {}}>{tag}</span>}
      </div>
    </div>
  );
}

function PlaceholderRow({ title, channel, tag, tagCol, gradient }) {
  const [g1, g2] = gradient || PH_GRADIENTS[0];
  return (
    <div className="feed-vrow">
      <div className="feed-vrow-thumb">
        <div className="feed-ph-thumb" style={{ background: `linear-gradient(135deg,${g1},${g2})` }} />
      </div>
      <div className="feed-vrow-info">
        <div className="feed-vrow-title">{title}</div>
        <div className="feed-vrow-channel">{channel} · Coming soon</div>
        {tag && <span className="feed-vrow-tag" style={tagCol ? { background: `${tagCol}22`, color: tagCol } : {}}>{tag}</span>}
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, categoryColours, loading,
    chCats,
  } = useChannelData();

  const [search, setSearch] = useState('');
  const [breakDismissed, setBreakDismissed] = useState(false);

  useEffect(() => { trackEvent('view_discover'); }, []);

  // ── Top 2 categories by channel count ──────────────
  const topCats = useMemo(() => {
    const counts = {};
    channels.forEach(ch => (ch.categories || []).forEach(c => counts[c] = (counts[c] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);
  }, [channels]);

  const topCat1 = topCats[0] || 'Entertainment';
  const topCat2 = topCats[1] || 'Music';
  const col1 = categoryColours[topCat1] || 'var(--accent)';
  const col2 = categoryColours[topCat2] || '#378ADD';

  if (loading) return <div className="home-feed-loading"><span className="spinner" /> Loading…</div>;

  if (!user) {
    return (
      <main className="home-main">
        <PageHeader title="Discover" subtitle="Find new channels based on what you watch" sticky={false} />
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to discover new content.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </main>
    );
  }

  return (
    <main className="home-main">
      <PageHeader
        title="Discover"
        subtitle="Find new channels based on what you watch"
        right={
          <div className="ph-search-wrap">
            <svg viewBox="0 0 14 14"><circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L13 13" /></svg>
            <input className="ph-search" type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        }
      />

      {/* ── Popular in top category ── */}
      <div className="feed-section">
        <div className="feed-section-header">
          <div className="feed-section-left">
            <span className="feed-section-title">Popular in {topCat1}</span>
            <span className="feed-section-count">5 videos</span>
          </div>
          <button className="feed-section-link">See more</button>
        </div>
        <div className="feed-scroll-row">
          <PlaceholderCard title={`Top ${topCat1} video #1`} channel="Trending Creator" tag={topCat1} tagCol={col1} gradient={PH_GRADIENTS[0]} isNew />
          <PlaceholderCard title={`Why everyone is talking about this`} channel="Popular Channel" tag={topCat1} tagCol={col1} gradient={PH_GRADIENTS[1]} isNew />
          <PlaceholderCard title={`${topCat1} roundup — this week's best`} channel="Weekly Digest" tag={topCat1} tagCol={col1} gradient={PH_GRADIENTS[2]} />
          <PlaceholderCard title={`Deep dive: the rise of indie ${topCat1.toLowerCase()}`} channel="Analysis Hub" tag={topCat1} tagCol={col1} gradient={PH_GRADIENTS[3]} />
          <PlaceholderCard title={`10 things you missed this week`} channel="Catch Up" tag={topCat1} tagCol={col1} gradient={PH_GRADIENTS[4]} />
        </div>
      </div>

      {/* ── Popular in second category ── */}
      <div className="feed-section">
        <div className="feed-section-header">
          <div className="feed-section-left">
            <span className="feed-section-title">Popular in {topCat2}</span>
            <span className="feed-section-count">5 videos</span>
          </div>
          <button className="feed-section-link">See more</button>
        </div>
        <div className="feed-scroll-row">
          <PlaceholderCard title={`Best of ${topCat2} this month`} channel="Curator" tag={topCat2} tagCol={col2} gradient={PH_GRADIENTS[5]} isNew />
          <PlaceholderCard title={`${topCat2} creator spotlight`} channel="Spotlight" tag={topCat2} tagCol={col2} gradient={PH_GRADIENTS[6]} />
          <PlaceholderCard title={`The ${topCat2.toLowerCase()} video that broke the internet`} channel="Viral Moments" tag={topCat2} tagCol={col2} gradient={PH_GRADIENTS[7]} />
          <PlaceholderCard title={`Hidden gems in ${topCat2.toLowerCase()}`} channel="Undiscovered" tag={topCat2} tagCol={col2} gradient={PH_GRADIENTS[8]} isNew />
          <PlaceholderCard title={`${topCat2} vs everything — who wins?`} channel="Versus" tag={topCat2} tagCol={col2} gradient={PH_GRADIENTS[9]} />
        </div>
      </div>

      {/* ── Based on your favourites ── */}
      <div className="feed-section">
        <div className="feed-section-header">
          <div className="feed-section-left">
            <div className="feed-section-icon">
              <svg viewBox="0 0 16 16"><path d="M8 2l1.8 3.7 4 .6-2.9 2.8.7 4L8 11.2 4.4 13.1l.7-4-2.9-2.8 4-.6z" /></svg>
            </div>
            <span className="feed-section-title">Based on your favourites</span>
            <span className="feed-section-count">5 suggestions</span>
          </div>
        </div>
        <div className="feed-scroll-row">
          <PlaceholderCard title="Because you watch creators like this" channel="Recommended" tag="Favourites" tagCol="var(--accent)" gradient={PH_GRADIENTS[2]} />
          <PlaceholderCard title="Similar vibe, different creator" channel="Discovery" tag="Favourites" tagCol="var(--accent)" gradient={PH_GRADIENTS[4]} />
          <PlaceholderCard title="You might have missed this one" channel="Hidden Gem" tag="Favourites" tagCol="var(--accent)" gradient={PH_GRADIENTS[6]} />
          <PlaceholderCard title="Trending in your favourite topics" channel="Trending" tag="Favourites" tagCol="var(--accent)" gradient={PH_GRADIENTS[8]} isNew />
          <PlaceholderCard title="New upload from a channel you'd like" channel="Fresh" tag="Favourites" tagCol="var(--accent)" gradient={PH_GRADIENTS[0]} isNew />
        </div>
      </div>

      {/* ── Amygdala scrub ── */}
      {!breakDismissed && (
        <div className="feed-break-card">
          <div className="feed-break-top">
            <div className="feed-break-top-inner">
              <div className="feed-break-icon">
                <svg viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 14c3.3 0 6-2.2 6-5s-2.7-5-6-5-6 2.2-6 5c0 1.2.5 2.3 1.3 3.2L2 14l3.2-1c.9.4 1.8.6 2.8.6z" />
                </svg>
              </div>
              <div className="feed-break-text">
                <div className="feed-break-title">Amygdala scrub</div>
                <div className="feed-break-msg">
                  You&apos;ve been scrolling for a while. Take a breath. Here are some <strong>calming picks</strong> to reset.
                </div>
              </div>
            </div>
            <button className="feed-break-dismiss" onClick={() => setBreakDismissed(true)}>✕</button>
          </div>
          <div className="feed-break-videos">
            <div className="feed-break-vid">
              <div className="feed-break-vid-thumb">
                <div className="feed-ph-thumb feed-ph-emoji" style={{ background: 'linear-gradient(135deg,#3a6f3a,#2a5f2a)' }}>
                  <span>🌿</span>
                </div>
              </div>
              <div className="feed-break-vid-info">
                <div className="feed-break-vid-title">Calm Morning in a Japanese Garden</div>
                <div className="feed-break-vid-channel">Peaceful Spaces</div>
              </div>
            </div>
            <div className="feed-break-vid">
              <div className="feed-break-vid-thumb">
                <div className="feed-ph-thumb feed-ph-emoji" style={{ background: 'linear-gradient(135deg,#6f5a2a,#5f4a1a)' }}>
                  <span>🐕</span>
                </div>
              </div>
              <div className="feed-break-vid-info">
                <div className="feed-break-vid-title">Golden Retriever Tries 15 Foods</div>
                <div className="feed-break-vid-channel">Tucker Budzyn</div>
              </div>
            </div>
            <div className="feed-break-vid">
              <div className="feed-break-vid-thumb">
                <div className="feed-ph-thumb feed-ph-emoji" style={{ background: 'linear-gradient(135deg,#4a4a6f,#3a3a5f)' }}>
                  <span>🎨</span>
                </div>
              </div>
              <div className="feed-break-vid-info">
                <div className="feed-break-vid-title">Bob Ross — Happy Little Mountains</div>
                <div className="feed-break-vid-channel">Bob Ross</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Try something new ── */}
      <div className="feed-section">
        <div className="feed-section-header">
          <div className="feed-section-left">
            <span className="feed-section-title">Try something new</span>
            <span className="feed-section-count">5 picks</span>
          </div>
          <button className="feed-section-link">Refresh</button>
        </div>
        <div className="feed-scroll-row">
          <PlaceholderCard title="A genre you've never explored" channel="New Horizons" tag="Explore" gradient={PH_GRADIENTS[9]} />
          <PlaceholderCard title="Outside your usual bubble" channel="Perspective Shift" tag="Explore" gradient={PH_GRADIENTS[7]} />
          <PlaceholderCard title="Creators from a different world" channel="Global Voices" tag="Explore" gradient={PH_GRADIENTS[5]} />
          <PlaceholderCard title="Short watch, big impact" channel="Quick Hits" tag="Explore" gradient={PH_GRADIENTS[3]} />
          <PlaceholderCard title="This channel just started blowing up" channel="Rising Star" tag="Explore" gradient={PH_GRADIENTS[1]} isNew />
        </div>
      </div>
    </main>
  );
}
