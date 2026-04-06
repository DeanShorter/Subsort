'use client';
import { useMemo } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import { trackEvent } from '../../lib/track';
import Link from 'next/link';

// ── Archetype calculation ──
function calculateArchetype(channels, chCats) {
  const total = channels.length;
  if (total < 10) return { name: 'The Viewer', trigger: 'small' };

  const catCounts = {};
  channels.forEach(c => { const cats = chCats(c); if (cats[0]) catCounts[cats[0]] = (catCounts[cats[0]] || 0) + 1; });
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const topCatPct = sortedCats[0] ? Math.round((sortedCats[0][1] / total) * 100) : 0;
  const catCount = sortedCats.length;

  const now = Date.now();
  const tenures = channels.filter(c => c.subscribedAt).map(c => (now - new Date(c.subscribedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const avgTenure = tenures.length ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;
  const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60 * 1000;
  const recentPct = channels.filter(c => c.subscribedAt && new Date(c.subscribedAt).getTime() > sixMonthsAgo).length / total * 100;
  const subcatPct = Math.round(channels.filter(c => c.subcategory).length / total * 100);

  if (topCatPct >= 60) return { name: 'The Specialist' };
  if (catCount >= 8 && topCatPct <= 25) return { name: 'The Explorer' };
  if (avgTenure >= 3 && recentPct <= 10) return { name: 'The Loyalist' };
  if (subcatPct >= 80) return { name: 'The Curator' };
  if (total >= 200) return { name: 'The Collector' };
  return { name: 'The Viewer' };
}

// ── Archetype one-liners ──
const ONE_LINERS = {
  'The Specialist': (d) => `You know what you like. ${d.topCat} dominates your library.`,
  'The Explorer': (d) => `Curious about everything. Your library covers ${d.catCount} categories.`,
  'The Loyalist': (d) => `You find your channels and you stick with them. Average tenure: ${d.avgTenure} years.`,
  'The Curator': (d) => `Organised down to the detail. Your channels are meticulously categorised.`,
  'The Collector': (d) => `You subscribe to a lot — and most of them are still active.`,
  'The Viewer': (d) => `A balanced library with ${d.total} channels across ${d.catCount} categories.`,
};

// ── Narrative generation ──
function generateNarrative(archetype, d, isPro) {
  const { total, catCount, topCat, topPct, avgTenure, pace, spreeMonth, spreeCount, ogCount, vetCount } = d;
  if (!isPro) {
    switch (archetype) {
      case 'The Collector': return `With <strong>${total} channels</strong> across <strong>${catCount} categories</strong>, you've built one of the wider libraries we've seen. <strong>${topCat}</strong> leads at <strong>${topPct}%</strong>, but you haven't let any single interest take over — your library is broad and most of it is still active.`;
      case 'The Specialist': return `<strong>${topCat}</strong> makes up <strong>${topPct}%</strong> of your <strong>${total} channels</strong>. That's not accidental — you've built a library with a clear centre of gravity. The remaining <strong>${catCount - 1} categories</strong> fill in around the edges.`;
      case 'The Explorer': return `<strong>${total} channels</strong> spread across <strong>${catCount} categories</strong>, with no single category exceeding <strong>${topPct}%</strong>. You're not locked into one corner of YouTube — your library is a map of curiosity.`;
      case 'The Loyalist': return `Your <strong>${total} channels</strong> have an average tenure of <strong>${avgTenure} years</strong>. You find channels you trust, and you stay. <strong>${topCat}</strong> leads at <strong>${topPct}%</strong>, but across all categories, the pattern is the same.`;
      case 'The Curator': return `Not just categorised — <strong>subcategorised</strong>. Your <strong>${total} channels</strong> across <strong>${catCount} categories</strong> are meticulously organised. <strong>${topCat}</strong> leads at <strong>${topPct}%</strong>.`;
      default: return `A balanced library with <strong>${total} channels</strong> across <strong>${catCount} categories</strong>. <strong>${topCat}</strong> has a slight edge at <strong>${topPct}%</strong>, but no single interest dominates.`;
    }
  }
  // Pro narratives
  switch (archetype) {
    case 'The Collector': return `With <strong>${total} channels</strong> across <strong>${catCount} categories</strong>, you've built one of the wider libraries we've seen. <strong>${topCat}</strong> leads at <strong>${topPct}%</strong>, but you haven't let any single interest take over. You subscribe at about <strong>${pace}/month</strong>, with <strong>${spreeMonth}</strong> seeing <strong>${spreeCount} additions</strong>. Your average tenure is <strong>${avgTenure} years</strong> and <strong>${vetCount}</strong> channels have been with you for over 2 years.`;
    case 'The Specialist': return `<strong>${topCat}</strong> makes up <strong>${topPct}%</strong> of your <strong>${total} channels</strong>. That's a commitment. You subscribe at about <strong>${pace}/month</strong>, and <strong>${spreeMonth}</strong> was your biggest intake with <strong>${spreeCount} additions</strong>. Your average tenure of <strong>${avgTenure} years</strong> shows that once a channel earns a spot, it stays. <strong>${ogCount} channels</strong> have been with you for over 5 years.`;
    case 'The Explorer': return `<strong>${total} channels</strong> across <strong>${catCount} categories</strong>, with no single one exceeding <strong>${topPct}%</strong>. You subscribe at about <strong>${pace}/month</strong>. <strong>${spreeMonth}</strong> saw your biggest burst at <strong>${spreeCount} channels</strong>. With an average tenure of <strong>${avgTenure} years</strong> and <strong>${vetCount} veterans</strong>, you don't just explore — you settle in.`;
    case 'The Loyalist': return `Your <strong>${total} channels</strong> have an average tenure of <strong>${avgTenure} years</strong>. <strong>${ogCount}</strong> have been with you for over 5 years. You add rarely, at about <strong>${pace}/month</strong>. <strong>${topCat}</strong> leads at <strong>${topPct}%</strong> across <strong>${catCount} categories</strong>, but the loyalty runs across all of them.`;
    default: return `<strong>${total} channels</strong> across <strong>${catCount} categories</strong>. <strong>${topCat}</strong> at <strong>${topPct}%</strong>. You subscribe at <strong>${pace}/month</strong> with an average tenure of <strong>${avgTenure} years</strong>. <strong>${vetCount} channels</strong> have been with you for over 2 years.`;
  }
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

  // Core data for archetype + narrative
  const data = useMemo(() => {
    if (!channels.length) return null;
    const now = Date.now();
    const catCounts = {};
    channels.forEach(c => { const cats = chCats(c); if (cats[0]) catCounts[cats[0]] = (catCounts[cats[0]] || 0) + 1; });
    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0]?.[0] || '—';
    const topPct = sortedCats[0] ? Math.round((sortedCats[0][1] / channels.length) * 100) : 0;
    const catCount = sortedCats.length;
    const tenures = channels.filter(c => c.subscribedAt).map(c => (now - new Date(c.subscribedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const avgTenure = tenures.length ? (tenures.reduce((a, b) => a + b, 0) / tenures.length).toFixed(1) : '—';

    // Tenure tiers
    const ogCount = channels.filter(c => c.subscribedAt && (now - new Date(c.subscribedAt).getTime()) > 5 * 365.25 * 24 * 60 * 60 * 1000).length;
    const vetCount = channels.filter(c => c.subscribedAt && (now - new Date(c.subscribedAt).getTime()) > 2 * 365.25 * 24 * 60 * 60 * 1000 && (now - new Date(c.subscribedAt).getTime()) <= 5 * 365.25 * 24 * 60 * 60 * 1000).length;
    const recentCount = channels.filter(c => c.subscribedAt && (now - new Date(c.subscribedAt).getTime()) <= 2 * 365.25 * 24 * 60 * 60 * 1000 && (now - new Date(c.subscribedAt).getTime()) > 3 * 30 * 24 * 60 * 60 * 1000).length;
    const newCount = channels.filter(c => c.subscribedAt && (now - new Date(c.subscribedAt).getTime()) <= 3 * 30 * 24 * 60 * 60 * 1000).length;

    // Pace (last 12 months)
    const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
    const recentSubs = channels.filter(c => c.subscribedAt && new Date(c.subscribedAt).getTime() > yearAgo).length;
    const pace = (recentSubs / 12).toFixed(1);

    // Biggest spree
    const monthBuckets = {};
    const shortMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    channels.forEach(c => {
      if (!c.subscribedAt) return;
      const d = new Date(c.subscribedAt);
      const key = `${shortMonth[d.getMonth()]} ${d.getFullYear()}`;
      monthBuckets[key] = (monthBuckets[key] || 0) + 1;
    });
    const spreeEntries = Object.entries(monthBuckets).sort((a, b) => b[1] - a[1]);
    const spreeMonth = spreeEntries[0]?.[0] || '—';
    const spreeCount = spreeEntries[0]?.[1] || 0;

    // Longest subscription
    const sorted = [...channels].filter(c => c.subscribedAt).sort((a, b) => new Date(a.subscribedAt) - new Date(b.subscribedAt));
    const longest = sorted[0];
    const longestYears = longest ? Math.floor((now - new Date(longest.subscribedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    // Composition (top 5)
    const composition = sortedCats.slice(0, 5).map(([name, count]) => ({
      name, count, pct: Math.round((count / channels.length) * 100),
      barPct: (count / (sortedCats[0]?.[1] || 1)) * 100,
      color: categoryColours[name] || 'var(--accent)',
    }));

    return {
      total: channels.length, catCount, topCat, topPct, avgTenure,
      ogCount, vetCount, recentCount, newCount,
      pace, spreeMonth, spreeCount,
      longest, longestYears,
      composition,
    };
  }, [channels, chCats, categoryColours]);

  const archetype = useMemo(() => data ? calculateArchetype(channels, chCats) : { name: 'The Viewer' }, [channels, chCats, data]);
  const oneLiner = data ? (ONE_LINERS[archetype.name] || ONE_LINERS['The Viewer'])(data) : '';
  const narrative = data ? generateNarrative(archetype.name, data, isPro) : '';

  // Activity stats
  const activity = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeIds = new Set(activeChannels.map(c => c.channelId));
    const weeklyVids = feedVideos.filter(v => v.publishedAt && new Date(v.publishedAt).getTime() >= weekAgo && activeIds.has(v.channelId));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    weeklyVids.forEach(v => { dayCounts[new Date(v.publishedAt).getDay()]++; });
    const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
    const minDay = dayCounts.indexOf(Math.min(...dayCounts));
    return {
      channelsThisWeek: new Set(weeklyVids.map(v => v.channelId)).size,
      vidsThisWeek: weeklyVids.length,
      busiestDay: dayNames[maxDay], busiestDayCount: dayCounts[maxDay],
      quietestDay: dayNames[minDay], quietestDayCount: dayCounts[minDay],
      avgPerDay: (weeklyVids.length / 7).toFixed(1),
    };
  }, [activeChannels, feedVideos]);

  // Upload frequency
  const frequency = useMemo(() => {
    const buckets = { Daily: 0, 'Several/week': 0, Weekly: 0, Fortnightly: 0, Monthly: 0, Rarely: 0, Inactive: 0 };
    activeChannels.forEach(c => {
      if (getChannelState(c) === 'dead') { buckets.Inactive++; return; }
      const vids = feedVideos.filter(v => v.channelId === c.channelId && v.publishedAt);
      if (vids.length < 2) { buckets.Rarely++; return; }
      const sorted = vids.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      const days = (new Date(sorted[0].publishedAt) - new Date(sorted[sorted.length - 1].publishedAt)) / (1000 * 60 * 60 * 24);
      if (days <= 0) { buckets.Rarely++; return; }
      const perWeek = (vids.length - 1) / (days / 7);
      if (perWeek >= 5) buckets.Daily++; else if (perWeek >= 2) buckets['Several/week']++; else if (perWeek >= 0.8) buckets.Weekly++; else if (perWeek >= 0.4) buckets.Fortnightly++; else if (perWeek >= 0.1) buckets.Monthly++; else buckets.Rarely++;
    });
    const max = Math.max(...Object.values(buckets), 1);
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, count]) => ({ name, count, pct: (count / max) * 100 }));
  }, [activeChannels, feedVideos, getChannelState]);

  // Monthly timeline
  const timeline = useMemo(() => {
    const monthCounts = {};
    const shortMonth = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    channels.forEach(c => {
      if (!c.subscribedAt) return;
      const d = new Date(c.subscribedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });
    const months = Object.keys(monthCounts).sort();
    const max = Math.max(...Object.values(monthCounts), 1);
    return months.map(m => {
      const [y, mo] = m.split('-');
      return { key: m, label: `${shortMonth[parseInt(mo) - 1]} ${y.slice(2)}`, count: monthCounts[m], pct: (monthCounts[m] / max) * 100 };
    });
  }, [channels]);

  if (loading) return <div className="home-feed-loading"><span className="spinner" /> Loading insights...</div>;
  if (!user || !data) return <div className="ins-page"><div className="ins-header"><h1 className="ins-title">Insights</h1></div><div className="home-feed-empty"><p>Sign in to see your insights.</p></div></div>;

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="ins-page">
      <div className="ins-header"><h1 className="ins-title">Insights</h1></div>
      <div className="ins-content">

        {/* ── PERSONALITY CARD ── */}
        <div className="pc-card">
          <div className="pc-inner">
            {/* Left side */}
            <div className="pc-left">
              <div className="pc-label">YOUR VIEWING PERSONALITY</div>
              <div className="pc-archetype">{archetype.name}</div>
              <div className="pc-oneliner">&ldquo;{oneLiner}&rdquo;</div>
              <p className="pc-narrative" dangerouslySetInnerHTML={{ __html: narrative }} />
              <div className="pc-stats">
                <div className="pc-stat"><div className="pc-stat-val">{data.total}</div><div className="pc-stat-lbl">channels</div></div>
                <div className="pc-stat"><div className="pc-stat-val">{data.topPct}%</div><div className="pc-stat-lbl">{data.topCat}</div></div>
                <div className="pc-stat"><div className="pc-stat-val">{data.avgTenure}</div><div className="pc-stat-lbl">avg years</div></div>
                <div className="pc-stat"><div className="pc-stat-val">{data.catCount}</div><div className="pc-stat-lbl">categories</div></div>
              </div>
              <button className="pc-share" onClick={() => trackEvent('personality_shared', { archetype: archetype.name })}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M4.5 6.2L9.5 3.8M4.5 7.8L9.5 10.2" stroke="currentColor" strokeWidth="1.2" /></svg>
                Share personality
              </button>
            </div>

            <div className="pc-divider" />

            {/* Right side */}
            <div className={`pc-right${!isPro ? ' pc-right-blur' : ''}`}>
              <div className="pc-right-section">
                <div className="pc-right-label">CONTENT DIET</div>
                {data.composition.map(c => (
                  <div key={c.name} className="pc-diet-row">
                    <span className="pc-diet-name">{c.name}</span>
                    <div className="pc-diet-bar-wrap"><div className="pc-diet-bar" style={{ width: `${c.barPct}%`, background: c.color }} /></div>
                    <span className="pc-diet-pct">{c.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="pc-right-section">
                <div className="pc-right-label">TENURE</div>
                <div className="pc-tenure-chips">
                  {data.ogCount > 0 && <span className="pc-tenure-chip"><span className="pc-tenure-dot" style={{ background: 'var(--accent)' }} />{data.ogCount} OG</span>}
                  {data.vetCount > 0 && <span className="pc-tenure-chip"><span className="pc-tenure-dot" style={{ background: 'var(--ocean)' }} />{data.vetCount} Veteran</span>}
                  {data.recentCount > 0 && <span className="pc-tenure-chip"><span className="pc-tenure-dot" style={{ background: 'var(--orange)' }} />{data.recentCount} Recent</span>}
                  {data.newCount > 0 && <span className="pc-tenure-chip"><span className="pc-tenure-dot" style={{ background: 'var(--iris)' }} />{data.newCount} New</span>}
                </div>
              </div>
              <div className="pc-right-section">
                <div className="pc-right-label">KEY FACTS</div>
                {data.longest && <div className="pc-fact"><span className="pc-fact-val">{data.longest.name}</span><span className="pc-fact-lbl">{data.longestYears} years</span></div>}
                <div className="pc-fact"><span className="pc-fact-val">{data.pace}/month</span><span className="pc-fact-lbl">subscription pace</span></div>
                <div className="pc-fact"><span className="pc-fact-val">{data.spreeMonth}</span><span className="pc-fact-lbl">{data.spreeCount} added</span></div>
              </div>
            </div>

            {/* Pro overlay for free users */}
            {!isPro && (
              <div className="pc-pro-overlay">
                <div className="pc-pro-card">
                  <div className="pc-pro-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3.5" y="8" width="11" height="8" rx="2" stroke="#fff" strokeWidth="1.3" /><path d="M6 8V6a3 3 0 016 0v2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" /></svg></div>
                  <div className="pc-pro-text">
                    <div className="pc-pro-title">Unlock full breakdown</div>
                    <div className="pc-pro-sub">Content diet, tenure analysis, subscription patterns, and more.</div>
                  </div>
                  <Link href="/settings" className="pc-pro-cta">Upgrade to Pro</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── REMAINING SECTIONS ── */}

        {/* Subscription Composition */}
        <div className="ins-section">
          <div className="ins-section-title">Subscription Composition</div>
          <div className="ins-comp-chart">
            {data.composition.map(c => (
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
            <div className="ins-tl-vertical">
              <div className="ins-tl-bars">
                {timeline.map(t => (
                  <div key={t.key} className="ins-tl-col" title={`${t.label}: ${t.count}`}>
                    <div className="ins-tl-vbar" style={{ height: `${t.pct}%` }} />
                  </div>
                ))}
              </div>
              <div className="ins-tl-labels">
                {timeline.filter((_, i) => i % Math.max(1, Math.floor(timeline.length / 8)) === 0).map(t => (
                  <span key={t.key} className="ins-tl-label">{t.label}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Channel Activity */}
        <div className="ins-section">
          <div className="ins-section-title">Channel Activity</div>
          <div className="ins-activity-stats">
            <div className="ins-astat"><div className="ins-astat-val">{activity.channelsThisWeek}</div><div className="ins-astat-lbl">uploaded this week</div><div className="ins-astat-detail">of {activeChannels.length} channels</div></div>
            <div className="ins-astat"><div className="ins-astat-val">{activity.vidsThisWeek}</div><div className="ins-astat-lbl">videos this week</div><div className="ins-astat-detail">avg {activity.avgPerDay} per day</div></div>
            <div className="ins-astat"><div className="ins-astat-val">{activity.busiestDay}</div><div className="ins-astat-lbl">busiest day</div><div className="ins-astat-detail">{activity.busiestDayCount} uploads</div></div>
            <div className="ins-astat"><div className="ins-astat-val">{activity.quietestDay}</div><div className="ins-astat-lbl">quietest day</div><div className="ins-astat-detail">{activity.quietestDayCount} uploads</div></div>
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
      </div>
    </div>
  );
}
