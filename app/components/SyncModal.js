'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const CHECKMARK = (
  <svg viewBox="0 0 12 12" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
    <path d="M2.5 6l2.5 2.5 4.5-5" />
  </svg>
);

const STEPS = [
  { label: 'Connecting to YouTube' },
  { label: 'Checking subscriptions' },
  { label: 'Searching for recent uploads' },
  { label: 'Preparing your feeds' },
  { label: 'Scrutinising the mess' },
  { label: null }, // dynamic — set to "Judging {name}..."
];

function getGreeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name}.`;
}

function getScoreColour(pct) {
  if (pct >= 80) return 'var(--accent)';
  if (pct >= 60) return '#EF9F27';
  return '#E85D50';
}

function generateRoast(name, channels, deadChannels, favCount, categories) {
  const total = channels.length;
  const active = total - deadChannels.length;
  const score = total > 0 ? Math.round((active / total) * 100) : 0;
  const topCat = categories[0] || 'miscellaneous';

  let roast;
  if (score >= 90) {
    roast = `${total} channels, and nearly all of them are active. Either you're incredibly disciplined or you just signed up yesterday.`;
  } else if (score >= 70) {
    roast = `You're subscribed to <strong>${total} channels</strong>. You actually engage with about <strong>${active}</strong> of them. The rest are just taking up space, but it's not a disaster.`;
  } else if (score >= 50) {
    roast = `Right then, ${name}. You're subscribed to <strong>${total} channels</strong>. You regularly watch about <strong>${active}</strong> of them. The other ${deadChannels.length}? Just vibes, apparently.`;
  } else {
    roast = `${name}, we need to talk. <strong>${total} channels</strong> and you barely watch <strong>${active}</strong> of them. The other ${deadChannels.length} are just haunting your feed.`;
  }

  if (favCount > 0) {
    roast += `<br><br>You've got <strong>${favCount} favourites</strong> and your top category is <strong>${topCat}</strong>.`;
  }

  roast += ` Your subscrub score is <strong style="color:${getScoreColour(score)}">${score}%</strong>${score >= 80 ? ' — impressive.' : score >= 60 ? ' — room for improvement.' : ' — we\'ve seen better.'}`;

  return { roast, score };
}

export default function SyncModal({
  visible,
  onClose,
  userName,
  // Sync state callbacks
  syncState, // { step, substep, detail, pct, subCount, videoCount, deadCount, favCount, categories, channels, deadChannels, done }
}) {
  const [revealedSteps, setRevealedSteps] = useState(new Set());
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState(new Map()); // step → detail string
  const [pct, setPct] = useState(0);
  const [subtitle, setSubtitle] = useState('Give us a sec while we figure out what you\'ve been up to...');
  const [roastVisible, setRoastVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const [roastData, setRoastData] = useState(null);
  const actionQueue = useRef([]);
  const processingQueue = useRef(false);

  // Reveal all steps on mount
  useEffect(() => {
    if (!visible) return;
    setRevealedSteps(new Set());
    setActiveStep(-1);
    setCompletedSteps(new Map());
    setPct(0);
    setRoastVisible(false);
    setCtaVisible(false);
    setRoastData(null);
    actionQueue.current = [];

    let i = 0;
    const id = setInterval(() => {
      setRevealedSteps(prev => new Set([...prev, i]));
      i++;
      if (i >= STEPS.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [visible]);

  // Queue-based state processing to handle rapid events
  const processAction = useCallback((state) => {
    const { action, step, detail, pct: p, favCount, categories, channels, deadChannels, done } = state;

    if (p != null) setPct(p);

    if (action === 'activate' && step != null) {
      setActiveStep(step);
      const subtitles = [
        'Connecting to YouTube...',
        'Pulling your subscriptions from YouTube...',
        'Checking what your channels have been posting...',
        'Sorting everything into categories...',
        'Looking for dead weight...',
        'Forming opinions...',
      ];
      if (subtitles[step]) setSubtitle(subtitles[step]);
    }

    if (action === 'complete' && step != null) {
      setCompletedSteps(prev => new Map([...prev, [step, detail || '✓']]));
      setActiveStep(prev => prev === step ? -1 : prev);
    }

    if (done) {
      setActiveStep(-1);
      setSubtitle('All done. Here\'s the verdict.');

      // Generate roast
      if (channels && deadChannels) {
        const { roast, score } = generateRoast(
          userName || 'there',
          channels,
          deadChannels,
          favCount || 0,
          categories || []
        );
        setRoastData({ roast, score, deadCount: deadChannels.length, favCount: favCount || 0 });
        setTimeout(() => setRoastVisible(true), 500);
        setTimeout(() => setCtaVisible(true), 1100);
      } else {
        setTimeout(() => setCtaVisible(true), 500);
      }
    }
  }, [userName]);

  // Process queued actions with a small delay between each to allow React to paint
  useEffect(() => {
    if (!syncState) return;
    actionQueue.current.push(syncState);

    if (!processingQueue.current) {
      processingQueue.current = true;
      const drain = () => {
        const next = actionQueue.current.shift();
        if (next) {
          processAction(next);
          setTimeout(drain, 50); // 50ms gap lets React paint between actions
        } else {
          processingQueue.current = false;
        }
      };
      drain();
    }
  }, [syncState, processAction]);

  if (!visible) return null;

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (circumference * pct / 100);

  return (
    <div className="sync-overlay">
      <div className="sync-screen">
        <div className="sync-greeting">
          <h1>{getGreeting(userName || 'there')}</h1>
        </div>
        <div className="sync-greeting-sub">{subtitle}</div>

        <div className="sync-ring-area">
          <div className="sync-ring-wrap">
            <svg viewBox="0 0 120 120">
              <circle className="sync-ring-track" cx="60" cy="60" r="52" />
              <circle
                className="sync-ring-progress"
                cx="60" cy="60" r="52"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <span className="sync-ring-pct">{pct}%</span>
          </div>
        </div>

        <div className="sync-checklist">
          {STEPS.map((s, i) => {
            const isRevealed = revealedSteps.has(i);
            const isActive = activeStep === i;
            const isDone = completedSteps.has(i);
            const detailText = completedSteps.get(i) || '';

            let cls = 'sync-check-item';
            if (isDone) cls += ' done';
            else if (isActive) cls += ' active';
            else if (isRevealed) cls += ' revealed';

            let iconCls = 'sync-check-icon';
            if (isDone) iconCls += ' complete';
            else if (isActive) iconCls += ' spinning';
            else iconCls += ' pending';

            return (
              <div key={i} className={cls}>
                <div className={iconCls}>{isDone ? CHECKMARK : null}</div>
                <span className="sync-check-label">{s.label || `Judging ${userName || 'you'}...`}</span>
                <span className="sync-check-detail">{detailText}</span>
              </div>
            );
          })}
        </div>

        {roastData && (
          <div className={`sync-roast-card${roastVisible ? ' revealed' : ''}`}>
            <div className="sync-roast-header">
              <div className="sync-roast-avatar">S</div>
              <div>
                <div className="sync-roast-from">subscrub</div>
                <div className="sync-roast-from-sub">Your subscription critic</div>
              </div>
            </div>
            <div className="sync-roast-body" dangerouslySetInnerHTML={{ __html: roastData.roast }} />
            <div className="sync-roast-stats">
              <div className="sync-roast-stat">
                <span className="num" style={{ color: '#E85D50' }}>{roastData.deadCount}</span> inactive
              </div>
              <div className="sync-roast-stat">
                <span className="num" style={{ color: 'var(--accent)' }}>{roastData.favCount}</span> favourites
              </div>
              <div className="sync-roast-stat">
                <span className="num" style={{ color: getScoreColour(roastData.score) }}>{roastData.score}%</span> score
              </div>
            </div>
          </div>
        )}

        <div className={`sync-cta${ctaVisible ? ' revealed' : ''}`}>
          <button onClick={onClose}>
            Show me the damage
            <svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </button>
        </div>

        <div className={`sync-skip${ctaVisible ? ' revealed' : ''}`}>
          <button onClick={onClose}>Skip to dashboard</button>
        </div>
      </div>
    </div>
  );
}
