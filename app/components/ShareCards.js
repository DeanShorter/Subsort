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
  return { name: 'Getting started', desc: 'Keep organising — badges unlock as you use Subscrub.', icon: 'zap', colour: 'var(--accent)' };
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

export default function ShareCards({ channels, deadChannels, favCount, uncatCount }) {
  const score = useMemo(() => {
    if (!channels.length) return 0;
    const activeCount = channels.length - deadChannels.length;
    return Math.round((activeCount / channels.length) * 100);
  }, [channels, deadChannels]);

  const colour = getScoreColour(score);
  const verdict = getVerdict(score);
  const badge = getBadge(channels, deadChannels, favCount);
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
            <div className="share-logo"><span>sub</span>scrub</div>
          </div>
          <div className="share-bottom">
            <div className="share-stats">
              <div className="share-stat">
                <div className="share-stat-num" style={{ color }}>{channels.length}</div>
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
            <div className="share-cta">Get your score at <span className="share-cta-url">getsubscrub.com</span></div>
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
            <div className="logo-text"><span>sub</span>scrub</div>
            <div className="url">getsubscrub.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
