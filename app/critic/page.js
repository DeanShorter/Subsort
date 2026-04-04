'use client';
import { useState, useMemo } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { useStash } from '../../hooks/useStash';
import { calculateHealthScore, buildHealthScoreInput } from '../../lib/health-score';
import Link from 'next/link';

// ── Domain definitions ──
const DOMAINS = [
  { key: 'categories', label: 'Categories', icon: <path d="M2 4h10M4 7h6M6 10h2" /> },
  { key: 'channel_health', label: 'Channel Health', icon: <><circle cx="7" cy="7" r="5" /><path d="M7 4.5v3l2 1.5" /></> },
  { key: 'stash', label: 'Stash', icon: <><rect x="2" y="3" width="10" height="8" rx="1.5" /><path d="M5 7l2 2 3-3" /></> },
  { key: 'feed', label: 'Feed', icon: <path d="M2 10l3-4 2 2 3-5 2 3" /> },
  { key: 'behaviour', label: 'Behaviour', icon: <><circle cx="7" cy="7" r="5" /><path d="M7 4v3h3" /></> },
  { key: 'data', label: 'Data', icon: <><path d="M1 7h3l2-4 2 8 2-4h4" /></> },
];

const MENU_ITEMS = [
  { key: 'overview', label: 'Overview', icon: 'grid' },
  { key: 'divider1' },
  { key: 'actions', label: 'Actions', dot: 'var(--orange)', soft: 'var(--orange-soft)', text: 'var(--orange-text)' },
  { key: 'suggestions', label: 'Suggestions', dot: 'var(--accent)', soft: 'var(--accent-soft)', text: 'var(--accent-text)' },
  { key: 'observations', label: 'Observations', dot: 'var(--iris)', soft: 'var(--iris-soft)', text: 'var(--iris-text)' },
  { key: 'divider2' },
  { key: 'dismissed', label: 'Dismissed', muted: true },
  { key: 'snoozed', label: 'Snoozed', muted: true },
];

export default function CriticPage() {
  const { user } = useAuth();
  const { channels, categories, subcategories, chIsUncategorised, getChannelState, feedVideos, loading } = useChannelData();
  const { items: stashItems, collections: stashCollections } = useStash(user);
  const [activeView, setActiveView] = useState('overview');

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  // ── Compute recommendations from channel data ──
  const recs = useMemo(() => {
    if (!channels.length) return { actions: [], suggestions: [], observations: [], byDomain: {} };

    const actions = [];
    const suggestions = [];
    const observations = [];

    // Categories domain
    const uncatCount = channels.filter(c => chIsUncategorised(c)).length;
    if (uncatCount > 0) {
      actions.push({
        domain: 'categories', priority: 'high', affectedCount: uncatCount,
        title: `"${uncatCount} channel${uncatCount !== 1 ? 's' : ''} with no category. That's a messy drawer. Let me sort ${uncatCount === 1 ? 'it' : 'them'}."`,
        cta: 'Auto-sort', ctaHref: '/subscriptions',
      });
    }
    const emptyCats = categories.filter(cat => !channels.some(c => (c.categories || []).includes(cat)));
    if (emptyCats.length > 0) {
      suggestions.push({
        domain: 'categories', priority: 'medium', affectedCount: emptyCats.length,
        title: `"${emptyCats.length} empty categor${emptyCats.length !== 1 ? 'ies' : 'y'}: ${emptyCats.slice(0, 3).join(', ')}${emptyCats.length > 3 ? '...' : ''}. Either fill them or delete them."`,
        cta: 'Manage categories', ctaHref: '/subscriptions',
      });
    }

    // Channel health domain
    const deadChannels = channels.filter(c => getChannelState(c) === 'dead');
    if (deadChannels.length > 0) {
      actions.push({
        domain: 'channel_health', priority: 'high', affectedCount: deadChannels.length,
        title: `"${deadChannels.length} dead channel${deadChannels.length !== 1 ? 's' : ''} in your list. No uploads, low activity. Dead weight."`,
        cta: 'Review', ctaHref: '/subscriptions',
        channels: deadChannels.slice(0, 5),
      });
    }
    const inactiveChannels = channels.filter(c => getChannelState(c) === 'inactive');
    if (inactiveChannels.length > 0) {
      suggestions.push({
        domain: 'channel_health', priority: 'medium', affectedCount: inactiveChannels.length,
        title: `"${inactiveChannels.length} channel${inactiveChannels.length !== 1 ? 's have' : ' has'} gone quiet. No recent uploads. Worth checking in on."`,
        cta: 'Review', ctaHref: '/subscriptions',
        channels: inactiveChannels.slice(0, 5),
      });
    }

    // Behaviour domain
    const longSubs = channels.filter(c => {
      if (!c.subscribedAt) return false;
      return (Date.now() - new Date(c.subscribedAt).getTime()) > 7 * 365 * 24 * 60 * 60 * 1000;
    });
    if (longSubs.length > 0) {
      observations.push({
        domain: 'behaviour', priority: 'low', affectedCount: longSubs.length,
        title: `"${longSubs.length} channel${longSubs.length !== 1 ? 's' : ''} subscribed for 7+ years. That's loyalty. But do you still watch them?"`,
        cta: 'Review', ctaHref: '/subscriptions',
      });
    }

    // Favourites
    const inactiveFavs = channels.filter(c => c.favourited && getChannelState(c) !== 'active');
    if (inactiveFavs.length > 0) {
      suggestions.push({
        domain: 'behaviour', priority: 'medium', affectedCount: inactiveFavs.length,
        title: `"${inactiveFavs.length} of your favourites ${inactiveFavs.length !== 1 ? 'are' : 'is'} inactive or dead. Still deserving of that star?"`,
        cta: 'Review favourites', ctaHref: '/subscriptions',
      });
    }

    // Data domain
    const hasWatchHistory = typeof window !== 'undefined' && !!localStorage.getItem('subsort_watchhistory');
    if (!hasWatchHistory) {
      suggestions.push({
        domain: 'data', priority: 'medium', affectedCount: 1,
        title: '"Upload your watch history and I can tell you which channels you actually watch. Right now I\'m just guessing."',
        cta: 'Upload in Settings', ctaHref: '/settings',
      });
    }

    // Group by domain
    const all = [...actions, ...suggestions, ...observations];
    const byDomain = {};
    for (const d of DOMAINS) byDomain[d.key] = [];
    for (const r of all) {
      if (byDomain[r.domain]) byDomain[r.domain].push(r);
    }

    return { actions, suggestions, observations, byDomain };
  }, [channels, categories, chIsUncategorised, getChannelState]);

  // Health score from shared utility
  const healthResult = useMemo(() => {
    if (!channels.length) return calculateHealthScore({
      totalChannels: 0, categorisedChannels: 0, subcategorisedChannels: 0, eligibleForSubcategory: 0,
      activeChannels: 0, deadChannels: 0, inactiveChannels: 0, hasEmptyCategories: false,
      maxCategoryPercentage: 0, feedDominanceExceeded: false, feedCategoryRatio: 1,
      hasSufficientFeedData: false, totalWatchLaterItems: 0, staleWatchLaterItems: 0,
      hasEmptyCollections: false, hasStaleCollections: false, hasUsedStash: false,
      watchDataAgeDays: null,
    }, userName, 0);
    const { input, needAttentionCount } = buildHealthScoreInput(
      channels, categories, subcategories, chIsUncategorised, getChannelState,
      feedVideos, stashItems, stashCollections
    );
    return calculateHealthScore(input, userName, needAttentionCount);
  }, [channels, categories, subcategories, chIsUncategorised, getChannelState, feedVideos, stashItems, stashCollections, userName]);

  const healthScore = healthResult.total;
  const mood = healthResult.mood === 'green'
    ? { color: 'var(--accent)', soft: 'var(--accent-soft)', text: 'var(--accent-text)' }
    : { color: 'var(--orange)', soft: 'var(--orange-soft)', text: 'var(--orange-text)' };
  const activeCount = healthResult.counts.activeChannels;
  const needAttentionCount = healthResult.counts.needAttention;
  const totalRecs = recs.actions.length + recs.suggestions.length + recs.observations.length;

  if (loading) return <div className="home-feed-loading"><span className="spinner" /> Loading...</div>;

  const renderRecItem = (rec, i) => {
    const priorityColor = rec.priority === 'high' ? 'var(--orange)' : rec.priority === 'medium' ? 'var(--accent)' : 'var(--iris)';
    const prioritySoft = rec.priority === 'high' ? 'var(--orange-soft)' : rec.priority === 'medium' ? 'var(--accent-soft)' : 'var(--iris-soft)';
    const priorityText = rec.priority === 'high' ? 'var(--orange-text)' : rec.priority === 'medium' ? 'var(--accent-text)' : 'var(--iris-text)';
    return (
      <div key={i} className="cr-rec-item">
        <div className="cr-rec-icon tex-pinstripe" style={{ background: priorityColor }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3 3 .4-2.2 2.1.5 3L6 8l-2.8 1.5.5-3L1.5 4.4l3-.4z" fill="#fff" /></svg>
        </div>
        <div className="cr-rec-content">
          <div className="cr-rec-domain" style={{ color: priorityText }}>{rec.domain.replace('_', ' ').toUpperCase()}</div>
          <div className="cr-rec-title" style={{ color: priorityText }}>{rec.title}</div>
          {rec.channels && (
            <div className="cr-rec-channels">
              {rec.channels.map(ch => (
                <div key={ch.id} className="cr-rec-channel">
                  <div className="cr-rec-ch-av">{ch.thumbnail ? <img src={ch.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (ch.name || '??').substring(0, 2).toUpperCase()}</div>
                  <span>{ch.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="cr-rec-actions">
            {rec.cta && <Link href={rec.ctaHref || '#'} className="cr-rec-cta" style={{ background: priorityColor }}>{rec.cta}</Link>}
            <button className="cr-rec-dismiss">Dismiss</button>
            <button className="cr-rec-snooze">Snooze</button>
          </div>
        </div>
      </div>
    );
  };

  const currentItems = activeView === 'overview' ? null
    : activeView === 'actions' ? recs.actions
    : activeView === 'suggestions' ? recs.suggestions
    : activeView === 'observations' ? recs.observations
    : activeView === 'dismissed' ? []
    : activeView === 'snoozed' ? []
    : null;

  const viewLabel = activeView === 'overview' ? 'Overview'
    : activeView === 'actions' ? 'Actions'
    : activeView === 'suggestions' ? 'Suggestions'
    : activeView === 'observations' ? 'Observations'
    : activeView === 'dismissed' ? 'Dismissed'
    : activeView === 'snoozed' ? 'Snoozed'
    : 'Overview';

  return (
    <div className="cr-layout">
      {/* Side menu */}
      <div className="cr-side-menu">
        <div className="cr-side-head">The Critic</div>
        {MENU_ITEMS.map(item => {
          if (item.key.startsWith('divider')) return <div key={item.key} className="cr-side-divider" />;
          const count = item.key === 'overview' ? totalRecs
            : item.key === 'actions' ? recs.actions.length
            : item.key === 'suggestions' ? recs.suggestions.length
            : item.key === 'observations' ? recs.observations.length
            : item.key === 'dismissed' ? 0
            : item.key === 'snoozed' ? 0
            : 0;
          return (
            <button
              key={item.key}
              className={`cr-side-item${activeView === item.key ? ' active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              <div className="cr-side-item-left">
                {item.icon === 'grid' ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".5" /><rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor" opacity=".3" /><rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".3" /><rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor" opacity=".5" /></svg>
                ) : item.muted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round">
                    {item.key === 'dismissed' ? <path d="M4 4l6 6M10 4l-6 6" /> : <><circle cx="7" cy="7" r="5" /><path d="M7 4v3h3" /></>}
                  </svg>
                ) : (
                  <div className="cr-side-dot" style={{ background: item.dot }} />
                )}
                <span>{item.label}</span>
              </div>
              {count > 0 && (
                <span className="cr-side-badge" style={item.soft ? { background: item.soft, color: item.text } : {}}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <Link href="/settings" className="cr-side-settings">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><circle cx="7" cy="7" r="2.5" /><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M11.2 2.8l-1.4 1.4M4.2 9.8l-1.4 1.4" /></svg>
          Cleanup settings
        </Link>
      </div>

      {/* Main content */}
      <div className="cr-main">
        <div className="cr-topbar">
          <span className="cr-breadcrumb">{viewLabel}</span>
        </div>

        <div className="cr-content">
          {/* Overview view */}
          {activeView === 'overview' && (
            <>
              {/* Health score card */}
              <div className="cr-health-card" style={{ '--cr-mood': mood.color }}>
                <div className="cr-health-head tex-pinstripe" style={{ background: mood.color }}>
                  <div className="cr-health-score-ring">
                    <span>{healthScore}</span>
                  </div>
                  <div className="cr-health-head-text">
                    <div className="cr-health-label">SUBSCRIPTION HEALTH</div>
                    <div className="cr-health-title">{healthResult.title}</div>
                    <div className="cr-health-quote">{healthResult.quote}</div>
                  </div>
                </div>
                <div className="cr-health-body">
                  <div className="cr-health-stats">
                    <div className="cr-health-stat" style={{ background: 'var(--accent-soft)' }}>
                      <span className="cr-health-stat-val" style={{ color: 'var(--accent)' }}>{activeCount}</span>
                      <span className="cr-health-stat-lbl" style={{ color: 'var(--accent-text)' }}>active</span>
                    </div>
                    <div className="cr-health-stat" style={{ background: 'var(--orange-soft)' }}>
                      <span className="cr-health-stat-val" style={{ color: 'var(--orange)' }}>{needAttentionCount}</span>
                      <span className="cr-health-stat-lbl" style={{ color: 'var(--orange-text)' }}>need attention</span>
                    </div>
                    <div className="cr-health-stat" style={{ background: 'var(--iris-soft)' }}>
                      <span className="cr-health-stat-val" style={{ color: 'var(--iris)' }}>{categories.length}</span>
                      <span className="cr-health-stat-lbl" style={{ color: 'var(--iris-text)' }}>categories</span>
                    </div>
                    <div className="cr-health-stat" style={{ background: 'var(--bg-primary)' }}>
                      <span className="cr-health-stat-val">{channels.length}</span>
                      <span className="cr-health-stat-lbl">total subs</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain summary cards */}
              <div className="cr-section-title">Cleanup Domains</div>
              <div className="cr-domain-grid">
                {DOMAINS.map(d => {
                  const items = recs.byDomain[d.key] || [];
                  const topItem = items[0];
                  const totalAffected = items.reduce((sum, r) => sum + (r.affectedCount || 0), 0);
                  const domainColor = topItem
                    ? (topItem.priority === 'high' ? 'var(--orange)' : topItem.priority === 'medium' ? 'var(--accent)' : 'var(--iris)')
                    : 'var(--accent)';
                  const domainSoft = topItem
                    ? (topItem.priority === 'high' ? 'var(--orange-soft)' : topItem.priority === 'medium' ? 'var(--accent-soft)' : 'var(--iris-soft)')
                    : 'var(--accent-soft)';
                  return (
                    <div key={d.key} className="cr-domain-card">
                      <div className="cr-domain-header">
                        <span className="cr-domain-name">{d.label}</span>
                        <div className="cr-domain-icon" style={{ background: domainSoft }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={domainColor} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">{d.icon}</svg>
                        </div>
                      </div>
                      <div className="cr-domain-count" style={{ color: totalAffected ? domainColor : 'var(--accent)' }}>{totalAffected}</div>
                      <div className="cr-domain-label">{totalAffected ? 'items to review' : 'all clear'}</div>
                      <div className="cr-domain-items">
                        {items.length > 0 ? items.slice(0, 3).map((r, i) => {
                          const dotCol = r.priority === 'high' ? 'var(--orange)' : r.priority === 'medium' ? 'var(--accent)' : 'var(--iris)';
                          return <div key={i} className="cr-domain-item"><div className="cr-domain-item-dot" style={{ background: dotCol }} /><span className="cr-domain-item-text">{r.title.replace(/"/g, '')}</span></div>;
                        }) : (
                          <div className="cr-domain-item"><div className="cr-domain-item-dot" style={{ background: 'var(--accent)' }} /><span className="cr-domain-item-text">{d.label} is healthy</span></div>
                        )}
                        {items.length > 3 && <span className="cr-domain-see-more">see more</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Top picks */}
              {totalRecs > 0 && (
                <>
                  <div className="cr-section-title">The Critic&rsquo;s Top Picks</div>
                  <div className="cr-top-picks">
                    {[...recs.actions, ...recs.suggestions, ...recs.observations].slice(0, 3).map((r, i) => renderRecItem(r, i))}
                  </div>
                </>
              )}
            </>
          )}

          {/* Filtered views */}
          {currentItems && (
            currentItems.length > 0 ? (
              <div className="cr-rec-list">
                {currentItems.map((r, i) => renderRecItem(r, i))}
              </div>
            ) : (
              <div className="cr-empty">
                <div className="cr-empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3 6 6.5 1-4.7 4.6 1.1 6.4L12 17l-5.9 3 1.1-6.4L2.5 9l6.5-1z" /></svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
                  {activeView === 'actions' && "Nothing urgent. That's a good thing."}
                  {activeView === 'suggestions' && "No suggestions at the moment. Check back later."}
                  {activeView === 'observations' && "Nothing to observe right now. Your subscriptions are running smoothly."}
                  {activeView === 'dismissed' && "No dismissed items."}
                  {activeView === 'snoozed' && "No snoozed items."}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
