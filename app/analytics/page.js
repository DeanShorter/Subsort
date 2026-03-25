'use client';
import { useMemo } from 'react';
import { useAuth } from '../components/AuthContext';
import { useChannelData } from '../components/ChannelDataContext';
import PageHeader from '../components/PageHeader';
import PunchCardChart from '../components/PunchCardChart';

export default function AnalyticsPage() {
  const { user, signIn } = useAuth();
  const {
    channels, categories, categoryColours, loading,
    chCats, chIsUncategorised, formatCount, findDeadChannels,
  } = useChannelData();

  // ── Feed health score ──────────────────────────────────
  const { score, factors, gradeText } = useMemo(() => {
    if (!channels.length) return { score: 0, factors: [], gradeText: '' };

    let s = 100;
    const f = [];

    // Categorisation coverage
    const categorised = channels.filter(c => !chIsUncategorised(c)).length;
    const catPct = Math.round((categorised / channels.length) * 100);
    if (catPct >= 80) f.push({ t: `${catPct}% categorised`, c: 'good' });
    else if (catPct >= 40) { s -= 15; f.push({ t: `${catPct}% categorised`, c: 'warn' }); }
    else { s -= 30; f.push({ t: `Only ${catPct}% categorised`, c: 'bad' }); }

    // Dead channels
    const dead = findDeadChannels();
    const deadPct = Math.round((dead.length / channels.length) * 100);
    if (deadPct <= 5) f.push({ t: 'Few inactive channels', c: 'good' });
    else if (deadPct <= 20) { s -= 10; f.push({ t: `${dead.length} inactive channels`, c: 'warn' }); }
    else { s -= 25; f.push({ t: `${dead.length} inactive channels`, c: 'bad' }); }

    // Category diversity
    const catCounts = {};
    channels.forEach(ch => chCats(ch).forEach(c => catCounts[c] = (catCounts[c] || 0) + 1));
    const catKeys = Object.keys(catCounts);
    if (catKeys.length >= 5) f.push({ t: `${catKeys.length} categories — diverse`, c: 'good' });
    else if (catKeys.length >= 2) { s -= 5; f.push({ t: `${catKeys.length} categories`, c: 'warn' }); }
    else { s -= 15; f.push({ t: 'Needs more categories', c: 'bad' }); }

    // Balance
    if (catKeys.length > 1) {
      const max = Math.max(...Object.values(catCounts));
      const concentration = max / channels.length;
      if (concentration > 0.5) { s -= 10; f.push({ t: `${Math.round(concentration * 100)}% in one category`, c: 'warn' }); }
      else f.push({ t: 'Balanced distribution', c: 'good' });
    }

    // Sub count
    if (channels.length > 500) { s -= 10; f.push({ t: `${channels.length} subs — consider pruning`, c: 'warn' }); }
    else f.push({ t: `${channels.length} subscriptions`, c: 'good' });

    s = Math.max(0, Math.min(100, s));
    const g = s >= 80 ? 'Excellent — your feed is well organised!' :
              s >= 60 ? 'Good — a few improvements could help.' :
              s >= 40 ? 'Fair — your feed needs some attention.' :
              'Needs work — time for a subscription audit.';

    return { score: s, factors: f, gradeText: g };
  }, [channels, chCats, chIsUncategorised, findDeadChannels]);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSubs = channels.reduce((s, c) => s + (c.subscriberCount || 0), 0);
    const totalViews = channels.reduce((s, c) => s + (c.viewCount || 0), 0);
    const avgSubs = channels.length ? Math.round(totalSubs / channels.length) : 0;
    const dead = findDeadChannels();
    return [
      { n: channels.length, l: 'Subscriptions' },
      { n: formatCount(totalSubs), l: 'Combined Subs' },
      { n: formatCount(totalViews), l: 'Combined Views' },
      { n: formatCount(avgSubs), l: 'Avg Subs/Channel' },
      { n: categories.length, l: 'Categories' },
      { n: dead.length, l: 'Inactive' },
    ];
  }, [channels, categories, formatCount, findDeadChannels]);

  // ── Category bars ──────────────────────────────────────
  const catBars = useMemo(() => {
    const counts = {};
    channels.forEach(ch => chCats(ch).forEach(c => counts[c] = (counts[c] || 0) + 1));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const uncatCount = channels.filter(c => chIsUncategorised(c)).length;
    if (uncatCount) sorted.push(['Uncategorised', uncatCount]);
    return sorted.map(([name, count]) => ({
      name, count,
      pct: Math.round((count / channels.length) * 100),
      colour: name === 'Uncategorised' ? '#666' : (categoryColours[name] || 'var(--accent)'),
    }));
  }, [channels, chCats, chIsUncategorised, categoryColours]);

  // ── Dead channels ──────────────────────────────────────
  const deadChannels = useMemo(() => findDeadChannels(), [findDeadChannels]);

  // ── Top channels ───────────────────────────────────────
  const topChannels = useMemo(() => {
    return [...channels].sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0)).slice(0, 10);
  }, [channels]);

  // Score ring SVG
  const circumference = 2 * Math.PI * 52;
  const scoreOffset = circumference - (score / 100) * circumference;
  const scoreColour = score >= 70 ? 'var(--color-success)' : score >= 40 ? 'var(--color-warning)' : 'var(--color-error)';

  if (loading) {
    return <div className="home-feed-loading"><span className="spinner" /> Loading insights…</div>;
  }

  if (!user) {
    return (
      <main className="home-main">
        <PageHeader title="Insights" />
        <div className="home-feed-empty">
          <p className="home-feed-empty-text">Sign in to see your insights.</p>
          <button className="btn-accent" onClick={signIn}>Sign in with Google</button>
        </div>
      </main>
    );
  }

  if (!channels.length) {
    return (
      <main className="home-main">
        <PageHeader title="Insights" />
        <p className="home-feed-empty-text">Sync your subscriptions to see insights.</p>
      </main>
    );
  }

  return (
    <main className="home-main">
      <PageHeader title="Insights" />

      <div className="main-content">
      {/* Feed Health Score */}
      <div className="analytics-card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="analytics-card-title">Feed Health</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-surface-raised)" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColour} strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={scoreOffset}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: scoreColour }}>
              {score}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '.5rem' }}>{gradeText}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
              {factors.map((f, i) => (
                <span key={i} className={`score-factor ${f.c}`}>
                  {f.c === 'good' ? '✓' : f.c === 'warn' ? '⚠' : '✗'} {f.t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="an-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} className="an-stat-card">
            <div className="an-stat-num">{s.n}</div>
            <div className="an-stat-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Viewing Activity Punch Card */}
      <PunchCardChart />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Category breakdown */}
        <div className="analytics-card">
          <h3 className="analytics-card-title">Category Breakdown</h3>
          {catBars.map(({ name, count, pct, colour }) => (
            <div key={name} className="analytics-bar-row">
              <span className="analytics-bar-label">{name}</span>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill" style={{ width: `${pct}%`, background: colour }}>
                  <span>{pct}%</span>
                </div>
              </div>
              <span className="analytics-bar-count">{count}</span>
            </div>
          ))}
        </div>

        {/* Inactive channels */}
        <div className="analytics-card">
          <h3 className="analytics-card-title">Inactive Channels</h3>
          {deadChannels.length ? deadChannels.slice(0, 15).map(d => (
            <div key={d.ch.id} className="dead-channel-row">
              <div className="dead-channel-avatar">
                {d.ch.thumbnail ? <img src={d.ch.thumbnail} alt="" /> : null}
              </div>
              <div className="dead-channel-info">
                <div className="dead-channel-name">{d.ch.name}</div>
                <div className="dead-channel-reason">{d.reason}</div>
              </div>
              <span className={`dead-channel-tag ${d.severity}`}>
                {d.severity === 'high' ? 'Inactive' : 'Low'}
              </span>
            </div>
          )) : (
            <p className="analytics-empty">No inactive channels detected — nice!</p>
          )}
        </div>
      </div>

      {/* Top channels */}
      <div className="analytics-card" style={{ marginTop: '1.5rem' }}>
        <h3 className="analytics-card-title">Top Channels by Subscribers</h3>
        {topChannels.map((ch, i) => {
          const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
          return (
            <div key={ch.id} className="top-channel-row">
              <span className={`top-channel-rank ${rankClass}`}>{i + 1}</span>
              <div className="dead-channel-avatar">
                {ch.thumbnail ? <img src={ch.thumbnail} alt="" /> : null}
              </div>
              <div className="dead-channel-info">
                <div className="dead-channel-name">{ch.name}</div>
                <div className="dead-channel-reason">
                  {formatCount(ch.subscriberCount)} subs · {formatCount(ch.videoCount)} videos
                  {chCats(ch).length ? ` · ${chCats(ch).join(', ')}` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </main>
  );
}
