'use client';
import { useMemo } from 'react';

function ScoreRing({ size, pct, colour }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-surface-raised)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colour} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

function getRoast(pct, total, active, inactive) {
  if (pct >= 90) return { verdict: 'Suspiciously clean.', roast: `I'm subscribed to ${total} channels. All active, all watched. This is unnatural.` };
  if (pct >= 75) return { verdict: 'Looking sharp.', roast: `I'm subscribed to ${total} channels. ${active} are pulling their weight. The rest are on thin ice.` };
  if (pct >= 60) return { verdict: 'Eh, needs work.', roast: `I'm subscribed to ${total} channels. I actually watch ${active} of them. The other ${inactive} are just paying emotional rent.` };
  if (pct >= 40) return { verdict: 'Getting messy.', roast: `${total} channels. I watch ${active} of them. The rest are just haunting my feed.` };
  return { verdict: 'Complete dumpster fire.', roast: `${total} channels and I barely watch any of them. This is a cry for help.` };
}

function getScoreColour(pct) {
  if (pct >= 80) return 'var(--accent)';
  if (pct >= 60) return '#EF9F27';
  return '#E85D50';
}

function getVerdict(pct) {
  if (pct >= 90) return { title: 'Suspiciously clean.', sub: 'Almost everything is active and watched. Impressive.' };
  if (pct >= 75) return { title: 'Looking sharp.', sub: 'Your feed is well-maintained with minimal dead weight.' };
  if (pct >= 60) return { title: 'Needs a tidy up.', sub: 'There\'s some clutter building up in your subscriptions.' };
  if (pct >= 40) return { title: 'Getting messy.', sub: 'A decent chunk of your subscriptions aren\'t pulling their weight.' };
  return { title: 'Complete chaos.', sub: 'Most of your subscriptions are inactive or irrelevant.' };
}

function getBadge(channels, deadChannels, favCount) {
  if (favCount >= 20) return { name: 'Curator', desc: `${favCount} channels marked as favourites. You know what you like.`, icon: 'star', colour: '#EF9F27' };
  if (deadChannels.length === 0 && channels.length > 20) return { name: 'Clean sweep', desc: 'Zero inactive channels detected. Your feed is pristine.', icon: 'check', colour: 'var(--accent)' };
  if (channels.length >= 300) return { name: 'Collector', desc: `${channels.length} subscriptions. You subscribe to everything.`, icon: 'layers', colour: '#B07CED' };
  if (deadChannels.length >= 50) return { name: 'Ghost hunter needed', desc: `${deadChannels.length} inactive channels haunting your feed.`, icon: 'ghost', colour: '#E85D50' };
  return { name: 'Getting started', desc: 'Keep organising — badges unlock as you use Subsnub.', icon: 'zap', colour: 'var(--accent)' };
}

function BadgeIcon({ icon, colour }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: colour, strokeWidth: "1.5", strokeLinecap: "round" };
  switch (icon) {
    case 'star': return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case 'check': return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>;
    case 'layers': return <svg {...props}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>;
    case 'ghost': return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    default: return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
  }
}

function CompareCard({ channels, deadChannels, score, colour }) {
  const baseline = useMemo(() => {
    const KEY = 'subsnub_first_score';
    try {
      const stored = JSON.parse(localStorage.getItem(KEY));
      if (stored) return stored;
    } catch (e) {}
    // First visit — store current as baseline
    const data = { subs: channels.length, score };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    return null; // No comparison on first visit
  }, [channels.length, score]);

  if (!baseline || baseline.subs === channels.length) return null;

  const beforePct = 100;
  const afterPct = Math.round((channels.length / baseline.subs) * 100);
  const diff = Math.abs(channels.length - baseline.subs);
  const beforeColour = baseline.score < 60 ? '#E85D50' : baseline.score < 80 ? '#EF9F27' : 'var(--accent)';

  return (
    <div className="compare-card">
      <div className="compare-header">
        <span className="compare-title">Since you started</span>
        <span className="compare-logo"><span>sub</span>snub</span>
      </div>
      <div className="compare-bars">
        <div className="compare-row">
          <span className="compare-label" style={{ color: 'var(--text-muted)' }}>Before</span>
          <div className="compare-bar-wrap">
            <div className="compare-bar" style={{ width: `${beforePct}%`, background: `linear-gradient(90deg,${beforeColour},#EF9F27)` }}>
              <span className="compare-bar-num">{baseline.subs}</span>
              <span className="compare-bar-label" style={{ color: 'rgba(0,0,0,0.4)' }}>subscriptions</span>
            </div>
          </div>
        </div>
        <div className="compare-row">
          <span className="compare-label" style={{ color: 'var(--accent)' }}>Now</span>
          <div className="compare-bar-wrap">
            <div className="compare-bar" style={{ width: `${Math.min(afterPct, 100)}%`, background: 'var(--accent)' }}>
              <span className="compare-bar-num">{channels.length}</span>
              <span className="compare-bar-label" style={{ color: 'rgba(0,0,0,0.4)' }}>subscriptions</span>
            </div>
          </div>
        </div>
      </div>
      <div className="compare-bars" style={{ marginBottom: 12 }}>
        <div className="compare-row">
          <span className="compare-label" style={{ color: 'var(--text-muted)' }}>Score</span>
          <div className="compare-bar-wrap" style={{ height: 16 }}>
            <div className="compare-bar" style={{ width: `${baseline.score}%`, background: beforeColour, height: '100%' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: '#111' }}>{baseline.score}%</span>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', minWidth: 20, textAlign: 'center' }}>→</div>
          <div className="compare-bar-wrap" style={{ height: 16 }}>
            <div className="compare-bar" style={{ width: `${score}%`, background: colour, height: '100%' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: '#111' }}>{score}%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="compare-verdict">
        {channels.length < baseline.subs
          ? <>Scrubbed <strong>{diff} channels</strong>. Feed health went from <strong style={{ color: beforeColour }}>{baseline.score}%</strong> to <strong style={{ color: colour }}>{score}%</strong>.</>
          : <>Added <strong>{diff} channels</strong> since you started. Score: <strong style={{ color: colour }}>{score}%</strong>.</>
        }
      </div>
    </div>
  );
}

export default function ShareCards({ channels, deadChannels, favCount, uncatCount }) {
  const score = useMemo(() => {
    if (!channels.length) return 0;
    const activeCount = channels.length - deadChannels.length;
    return Math.round((activeCount / channels.length) * 100);
  }, [channels, deadChannels]);

  const colour = getScoreColour(score);
  const verdict = getVerdict(score);
  const badge = getBadge(channels, deadChannels, favCount);
  const roast = getRoast(score, channels.length, channels.length - deadChannels.length, deadChannels.length);
  const activeCount = channels.length - deadChannels.length;

  if (!channels.length) return null;

  return (
    <div className="share-cards-section">
      <div className="db-section-hd">
        <span className="db-section-title">Your feed score</span>
      </div>
      <div className="share-cards-grid">
        {/* Twitter landscape card */}
        <div className="share-card">
          <div className="share-top">
            <div className="share-score-area">
              <div className="share-ring">
                <ScoreRing size={72} pct={score} colour={colour} />
                <span className="share-ring-val" style={{ color: colour }}>{score}%</span>
              </div>
              <div className="share-verdict">
                <div className="share-verdict-title">{verdict.title}</div>
                <div className="share-verdict-sub">{channels.length} channels. {activeCount} active. {deadChannels.length} need attention.</div>
              </div>
            </div>
            <div className="share-logo"><span>sub</span>snub</div>
          </div>
          <div className="share-bottom">
            <div className="share-stats">
              <div className="share-stat">
                <div className="share-stat-num" style={{ color: colour }}>{channels.length}</div>
                <div className="share-stat-label">Subscriptions</div>
              </div>
              <div className="share-stat">
                <div className="share-stat-num" style={{ color: 'var(--accent)' }}>{activeCount}</div>
                <div className="share-stat-label">Active</div>
              </div>
              <div className="share-stat">
                <div className="share-stat-num" style={{ color: '#EF9F27' }}>{deadChannels.length}</div>
                <div className="share-stat-label">Inactive</div>
              </div>
              <div className="share-stat">
                <div className="share-stat-num">{favCount}</div>
                <div className="share-stat-label">Favourites</div>
              </div>
            </div>
            <div className="share-cta">Get your score at <span className="share-cta-url">getsubsnub.com</span></div>
          </div>
        </div>

        {/* Square card (Instagram) */}
        <div className="share-square">
          <div className="sq-ring">
            <ScoreRing size={100} pct={score} colour={colour} />
            <span className="sq-ring-val" style={{ color: colour }}>{score}<span className="sq-ring-pct">%</span></span>
          </div>
          <div className="sq-verdict">{roast.verdict}</div>
          <p className="sq-roast">{roast.roast}</p>
          <div className="sq-pills">
            <span className="sq-pill"><span className="num" style={{ color: '#E85D50' }}>{deadChannels.length}</span> inactive</span>
            <span className="sq-pill"><span className="num" style={{ color: '#EF9F27' }}>{uncatCount}</span> uncategorised</span>
            <span className="sq-pill"><span className="num" style={{ color: 'var(--accent)' }}>{favCount}</span> favourites</span>
          </div>
          <div className="sq-footer">
            <span className="sq-logo"><span>sub</span>snub</span>
            <span className="sq-dot" />
            <span className="sq-url">getsubsnub.com</span>
          </div>
        </div>

        {/* Badge card */}
        <div className="badge-share">
          <div className="badge-share-icon" style={{ background: `${badge.colour}18` }}>
            <BadgeIcon icon={badge.icon} colour={badge.colour} />
          </div>
          <div className="badge-share-content">
            <div className="badge-share-earned">Badge earned</div>
            <div className="badge-share-name">{badge.name}</div>
            <div className="badge-share-desc">{badge.desc}</div>
          </div>
          <div className="badge-share-logo">
            <div className="logo-text"><span>sub</span>snub</div>
            <div className="url">getsubsnub.com</div>
          </div>
        </div>

        {/* Before/After comparison card */}
        <CompareCard channels={channels} deadChannels={deadChannels} score={score} colour={colour} />
      </div>
    </div>
  );
}
