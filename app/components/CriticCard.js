'use client';
import { useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useChannelData } from './ChannelDataContext';

export default function CriticCard() {
  const { user, userTier } = useAuth();
  const { channels, categories, findDeadChannels, chIsUncategorised } = useChannelData();

  const { score, scoreColour, emoji, label, verdict, deadCount, uncatCount, favCount } = useMemo(() => {
    if (!channels.length) return { score: 0, scoreColour: 'var(--text-muted)', emoji: '🤷', label: 'No data', verdict: 'Sync your subscriptions to get a score.', deadCount: 0, uncatCount: 0, favCount: 0 };

    const dead = findDeadChannels();
    const uncat = channels.filter(c => chIsUncategorised(c)).length;
    const favs = channels.filter(c => c.favourited).length;

    let s = 100;
    const categorised = channels.filter(c => !chIsUncategorised(c)).length;
    const catPct = Math.round((categorised / channels.length) * 100);
    if (catPct < 80) s -= catPct < 40 ? 30 : 15;
    const deadPct = Math.round((dead.length / channels.length) * 100);
    if (deadPct > 5) s -= deadPct > 20 ? 25 : 10;
    if (categories.length < 5) s -= categories.length < 2 ? 15 : 5;
    if (channels.length > 500) s -= 10;
    s = Math.max(0, Math.min(100, s));

    const col = s >= 70 ? 'var(--accent)' : s >= 40 ? '#EF9F27' : '#E85D50';
    const em = s >= 80 ? '🔥' : s >= 60 ? '😐' : s >= 40 ? '😬' : '💀';
    const lb = s >= 80 ? 'Looking sharp' : s >= 60 ? 'Getting there' : s >= 40 ? 'Needs work' : 'Dumpster fire';

    const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
    const v = `<strong>${channels.length} channels</strong>, ${name}. You've got <strong>${favs}</strong> favourites and <strong>${dead.length}</strong> inactive channels lurking in your feed.`;

    return { score: s, scoreColour: col, emoji: em, label: lb, verdict: v, deadCount: dead.length, uncatCount: uncat, favCount: favs };
  }, [channels, categories, findDeadChannels, chIsUncategorised, user]);

  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (score / 100) * circumference;
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'D';

  if (!channels.length) return null;

  return (
    <div className="critic-panel">
      <div className="critic-banner">
        <div className="critic-banner-bg" style={{ background: `linear-gradient(135deg, ${scoreColour}, ${scoreColour}44)`, opacity: 0.3 }} />
      </div>

      <div className="critic-identity">
        <div className="critic-avatar">{name.charAt(0).toUpperCase()}</div>
        <div className="critic-name">{name}</div>
        <div className="critic-handle">@{name.toLowerCase()} · {userTier || 'free'} tier</div>
      </div>

      <div className="critic-body">
        <div className="critic-score">
          <div className="critic-ring">
            <svg viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="var(--bg-surface-raised)" strokeWidth="4" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={scoreColour} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                transform="rotate(-90 28 28)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
            </svg>
            <span className="critic-ring-val" style={{ color: scoreColour }}>{score}%</span>
          </div>
          <div>
            <div className="critic-score-label">{emoji} {label}</div>
            <div className="critic-score-sub">Your feed health score</div>
          </div>
        </div>

        <div className="critic-verdict" dangerouslySetInnerHTML={{ __html: verdict }} />

        <div className="critic-stats">
          <div className="critic-stat">
            <div className="critic-stat-val">{channels.length}</div>
            <div className="critic-stat-label">Subs</div>
          </div>
          <div className="critic-stat">
            <div className="critic-stat-val">{categories.length}</div>
            <div className="critic-stat-label">Categories</div>
          </div>
          <div className="critic-stat">
            <div className="critic-stat-val" style={{ color: '#E85D50' }}>{deadCount}</div>
            <div className="critic-stat-label">Inactive</div>
          </div>
        </div>

        <div className="critic-breakdown">
          <div className="critic-bd-title">The damage</div>
          <div className="bd-row">
            <div className="bd-dot" style={{ background: '#E85D50' }} />
            <span className="bd-label">Inactive channels</span>
            <span className="bd-val" style={{ color: '#E85D50' }}>{deadCount}</span>
          </div>
          <div className="bd-row">
            <div className="bd-dot" style={{ background: '#EF9F27' }} />
            <span className="bd-label">Uncategorised</span>
            <span className="bd-val" style={{ color: '#EF9F27' }}>{uncatCount}</span>
          </div>
          <div className="bd-row">
            <div className="bd-dot" style={{ background: 'var(--accent)' }} />
            <span className="bd-label">Favourites</span>
            <span className="bd-val" style={{ color: 'var(--accent)' }}>{favCount}</span>
          </div>
        </div>
      </div>

      <div className="critic-cta">
        <button className="critic-btn" onClick={() => window.location.href = '/analytics'}>
          Let&apos;s fix this
          <svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
        </button>
      </div>
    </div>
  );
}
