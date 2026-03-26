'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const STEPS = [
  { label: 'Connecting to YouTube' },
  { label: 'Pulling subscriptions' },
  { label: 'Scanning for uploads' },
  { label: 'Sorting into categories' },
  { label: 'Scrutinising the mess' },
  { label: null }, // dynamic — "Judging {name}..."
];

function getGreeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name}.`;
}

export default function SyncModal({ visible, onClose, userName, syncState }) {
  const [steps, setSteps] = useState(() => STEPS.map(() => ({ status: 'pending', val: '' })));
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Starting...');
  const [speech, setSpeech] = useState({ visible: false, text: '' });
  const [subtitle, setSubtitle] = useState("The Critic is reviewing your subscriptions. This won't take long.");
  const [verdict, setVerdict] = useState(null);
  const speechRef = useRef(null);
  const typingRef = useRef(false);

  const name = userName || 'there';

  // Typing effect for critic speech
  const say = useCallback((text) => {
    return new Promise(resolve => {
      typingRef.current = true;
      setSpeech({ visible: true, text: '' });
      let i = 0;
      let current = '';
      function type() {
        if (i < text.length) {
          current += text[i]; i++;
          setSpeech({ visible: true, text: current + '▎' });
          setTimeout(type, 20 + Math.random() * 15);
        } else {
          setSpeech({ visible: true, text: current });
          typingRef.current = false;
          setTimeout(resolve, 300);
        }
      }
      type();
    });
  }, []);

  const activateStep = useCallback((n) => {
    setSteps(prev => prev.map((s, i) => i === n ? { ...s, status: 'active' } : s));
  }, []);

  const completeStep = useCallback((n, val, warn) => {
    setSteps(prev => prev.map((s, i) => i === n ? { status: warn ? 'warn' : 'done', val: val || '' } : s));
  }, []);

  // React to syncState changes from the sidebar auto-sync
  useEffect(() => {
    if (!syncState || !visible) return;

    const { step, detail, prevStep, prevDetail } = syncState;

    // Complete previous step
    if (prevStep !== undefined && prevDetail) {
      const isWarn = prevDetail.includes('expired') || prevDetail.includes('issue') || prevDetail.includes('!');
      completeStep(prevStep, prevDetail, isWarn);
    }

    // Activate current step
    if (step !== undefined) {
      activateStep(step);
    }

    // Update progress
    if (syncState.progress) {
      setProgress(syncState.progress);
    }
    if (syncState.progressLabel) {
      setProgressLabel(syncState.progressLabel);
    }

    // Speech
    if (syncState.speech) {
      say(syncState.speech);
    }

    // Subtitle update
    if (syncState.subtitle) {
      setSubtitle(syncState.subtitle);
    }

    // Complete / verdict
    if (syncState.complete) {
      setSpeech({ visible: false, text: '' });
      setSubtitle('The Critic has reached a verdict.');
      setProgress(100);
      setProgressLabel('Complete');

      // Build verdict from data
      const channels = syncState.channelCount || 0;
      const cats = syncState.categoryCount || 0;
      const inactive = syncState.inactiveCount || 0;
      const score = channels > 0 ? Math.max(0, Math.min(100, Math.round(((channels - inactive) / channels) * 100))) : 0;

      setVerdict({
        score,
        greeting: `Getting there, ${name}.`,
        roast: `"${channels} subscriptions and you engage with ${channels - inactive} of them. The other ${inactive} are just paying emotional rent in your feed."`,
        attrib: `— The Critic, based on ${channels} subscriptions`,
      });
    }
  }, [syncState, visible, activateStep, completeStep, say, name]);

  // Reset on open
  useEffect(() => {
    if (visible) {
      setSteps(STEPS.map(() => ({ status: 'pending', val: '' })));
      setProgress(0);
      setProgressLabel('Starting...');
      setSpeech({ visible: false, text: '' });
      setSubtitle("The Critic is reviewing your subscriptions. This won't take long.");
      setVerdict(null);
    }
  }, [visible]);

  if (!visible) return null;

  const stepLabels = STEPS.map((s, i) => s.label || `Judging ${name}...`);
  const scoreColor = verdict ? (verdict.score >= 75 ? 'var(--accent)' : verdict.score >= 50 ? 'var(--amber)' : 'var(--red)') : 'var(--amber)';
  const dashoffset = verdict ? 132 - (132 * verdict.score / 100) : 46.2;

  return (
    <div className="sync-overlay">
      <div className="sync-screen">
        {/* Greeting */}
        <div className="sync-greeting">
          <h1>{getGreeting(name).split(name)[0]}<span>{name}</span>.</h1>
        </div>
        <div className="sync-sub">{subtitle}</div>

        {/* Critic speech */}
        <div className={`sync-critic-speech${speech.visible ? ' show' : ''}`}>
          <div className="sync-critic-tag">The Critic</div>
          <div className="sync-critic-text">{speech.text}</div>
        </div>

        {/* Checklist */}
        <div className="sync-checklist">
          {steps.map((s, i) => (
            <div key={i} className={`sync-check-item${s.status === 'active' ? ' active' : ''}${s.status === 'done' || s.status === 'warn' ? ' done' : ''}`}>
              <div className={`sync-check-icon ${s.status === 'active' ? 'spinning' : s.status === 'done' ? 'done' : s.status === 'warn' ? 'warn' : 'pending'}`}>
                {s.status === 'done' && '✓'}
                {s.status === 'warn' && '!'}
              </div>
              <div className="sync-check-label">{stepLabels[i]}</div>
              <div className="sync-check-val" style={s.status === 'warn' ? { color: 'var(--amber)' } : {}}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="sync-progress-wrap">
          <div className="sync-progress-bar">
            <div className="sync-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="sync-progress-meta">
            <span className="sync-progress-label">{progressLabel}</span>
            <span className="sync-progress-pct">{progress}%</span>
          </div>
        </div>

        {/* Verdict card */}
        {verdict && (
          <div className="sync-verdict show">
            <div className="sync-verdict-header">
              <div className="sync-verdict-tag">The Critic</div>
            </div>
            <div className="sync-verdict-body">
              <div className="sync-verdict-ring">
                <div className="sync-verdict-pulse" />
                <svg viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="21" fill="none" stroke="var(--surface-3)" strokeWidth="3.5" />
                  <circle cx="26" cy="26" r="21" fill="none" stroke={scoreColor} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="132" strokeDashoffset={dashoffset} transform="rotate(-90 26 26)" />
                </svg>
                <span className="sync-verdict-score" style={{ color: scoreColor }}>{verdict.score}%</span>
              </div>
              <div className="sync-verdict-content">
                <div className="sync-verdict-greeting">{verdict.greeting}</div>
                <div className="sync-verdict-roast">{verdict.roast}</div>
                <div className="sync-verdict-attrib">{verdict.attrib}</div>
              </div>
            </div>
            <div className="sync-verdict-cta">
              <button className="sync-btn-primary" onClick={onClose}>Show me the damage</button>
              <button className="sync-btn-ghost" onClick={onClose}>Skip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
