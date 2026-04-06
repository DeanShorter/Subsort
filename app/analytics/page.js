'use client';
import { useMemo } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { trackEvent } from '../../lib/track';
import Link from 'next/link';

// ── Archetype calculation ──
function calculateArchetype(channels, categories, subcategories, chCats, chIsUncategorised) {
  const activeChannels = channels.filter(c => c.isActive !== false);
  const total = activeChannels.length;
  if (total < 10) return { name: 'The Viewer', description: `A growing library with ${total} channels. Subscribe to more and your viewing personality will take shape.` };

  // Category distribution
  const catCounts = {};
  activeChannels.forEach(c => {
    const cats = chCats(c);
    if (cats[0]) catCounts[cats[0]] = (catCounts[cats[0]] || 0) + 1;
  });
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCats[0];
  const topCatPct = topCat ? Math.round((topCat[1] / total) * 100) : 0;
  const catCount = sortedCats.length;

  // Tenure
  const now = Date.now();
  const tenures = activeChannels.filter(c => c.subscribedAt).map(c => (now - new Date(c.subscribedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const avgTenure = tenures.length ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;

  // Recent additions (last 6 months)
  const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000;
  const recentPct = activeChannels.filter(c => c.subscribedAt && new Date(c.subscribedAt).getTime() > sixMonthsAgo).length / total * 100;

  // Subcategorised percentage
  const subcatPct = Math.round(activeChannels.filter(c => c.subcategory).length / total * 100);

  // Burst detection (50%+ in a 3-month window)
  const monthBuckets = {};
  activeChannels.forEach(c => {
    if (!c.subscribedAt) return;
    const d = new Date(c.subscribedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthBuckets[key] = (monthBuckets[key] || 0) + 1;
  });

  // Evaluate in priority order
  if (topCatPct >= 60) {
    return { name: 'The Specialist', description: `You know what you like. ${topCat[0]} dominates your library.` };
  }
  if (catCount >= 8 && topCatPct <= 25) {
    return { name: 'The Explorer', description: `Curious about everything. Your library covers ${catCount} categories.` };
  }
  if (avgTenure >= 3 && recentPct <= 10) {
    return { name: 'The Loyalist', description: `You find your channels and you stick with them. Average tenure: ${avgTenure.toFixed(1)} years.` };
  }
  if (subcatPct >= 80) {
    return { name: 'The Curator', description: `Organised down to the detail. ${subcatPct}% of your channels have subcategories.` };
  }
  if (total >= 200) {
    return { name: 'The Collector', description: `You subscribe to a lot — and most of them are still active.` };
  }

  return { name: 'The Viewer', description: `A balanced library with ${total} channels across ${catCount} categories.` };
}

export default function InsightsPage() {
  const { user, userTier } = useAuth();
  const {
    channels, categories, subcategories, categoryColours,
    chCats, chIsUncategorised, getChannelState, formatCount,
    feedVideos, loading,
  } = useChannelData();

  const isPro = userTier === 'pro' || userTier === 'admin';
  const activeChannels = useMemo(() => channels.filter(c => c.isActive !== false), [channels]);

  // Archetype
  const archetype = useMemo(() => {
    return calculateArchetype(channels, categories, subcategories, chCats, chIsUncategorised);
  }, [channels, categories, subcategories, chCats, chIsUncategorised]);

  // Stat pills
  const stats = useMemo(() => {
    if (!activeChannels.length) return null;
    const catCounts = {};
    activeChannels.forEach(c => { const cats = chCats(c); if (cats[0]) catCounts[cats[0]] = (catCounts[cats[0]] || 0) + 1; });
    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0];
    const topPct = topCat ? Math.round((topCat[1] / activeChannels.length) * 100) : 0;
    const tenures = activeChannels.filter(c => c.subscribedAt).map(c => (Date.now() - new Date(c.subscribedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const avgTenure = tenures.length ? (tenures.reduce((a, b) => a + b, 0) / tenures.length).toFixed(1) : '—';
    const catCount = new Set(activeChannels.flatMap(c => chCats(c)).filter(Boolean)).size;
    return { topCat: topCat?.[0] || '—', topPct, avgTenure, catCount };
  }, [activeChannels, chCats]);

  // Category composition
  const composition = useMemo(() => {
    const catCounts = {};
    activeChannels.forEach(c => { const cats = chCats(c); const cat = cats[0] || 'Unsorted'; catCounts[cat] = (catCounts[cat] || 0) + 1; });
    const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;
    return sorted.map(([name, count]) => ({ name, count, pct: Math.round((count / activeChannels.length) * 100), barPct: (count / max) * 100, color: categoryColours[name] || 'var(--accent)' }));
  }, [activeChannels, chCats, categoryColours]);

  // Subscription timeline
  const timeline = useMemo(() => {
    const yearCounts = {};
    activeChannels.forEach(c => {
      if (!c.subscribedAt) return;
      const y = new Date(c.subscribedAt).getFullYear();
      if (!isNaN(y) && y >= 2005) yearCounts[y] = (yearCounts[y] || 0) + 1;
    });
    const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
    const max = Math.max(...Object.values(yearCounts), 1);
    return years.map(y => ({ year: y, count: yearCounts[y], pct: (yearCounts[y] / max) * 100 }));
  }, [activeChannels]);

  // Channel activity
  const activity = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeIds = new Set(activeChannels.map(c => c.channelId));
    const weeklyVids = feedVideos.filter(v => v.publishedAt && new Date(v.publishedAt).getTime() >= weekAgo && activeIds.has(v.channelId));
    const weeklyChannels = new Set(weeklyVids.map(v => v.channelId)).size;
    return { vidsThisWeek: weeklyVids.length, channelsThisWeek: weeklyChannels };
  }, [activeChannels, feedVideos]);

  // Upload frequency
  const frequency = useMemo(() => {
    const buckets = { Daily: 0, 'Several/week': 0, Weekly: 0, Fortnightly: 0, Monthly: 0, Rarely: 0, Inactive: 0 };
    activeChannels.forEach(c => {
      const state = getChannelState(c);
      if (state === 'dead') { buckets.Inactive++; return; }
      const vids = feedVideos.filter(v => v.channelId === c.channelId && v.publishedAt);
      if (vids.length < 2) { buckets.Rarely++; return; }
      const sorted = vids.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      const newest = new Date(sorted[0].publishedAt);
      const oldest = new Date(sorted[sorted.length - 1].publishedAt);
      const days = (newest - oldest) / (1000 * 60 * 60 * 24);
      if (days <= 0) { buckets.Rarely++; return; }
      const perWeek = (vids.length - 1) / (days / 7);
      if (perWeek >= 5) buckets.Daily++;
      else if (perWeek >= 2) buckets['Several/week']++;
      else if (perWeek >= 0.8) buckets.Weekly++;
      else if (perWeek >= 0.4) buckets.Fortnightly++;
      else if (perWeek >= 0.1) buckets.Monthly++;
      else buckets.Rarely++;
    });
    const max = Math.max(...Object.values(buckets), 1);
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, count]) => ({ name, count, pct: (count / max) * 100 }));
  }, [activeChannels, feedVideos, getChannelState]);

  // Content balance (this week)
  const contentBalance = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeIds = new Set(activeChannels.map(c => c.channelId));
    const weeklyVids = feedVideos.filter(v => v.publishedAt && new Date(v.publishedAt).getTime() >= weekAgo && activeIds.has(v.channelId));
    const catCounts = {};
    weeklyVids.forEach(v => {
      const ch = activeChannels.find(c => c.channelId === v.channelId);
      if (ch) { const cat = chCats(ch)[0] || 'Unsorted'; catCounts[cat] = (catCounts[cat] || 0) + 1; }
    });
    const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const total = weeklyVids.length || 1;
    return sorted.map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100), color: categoryColours[name] || '#888' }));
  }, [activeChannels, feedVideos, chCats, categoryColours]);

  // Loyalty profile
  const loyalty = useMemo(() => {
    const now = Date.now();
    const tiers = { OG: 0, Veteran: 0, Established: 0, Recent: 0, New: 0 };
    activeChannels.forEach(c => {
      if (!c.subscribedAt) return;
      const years = (now - new Date(c.subscribedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (years >= 5) tiers.OG++;
      else if (years >= 2) tiers.Veteran++;
      else if (years >= 1) tiers.Established++;
      else if (years >= 0.25) tiers.Recent++;
      else tiers.New++;
    });
    const longest = [...activeChannels].filter(c => c.subscribedAt).sort((a, b) => new Date(a.subscribedAt) - new Date(b.subscribedAt)).slice(0, 5);
    const newest = [...activeChannels].filter(c => c.subscribedAt).sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt)).slice(0, 5);
    return { tiers, longest, newest };
  }, [activeChannels]);

  if (loading) return <div className="home-feed-loading"><span className="spinner" /> Loading insights...</div>;

  if (!user) return (
    <div className="ins-page">
      <div className="ins-header"><h1 className="ins-title">Insights</h1></div>
      <div className="home-feed-empty"><button className="btn-accent" onClick={() => {}}>Sign in</button></div>
    </div>
  );

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—';
  const yearsSince = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

  return (
    <div className="ins-page">
      <div className="ins-header"><h1 className="ins-title">Insights</h1></div>

      <div className="ins-content">
        {/* Personality Card */}
        <div className="ins-personality">
          <div className="ins-personality-label">YOUR VIEWING PERSONALITY</div>
          <div className="ins-archetype">{archetype.name}</div>
          <div className="ins-archetype-desc">&ldquo;{archetype.description}&rdquo;</div>
          {stats && (
            <div className="ins-personality-stats">
              <div className="ins-pstat"><div className="ins-pstat-val">{activeChannels.length}</div><div className="ins-pstat-lbl">channels</div></div>
              <div className="ins-pstat"><div className="ins-pstat-val">{stats.topPct}%</div><div className="ins-pstat-lbl">{stats.topCat}</div></div>
              <div className="ins-pstat"><div className="ins-pstat-val">{stats.avgTenure}</div><div className="ins-pstat-lbl">avg years</div></div>
              <div className="ins-pstat"><div className="ins-pstat-val">{stats.catCount}</div><div className="ins-pstat-lbl">categories</div></div>
            </div>
          )}
        </div>

        {/* Subscription Composition */}
        <div className="ins-section">
          <div className="ins-section-title">Subscription Composition</div>
          <div className="ins-comp-chart">
            {composition.map(c => (
              <div key={c.name} className="ins-comp-row">
                <span className="ins-comp-label">{c.name}</span>
                <div className="ins-comp-bar-wrap"><div className="ins-comp-bar" style={{ width: `${c.barPct}%`, background: c.color }} /></div>
                <span className="ins-comp-pct">{c.pct}%</span>
                <span className="ins-comp-count">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Timeline */}
        {timeline.length > 0 && (
          <div className="ins-section">
            <div className="ins-section-title">Subscription Timeline</div>
            <div className="ins-timeline-chart">
              {timeline.map(t => (
                <div key={t.year} className="ins-tl-row">
                  <span className="ins-tl-year">{t.year}</span>
                  <div className="ins-tl-bar-wrap"><div className="ins-tl-bar" style={{ width: `${t.pct}%` }} /><span className="ins-tl-count">{t.count}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Channel Activity */}
        <div className="ins-section">
          <div className="ins-section-title">Channel Activity</div>
          <div className="ins-activity-stats">
            <div className="ins-astat"><div className="ins-astat-val">{activity.channelsThisWeek}</div><div className="ins-astat-lbl">channels uploaded this week</div></div>
            <div className="ins-astat"><div className="ins-astat-val">{activity.vidsThisWeek}</div><div className="ins-astat-lbl">videos this week</div></div>
          </div>
        </div>

        {/* Upload Frequency */}
        {frequency.length > 0 && (
          <div className="ins-section">
            <div className="ins-section-title">Upload Frequency</div>
            <div className="ins-freq-chart">
              {frequency.map(f => (
                <div key={f.name} className="ins-freq-row">
                  <span className="ins-freq-label">{f.name}</span>
                  <div className="ins-freq-bar-wrap"><div className="ins-freq-bar" style={{ width: `${f.pct}%` }} /></div>
                  <span className="ins-freq-count">{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Balance */}
        {contentBalance.length > 0 && (
          <div className="ins-section">
            <div className="ins-section-title">Content Balance (This Week)</div>
            <div className="ins-balance">
              {contentBalance.map(c => (
                <div key={c.name} className="ins-balance-row">
                  <span className="ins-balance-dot" style={{ background: c.color }} />
                  <span className="ins-balance-name">{c.name}</span>
                  <span className="ins-balance-pct">{c.pct}%</span>
                  <span className="ins-balance-count">{c.count} videos</span>
                </div>
              ))}
              {contentBalance[0]?.pct >= 70 && <div className="ins-balance-note">{contentBalance[0].name} made up {contentBalance[0].pct}% of your feed this week.</div>}
            </div>
          </div>
        )}

        {/* Loyalty Profile (Pro) */}
        <div className={`ins-section${!isPro ? ' ins-locked' : ''}`}>
          <div className="ins-section-title">Loyalty Profile {!isPro && <span className="ins-pro-badge">PRO</span>}</div>
          {!isPro && (
            <div className="ins-lock-overlay">
              <div className="ins-lock-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="8" width="11" height="8" rx="2" stroke="var(--iris)" strokeWidth="1.3" /><path d="M6 8V6a3 3 0 016 0v2" stroke="var(--iris)" strokeWidth="1.3" strokeLinecap="round" /></svg>
              </div>
              <div className="ins-lock-text">Upgrade to Pro for detailed loyalty insights</div>
              <Link href="/settings" className="ins-lock-cta">Upgrade to Pro</Link>
            </div>
          )}
          <div className={!isPro ? 'ins-blurred' : ''}>
            <div className="ins-loyalty-tiers">
              {Object.entries(loyalty.tiers).filter(([, v]) => v > 0).map(([name, count]) => (
                <div key={name} className="ins-loyalty-tier">
                  <div className="ins-loyalty-tier-val">{count}</div>
                  <div className="ins-loyalty-tier-lbl">{name}</div>
                </div>
              ))}
            </div>
            {loyalty.longest.length > 0 && (
              <>
                <div className="ins-loyalty-subtitle">Longest subscriptions</div>
                {loyalty.longest.map(ch => (
                  <div key={ch.id} className="ins-loyalty-ch">
                    <div className="ins-loyalty-av">{ch.thumbnail ? <img src={ch.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : (ch.name || '??').substring(0, 2).toUpperCase()}</div>
                    <span className="ins-loyalty-name">{ch.name}</span>
                    <span className="ins-loyalty-date">{fmtDate(ch.subscribedAt)} &middot; {yearsSince(ch.subscribedAt)} years</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
