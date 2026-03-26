'use client';
import { useRef, useState, useCallback } from 'react';

export default function CriticAnimation() {
  const [animating, setAnimating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [stats, setStats] = useState({ reviewed: 0, active: 0, dead: 0, score: '—' });
  const [speechVisible, setSpeechVisible] = useState(false);
  const [speechContent, setSpeechContent] = useState('');
  const [tongueOut, setTongueOut] = useState(false);
  const [chamColour, setChamColour] = useState('mint');
  const [pupils, setPupils] = useState({ lx: 0, ly: 0, rx: 0, ry: 0 });
  const [deadState, setDeadState] = useState({ dead: false, running: false, eaten: false });
  const [cardsHidden, setCardsHidden] = useState(false);
  const [trackPaused, setTrackPaused] = useState(false);
  const [scrubVisible, setScrubVisible] = useState(false);
  const speechRef = useRef(null);
  const statsRef = useRef({ reviewed: 0, active: 0, dead: 0 });

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const updateStats = useCallback((r, a, d) => {
    statsRef.current = { reviewed: r, active: a, dead: d };
    setStats({ reviewed: r, active: a, dead: d, score: r > 0 ? Math.round((a / r) * 100) + '%' : '—' });
  }, []);

  const say = useCallback((text, typing) => {
    return new Promise(resolve => {
      setSpeechVisible(true);
      if (!typing) { setSpeechContent(text); resolve(); return; }
      setSpeechContent('');
      let i = 0;
      let current = '';
      function type() {
        if (i < text.length) {
          current += text[i]; i++;
          setSpeechContent(current + '▎');
          setTimeout(type, 22 + Math.random() * 18);
        } else {
          setSpeechContent(current);
          setTimeout(resolve, 300);
        }
      }
      type();
    });
  }, []);

  const startAnimation = useCallback(async () => {
    if (animating) return;
    setAnimating(true);
    setShowOverlay(false);
    let reviewed = 0, active = 0, dead = 0;
    updateStats(0, 0, 0);
    setChamColour('mint');
    setSpeechVisible(false);
    setTrackPaused(false);
    setDeadState({ dead: false, running: false, eaten: false });
    setCardsHidden(false);
    setScrubVisible(false);

    // Scanning phase
    const scanInterval = setInterval(() => {
      reviewed++; active++;
      updateStats(reviewed, active, dead);
      setPupils(p => ({ lx: p.lx > 0 ? -3 : 3, ly: 1, rx: p.rx > 0 ? -3 : 3, ry: 1 }));
    }, 1800);

    await sleep(800);
    await say('Premier League... Sports. Fine.', true);
    await sleep(1800);
    await say('Andrew Huang... Music. Approved.', true);
    await sleep(1800);
    await say('TLDR News... keeping you informed.', true);
    await sleep(1600);
    clearInterval(scanInterval);

    // Detection
    setChamColour('amber');
    setPupils({ lx: 0, ly: 2, rx: 0, ry: 2 });
    await say('Wait. What is this?', true);
    await sleep(1000);

    setChamColour('red');
    await say('DailyClick TV. No uploads in 14 months.', true);
    setPupils({ lx: 0, ly: 3, rx: 0, ry: 3 });
    await sleep(1000);

    // Isolate
    setDeadState(s => ({ ...s, dead: true }));
    setCardsHidden(true);
    await sleep(500);

    setDeadState(s => ({ ...s, running: true }));
    await say("Oh no you don't.", true);
    await sleep(1000);

    // Tongue snatch
    setTrackPaused(true);
    setPupils({ lx: 0, ly: 4, rx: 0, ry: 4 });
    setSpeechVisible(false);
    await sleep(300);

    setTongueOut(true);
    await sleep(200);

    setDeadState({ dead: true, running: false, eaten: true });
    dead++; reviewed++;
    updateStats(reviewed, active, dead);
    await sleep(350);

    setTongueOut(false);
    await sleep(400);

    // Verdict
    setScrubVisible(true);
    await say("Scrubbed. You're welcome.", true);
    await sleep(2500);
    setScrubVisible(false);

    // Resume
    setChamColour('mint');
    setPupils({ lx: 0, ly: 0, rx: 0, ry: 0 });
    setCardsHidden(false);
    await say('Now, where were we...', true);
    await sleep(1500);
    setSpeechVisible(false);
    setTrackPaused(false);

    const scanInterval2 = setInterval(() => {
      reviewed++; active++;
      updateStats(reviewed, active, dead);
      setPupils(p => ({ lx: p.lx > 0 ? -3 : 3, ly: 1, rx: p.rx > 0 ? -3 : 3, ry: 1 }));
    }, 1800);

    await sleep(4000);
    clearInterval(scanInterval2);
    await say('Another day, another feed scrubbed.', true);
    await sleep(2500);
    setSpeechVisible(false);
    setAnimating(false);
    setShowOverlay(true);
  }, [animating, say, updateStats]);

  const colours = {
    mint: { body: '#3ECFA0', crest: '#1D9E75', tail: '#1D9E75' },
    amber: { body: '#EF9F27', crest: '#BA7517', tail: '#BA7517' },
    red: { body: '#E85D50', crest: '#A32D2D', tail: '#A32D2D' },
  };
  const cc = colours[chamColour] || colours.mint;

  const channels = [
    { initials: 'PL', name: 'Premier League', color: 'var(--orange)', bg: 'rgba(232,135,92,0.15)', active: true },
    { initials: 'AH', name: 'Andrew Huang', color: 'var(--accent)', bg: 'rgba(62,207,160,0.1)', active: true },
    { initials: 'TD', name: 'TLDR News', color: 'var(--blue)', bg: 'rgba(55,138,221,0.1)', active: true },
    { initials: 'JR', name: 'PowerfulJRE', color: 'var(--purple)', bg: 'rgba(176,124,237,0.1)', active: true },
    { initials: 'DC', name: 'DailyClick TV', color: 'var(--red)', bg: 'rgba(232,93,80,0.1)', active: false, isDead: true },
    { initials: 'KT', name: 'Kill Tony', color: 'var(--amber)', bg: 'rgba(239,159,39,0.1)', active: true },
    { initials: 'RH', name: 'Ryan Holiday', color: 'var(--green)', bg: 'rgba(151,196,89,0.1)', active: true },
    { initials: 'NM', name: 'Novara Media', color: 'var(--pink)', bg: 'rgba(212,83,126,0.1)', active: true },
    { initials: 'JC', name: 'Jacob Collier', color: 'var(--accent)', bg: 'rgba(93,202,165,0.1)', active: true },
    { initials: 'NP', name: 'NPR Music', color: 'var(--blue)', bg: 'rgba(55,138,221,0.1)', active: true },
  ];
  // Duplicate for seamless loop
  const allChannels = [...channels, ...channels];

  return (
    <div className="ca-scene">
      {/* Play overlay */}
      {showOverlay && (
        <div className="ca-play-overlay" onClick={startAnimation}>
          <div className="ca-play-btn">
            <svg viewBox="0 0 24 24"><polygon points="6,3 20,12 6,21" fill="#111" /></svg>
          </div>
          <div className="ca-play-label">Watch The Critic work</div>
          <div className="ca-play-sub">~15 seconds</div>
        </div>
      )}

      {/* Stats */}
      <div className="ca-stats-bar">
        <div className="ca-stat"><div className="ca-stat-val" style={{ color: 'var(--accent)' }}>{stats.reviewed}</div><div className="ca-stat-label">Reviewed</div></div>
        <div className="ca-stat"><div className="ca-stat-val" style={{ color: 'var(--green)' }}>{stats.active}</div><div className="ca-stat-label">Active</div></div>
        <div className="ca-stat"><div className="ca-stat-val" style={{ color: 'var(--red)' }}>{stats.dead}</div><div className="ca-stat-label">Scrubbed</div></div>
        <div className="ca-stat"><div className="ca-stat-val" style={{ color: 'var(--amber)' }}>{stats.score}</div><div className="ca-stat-label">Score</div></div>
      </div>

      {/* Critic area */}
      <div className="ca-critic-area">
        <div className="ca-chameleon">
          <div className="ca-cham-crest" style={{ borderBottomColor: cc.crest }} />
          <div className="ca-cham-head" style={{ background: cc.body }}>
            <div className="ca-cham-eye-l">
              <div className="ca-cham-pupil" style={{ transform: `translate(calc(-50% + ${pupils.lx}px), calc(-50% + 3px + ${pupils.ly}px))` }} />
            </div>
            <div className="ca-cham-eye-r">
              <div className="ca-cham-pupil" style={{ transform: `translate(calc(-50% + ${pupils.rx}px), calc(-50% + 3px + ${pupils.ry}px))` }} />
            </div>
            <div className="ca-cham-mouth" />
          </div>
          <div className="ca-cham-body" style={{ background: cc.body }} />
          <div className="ca-cham-tail" style={{ borderColor: cc.tail, borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
          <div className={`ca-cham-tongue${tongueOut ? ' out' : ''}`}><div className="ca-cham-tongue-tip" /></div>
          <div className="ca-throne-base" />
          <div className="ca-throne-label">The Critic</div>
        </div>

        {/* Speech bubble */}
        <div className={`ca-speech${speechVisible ? ' show' : ''}`}>
          <div className="ca-speech-text" ref={speechRef}>{speechContent}</div>
        </div>
      </div>

      {/* Conveyor */}
      <div className="ca-conveyor-line" />
      <div className="ca-conveyor">
        <div className={`ca-track${trackPaused ? ' paused' : ''}`}>
          {allChannels.map((ch, i) => {
            const isDeadCard = ch.isDead;
            let cardClass = 'ca-ch-card';
            if (isDeadCard && deadState.dead) cardClass += ' dead';
            if (isDeadCard && deadState.running) cardClass += ' running';
            if (isDeadCard && deadState.eaten) cardClass += ' eaten';
            const hidden = cardsHidden && !isDeadCard;
            return (
              <div key={i} className={cardClass} style={hidden ? { opacity: 0, transform: 'scale(0.9)', transition: 'all 0.5s ease' } : { transition: 'all 0.5s ease' }}>
                {isDeadCard && <div className="ca-ch-dead-badge">!</div>}
                <div className="ca-ch-avatar" style={{ background: ch.bg, color: ch.color }}>{ch.initials}</div>
                <div className="ca-ch-name">{ch.name}</div>
                <div className="ca-ch-status">
                  <div className="ca-ch-status-dot" style={{ background: ch.active ? 'var(--green)' : 'var(--red)' }} />
                  {ch.active ? 'Active' : 'Dead'}
                </div>
                {isDeadCard && <div className="ca-ch-legs"><div className="ca-ch-leg" /><div className="ca-ch-leg" /></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrub popup */}
      <div className={`ca-scrub-popup${scrubVisible ? ' show' : ''}`}>
        <div className="ca-scrub-title">Channel scrubbed</div>
        <div className="ca-scrub-channel">DailyClick TV</div>
        <div className="ca-scrub-reasons">
          <div className="ca-scrub-reason"><div className="ca-scrub-dot" />No uploads in 14 months</div>
          <div className="ca-scrub-reason"><div className="ca-scrub-dot" />0 videos watched</div>
          <div className="ca-scrub-reason"><div className="ca-scrub-dot" />Subscribed since 2019</div>
        </div>
      </div>
    </div>
  );
}
