'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function SubscriptionCritic({ channels, deadChannels, uncatCount }) {
  const router = useRouter();
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [ctaState, setCtaState] = useState('idle'); // idle | loading | done

  const neverWatched = useMemo(
    () => channels.filter(c => c.subscriberCount && Number(c.subscriberCount) < 1000).length,
    [channels]
  );
  const inactive = deadChannels.length;
  const uncat    = uncatCount;

  const total   = channels.length || 1;
  const problem = Math.min(neverWatched + inactive + uncat, total);
  const score   = Math.max(0, Math.min(100, Math.round(100 - (problem / total) * 80)));

  const scoreColor = score >= 80 ? 'var(--accent)' : score >= 55 ? 'var(--amber)' : 'var(--red)';
  const scoreLabel = score >= 80 ? 'Looking good' : score >= 55 ? 'Needs work'   : 'Critical';

  function handleCta() {
    setCtaState('loading');
    setTimeout(() => {
      setCtaState('done');
      setTimeout(() => router.push('/subscriptions'), 800);
    }, 1000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Critic card */}
      <div className="critic-card">
        <div className="critic-header">
          <span className="critic-title">Subscription critic</span>
          <div className="critic-icon">
            <div className="critic-bar" style={{ height: 8 }} />
            <div className="critic-bar" style={{ height: 14 }} />
            <div className="critic-bar" style={{ height: 11 }} />
            <div className="critic-bar" style={{ height: 18 }} />
          </div>
        </div>

        <div className="critic-score-row">
          <div className="critic-score-bar-wrap">
            <div className="critic-score-bar" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <div>
            <span className="critic-score-num" style={{ color: scoreColor }}>{score}%</span>
            <span className="critic-score-label">{scoreLabel}</span>
          </div>
        </div>

        <p className="critic-summary">
          You've got <strong>{problem} subscription{problem !== 1 ? 's' : ''}</strong> slacking off. Time for a scrub.
        </p>

        <div className="critic-breakdown">
          <div className="critic-breakdown-row">
            <div className="critic-breakdown-dot" style={{ background: 'var(--red)' }} />
            <span className="critic-breakdown-num" style={{ color: 'var(--red)' }}>{neverWatched}</span>
            <span className="critic-breakdown-label">Low engagement</span>
            <div className="critic-breakdown-icon">
              <svg viewBox="0 0 16 16"><path d="M2 8h12"/><circle cx="8" cy="8" r="6"/></svg>
            </div>
          </div>
          <div className="critic-breakdown-row">
            <div className="critic-breakdown-dot" style={{ background: 'var(--amber)' }} />
            <span className="critic-breakdown-num" style={{ color: 'var(--amber)' }}>{inactive}</span>
            <span className="critic-breakdown-label">Inactive channels</span>
            <div className="critic-breakdown-icon">
              <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>
            </div>
          </div>
          <div className="critic-breakdown-row">
            <div className="critic-breakdown-dot" style={{ background: 'var(--purple)' }} />
            <span className="critic-breakdown-num" style={{ color: 'var(--purple)' }}>{uncat}</span>
            <span className="critic-breakdown-label">Uncategorised</span>
            <div className="critic-breakdown-icon">
              <svg viewBox="0 0 16 16"><path d="M8 3v5M8 11v1"/><circle cx="8" cy="8" r="6"/></svg>
            </div>
          </div>
        </div>

        <button
          className={`critic-cta${ctaState === 'done' ? ' critic-cta-done' : ''}`}
          onClick={handleCta}
          disabled={ctaState !== 'idle'}
        >
          {ctaState === 'loading' && 'Scrubbing…'}
          {ctaState === 'done'    && 'Done — opening subscriptions ✓'}
          {ctaState === 'idle'    && <>Let&apos;s fix this <svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg></>}
        </button>
      </div>

      {/* Alert card */}
      {!alertDismissed && problem > 0 && (
        <div className="critic-alert-card">
          <div className="critic-alert-icon">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z" stroke="var(--amber)" strokeWidth="1.5"/>
              <path d="M10 6v5" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="10" cy="14" r="0.8" fill="var(--amber)"/>
            </svg>
          </div>
          <div className="critic-alert-content">
            <div className="critic-alert-title">Subscrub alert</div>
            <div className="critic-alert-msg">
              Your feed&apos;s getting cluttered — <strong>{problem} channel{problem !== 1 ? 's' : ''}</strong> need attention.
            </div>
          </div>
          <button className="critic-alert-dismiss" onClick={() => setAlertDismissed(true)}>✕</button>
        </div>
      )}

    </div>
  );
}
