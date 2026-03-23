'use client';
import { useState, useMemo } from 'react';

export default function DashboardPersonality({ channels, deadChannels, uncatCount, favCount, streak }) {
  const [unsubModalOpen, setUnsubModalOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [resubDismissed, setResubDismissed] = useState(false);

  const total = channels.length;

  // ── Health score (0–100) ───────────────────────────────
  const healthScore = useMemo(() => {
    if (!total) return 50;
    let score = 100;
    const deadPct = deadChannels.length / total;
    const uncatPct = uncatCount / total;
    score -= Math.round(deadPct * 40);
    score -= Math.round(uncatPct * 20);
    if (favCount === 0) score -= 10;
    return Math.max(0, Math.min(100, score));
  }, [total, deadChannels, uncatCount, favCount]);

  const healthVerdict = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Fair' : healthScore >= 40 ? 'Needs work' : 'Chaotic';
  const healthColor = healthScore >= 80 ? '#38E9B1' : healthScore >= 60 ? '#EF9F27' : '#E85D50';

  // Thermometer fill: map 0-100 to gradient position
  const thermoFill = `${healthScore}%`;

  // ── Roast verdict ─────────────────────────────────────
  const roastVerdict = useMemo(() => {
    if (healthScore >= 80) return "Actually pretty tidy in here. Don't blow it.";
    if (healthScore >= 60) return "Not terrible. A few dead channels are haunting you.";
    if (healthScore >= 40) return "This feed is a dumpster fire. But fixable.";
    return "Absolute chaos. You subscribed to everything and watched nothing.";
  }, [healthScore]);

  // ── Badges ────────────────────────────────────────────
  const badges = useMemo(() => {
    const cats = [...new Set(channels.flatMap(ch => ch.categories || []))];
    return [
      {
        id: 'first-sort',
        icon: '🗂️',
        title: 'First Sort',
        desc: 'Created your first category',
        earned: cats.length > 0,
      },
      {
        id: 'dead-weight',
        icon: '💀',
        title: 'Dead Weight Dropped',
        desc: 'Cleared 5+ inactive channels',
        earned: deadChannels.length >= 5,
      },
      {
        id: 'cat-king',
        icon: '👑',
        title: 'Category King',
        desc: 'Organised into 5+ categories',
        earned: cats.length >= 5,
      },
      {
        id: 'fav-five',
        icon: '⭐',
        title: 'Fav Five',
        desc: 'Starred 5 favourite channels',
        earned: favCount >= 5,
      },
      {
        id: 'streak',
        icon: '🔥',
        title: 'Streak Starter',
        desc: 'Logged in 3 days in a row',
        earned: streak >= 3,
      },
      {
        id: 'minimalist',
        icon: '✂️',
        title: 'Subscription Minimalist',
        desc: 'Keeping it under 100 channels',
        earned: total > 0 && total < 100,
      },
    ];
  }, [channels, deadChannels, favCount, streak, total]);

  // ── Weekly nudge text ─────────────────────────────────
  const nudgeText = useMemo(() => {
    if (deadChannels.length > 10) return `You've got ${deadChannels.length} channels that haven't posted in months. Time for a cull.`;
    if (uncatCount > 20) return `${uncatCount} channels are floating in the void, uncategorised. Give them a home.`;
    if (favCount === 0) return "You haven't starred a single channel. Do any of these actually spark joy?";
    return `Your feed is looking healthier. Keep it up — ${deadChannels.length} channels still need attention.`;
  }, [deadChannels, uncatCount, favCount]);

  // ── Re-sub shame ──────────────────────────────────────
  const shameChannel = deadChannels[0]?.ch;

  const ringOffset = Math.round(125.6 - (healthScore / 100) * 125.6);

  return (
    <>
      {/* ── Onboarding Roast ─────────────────────────────── */}
      <div className="personality-section-hd">
        <span className="db-section-title">Feed roast</span>
      </div>
      <div className="roast-card">
        <div className="roast-ring-wrap">
          <svg viewBox="0 0 48 48" className="roast-ring-svg">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
            <circle
              cx="24" cy="24" r="20"
              fill="none"
              stroke={healthColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="125.6"
              strokeDashoffset={ringOffset}
              transform="rotate(-90 24 24)"
            />
          </svg>
          <span className="roast-ring-val" style={{ color: healthColor }}>{healthScore}</span>
        </div>
        <div className="roast-body">
          <div className="roast-verdict">{roastVerdict}</div>
          <div className="roast-pills">
            <span className="roast-pill roast-pill-red">{deadChannels.length} inactive</span>
            <span className="roast-pill roast-pill-amber">{uncatCount} uncategorised</span>
            <span className="roast-pill roast-pill-mint">{favCount} favourited</span>
          </div>
          <button className="roast-cta" onClick={() => window.location.href = '/subscriptions'}>
            Clean it up →
          </button>
        </div>
      </div>

      {/* ── Achievement Badges ───────────────────────────── */}
      <div className="personality-section-hd">
        <span className="db-section-title">Achievements</span>
      </div>
      <div className="badge-grid">
        {badges.map(b => (
          <div key={b.id} className={`badge-card${b.earned ? '' : ' badge-locked'}`}>
            <div className="badge-icon">{b.icon}</div>
            <div className="badge-title">{b.title}</div>
            <div className="badge-desc">{b.desc}</div>
            {!b.earned && <div className="badge-lock-overlay">🔒</div>}
          </div>
        ))}
      </div>

      {/* ── Feed Health Thermometer ───────────────────────── */}
      <div className="personality-section-hd">
        <span className="db-section-title">Feed health</span>
      </div>
      <div className="thermo-card">
        <div className="thermo-header">
          <span className="thermo-label">Overall health</span>
          <span className="thermo-verdict" style={{ color: healthColor }}>{healthVerdict}</span>
        </div>
        <div className="thermo-track">
          <div className="thermo-fill" style={{ width: thermoFill, background: healthColor }} />
        </div>
        <div className="thermo-scale">
          <span>Chaotic</span>
          <span>Fair</span>
          <span>Excellent</span>
        </div>
        <div className="thermo-rows">
          <div className="thermo-row">
            <div className="thermo-dot" style={{ background: '#E85D50' }} />
            <span className="thermo-row-label">Inactive channels</span>
            <span className="thermo-row-val">{deadChannels.length}</span>
          </div>
          <div className="thermo-row">
            <div className="thermo-dot" style={{ background: '#EF9F27' }} />
            <span className="thermo-row-label">Uncategorised</span>
            <span className="thermo-row-val">{uncatCount}</span>
          </div>
          <div className="thermo-row">
            <div className="thermo-dot" style={{ background: '#38E9B1' }} />
            <span className="thermo-row-label">Favourited</span>
            <span className="thermo-row-val">{favCount}</span>
          </div>
        </div>
      </div>

      {/* ── Empty States ─────────────────────────────────── */}
      {favCount === 0 && (
        <div className="empty-card">
          <div className="empty-icon">⭐</div>
          <div className="empty-title">No favourites yet</div>
          <div className="empty-desc">Star channels you actually care about to see their latest videos here.</div>
          <button className="empty-cta" onClick={() => window.location.href = '/subscriptions'}>Browse channels</button>
        </div>
      )}

      {/* ── Weekly Nudge ─────────────────────────────────── */}
      {!nudgeDismissed && (
        <div className="nudge-card">
          <div className="nudge-icon">💬</div>
          <div className="nudge-body">
            <div className="nudge-title">Weekly check-in</div>
            <div className="nudge-text">{nudgeText}</div>
          </div>
          <button className="nudge-dismiss" onClick={() => setNudgeDismissed(true)} aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* ── Re-subscribe Shame ───────────────────────────── */}
      {shameChannel && !resubDismissed && (
        <div className="resub-card">
          <div className="resub-header">
            <span className="resub-title">Still subscribed?</span>
            <button className="resub-close" onClick={() => setResubDismissed(true)} aria-label="Dismiss">✕</button>
          </div>
          <div className="resub-body">
            <div className="resub-ch">{shameChannel.name}</div>
            <div className="resub-desc">This channel hasn't posted in a while. Still worth keeping?</div>
            <div className="resub-actions">
              <button className="resub-btn-keep" onClick={() => setResubDismissed(true)}>Keep it</button>
              <button className="resub-btn-drop" onClick={() => setUnsubModalOpen(true)}>Unsubscribe</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unsubscribe Confirmation Modal ───────────────── */}
      {unsubModalOpen && (
        <div className="unsub-backdrop" onClick={() => setUnsubModalOpen(false)}>
          <div className="unsub-modal" onClick={e => e.stopPropagation()}>
            <div className="unsub-modal-icon">😬</div>
            <div className="unsub-modal-title">You sure?</div>
            <div className="unsub-modal-desc">
              Unsubscribing from <strong>{shameChannel?.name}</strong> is permanent on YouTube. Subscrub can't undo that for you.
            </div>
            <div className="unsub-modal-actions">
              <button className="unsub-btn-cancel" onClick={() => setUnsubModalOpen(false)}>Keep the channel</button>
              <a
                className="unsub-btn-confirm"
                href={`https://www.youtube.com/channel/${shameChannel?.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setUnsubModalOpen(false)}
              >
                Go to YouTube →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
