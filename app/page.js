import Link from 'next/link';
import SessionRedirect from './components/SessionRedirect';
import FloatingRoasts from './components/FloatingRoasts';

export const metadata = {
  title: 'subscrub — Your subscriptions, scrubbed of chaos',
  description: 'Sort your YouTube subscriptions into clean feeds automatically. Meet The Critic — your subscription accountability partner.',
};

export default function HomePage() {
  return (
    <div className="lp">
      <SessionRedirect />
      <FloatingRoasts />

      {/* NAV */}
      <nav className="lp-nav">
        <a href="/" className="lp-logo"><span>sub</span>scrub</a>
        <div className="lp-nav-links">
          <a className="lp-nav-link" href="#how">How it works</a>
          <a className="lp-nav-link" href="#features">Features</a>
          <a className="lp-nav-link" href="#pricing">Pricing</a>
          <Link className="lp-nav-cta" href="/signin">Get started free</Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="lp-hero">
        <h1>Your YouTube subscriptions are a mess. <em>subscrub</em> fixes that.</h1>
        <p className="lp-hero-sub">Connect your account and subscrub sorts your subscriptions into clean, organised feeds automatically. No manual work. No algorithm. Just your channels, finally making sense.</p>
        <div className="lp-hero-ctas">
          <Link className="lp-btn-hero primary" href="/signin">Get started free</Link>
          <a className="lp-btn-hero secondary" href="#how">See how it works</a>
        </div>
        <p className="lp-hero-note">Set up in 2 minutes · Free plan available · No credit card</p>
        <div className="lp-hero-stats">
          <div className="lp-hero-stat"><div className="lp-hero-stat-val" style={{ color: 'var(--accent)' }}>326</div><div className="lp-hero-stat-label">Subscriptions sorted instantly</div></div>
          <div className="lp-hero-stat"><div className="lp-hero-stat-val" style={{ color: 'var(--blue)' }}>14</div><div className="lp-hero-stat-label">Categories auto-created</div></div>
          <div className="lp-hero-stat"><div className="lp-hero-stat-val" style={{ color: 'var(--red)' }}>52</div><div className="lp-hero-stat-label">Inactive channels flagged</div></div>
        </div>

        {/* Mini app preview */}
        <div className="lp-preview">
          <div className="lp-prev-topbar">
            <div className="lp-prev-dot" style={{ background: 'var(--red)', opacity: 0.6 }} />
            <div className="lp-prev-dot" style={{ background: 'var(--amber)', opacity: 0.6 }} />
            <div className="lp-prev-dot" style={{ background: 'var(--accent)', opacity: 0.6 }} />
            <div className="lp-prev-url">getsubscrub.com/home</div>
          </div>
          <div className="lp-prev-body">
            <div className="lp-prev-sidebar">
              {['Home','Subs','Feed','Discover','Insights'].map((s, i) => (
                <div key={s} className={`lp-prev-sb-item${i === 0 ? ' active' : ''}`} />
              ))}
              <div className="lp-prev-sb-label">Categories</div>
              {[['Sports','var(--orange)'],['Music','var(--accent)'],['News','var(--amber)'],['Entertainment','var(--red)']].map(([n, c]) => (
                <div key={n} className="lp-prev-sb-cat"><div className="lp-prev-sb-dot" style={{ background: c }} />{n}</div>
              ))}
            </div>
            <div className="lp-prev-content">
              <div className="lp-prev-critic">
                <div className="lp-prev-critic-ring">65</div>
                <div className="lp-prev-critic-text">
                  <div className="lp-prev-critic-title">The Critic</div>
                  <div className="lp-prev-critic-roast">"326 subscriptions. You engage with 87. The rest are just vibes."</div>
                </div>
              </div>
              <div className="lp-prev-grid">
                {['#2a4a7f','#4a2a6f','#6f4a2a','#2a6f4a','#5a2a4a','#3a5a2a'].map((c, i) => (
                  <div key={i} className="lp-prev-card">
                    <div className="lp-prev-card-thumb" style={{ background: `linear-gradient(135deg,${c},${c}88)` }} />
                    <div className="lp-prev-card-info"><div className="lp-prev-bar" style={{ width: `${70 + i * 3}%` }} /><div className="lp-prev-bar" style={{ width: `${40 + i * 3}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ENTER THE CRITIC */}
      <div className="lp-section lp-sg-critic">
        <div className="lp-section-label">But that's not all</div>
        <h2 className="lp-section-h2">Every kingdom needs a ruler.</h2>
        <p className="lp-section-sub">subscrub doesn't just sort your subscriptions — it holds you accountable. Meet The Critic: the resident judge of your feed. Keep your subscriptions in order and The Critic stays happy. Let things slip... and it gets personal.</p>
        <div className="lp-critic-faces">
          <div className="lp-critic-face kind">
            <span className="lp-critic-face-emoji">😎</span>
            <div className="lp-critic-face-title">A kind ruler</div>
            <div className="lp-critic-face-sub">When you maintain your feed, The Critic is your biggest fan.</div>
            <div className="lp-critic-face-quote">"<strong>Not bad.</strong> You scrubbed 8 channels last week and your score jumped 4 points. I'm almost proud of you."</div>
          </div>
          <div className="lp-critic-face tyrant">
            <span className="lp-critic-face-emoji">😡</span>
            <div className="lp-critic-face-title">Or a tyrant</div>
            <div className="lp-critic-face-sub">Ignore The Critic's recommendations and its patience wears thin.</div>
            <div className="lp-critic-face-quote">"Remember when you said you'd fix your feed? That was <strong>3 weeks ago.</strong> You've subscribed to 4 more channels since. Unbelievable."</div>
          </div>
        </div>
      </div>

      <div className="lp-sep mint-amber"><div className="lp-sep-line" /><div className="lp-sep-dot left" style={{ background: 'var(--accent)' }} /><div className="lp-sep-dot right" style={{ background: 'var(--amber)' }} /></div>

      {/* HOW IT WORKS */}
      <div className="lp-section lp-sg-steps" id="how">
        <div className="lp-section-label">How it works</div>
        <h2 className="lp-section-h2">Connect. Get sorted. Get roasted.</h2>
        <p className="lp-section-sub">The Critic handles the analysis. You handle the consequences.</p>
        <div className="lp-steps">
          {[
            { num: '01', icon: '🔗', title: 'Connect', desc: 'Link your Google account. subscrub pulls your subscriptions. The Critic starts judging immediately.' },
            { num: '02', icon: '📂', title: 'Auto-sort', desc: 'Your channels are instantly sorted into categories — tech, sports, music, news. No manual tagging.' },
            { num: '03', icon: '📋', title: 'Get your verdict', desc: "The Critic delivers your score, a roast, and a task list of things to fix. It doesn't sugarcoat." },
            { num: '04', icon: '🧹', title: 'Scrub', desc: "Complete the tasks. Watch your score climb. Keep The Critic happy. Or don't — it's your feed." },
          ].map(s => (
            <div key={s.num} className="lp-step">
              <div className="lp-step-num">{s.num}</div>
              <div className="lp-step-icon">{s.icon}</div>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-sep amber-red"><div className="lp-sep-line" /><div className="lp-sep-dot left" style={{ background: 'var(--amber)' }} /><div className="lp-sep-dot right" style={{ background: 'var(--red)' }} /></div>

      {/* MOOD TIMELINE */}
      <div className="lp-section lp-sg-moods">
        <div className="lp-section-label">The Critic's patience</div>
        <h2 className="lp-section-h2">It tracks how long since your last scrub.</h2>
        <p className="lp-section-sub">The longer you wait, the less patient it gets. Your choice.</p>
        <div className="lp-mood-timeline">
          {[
            { emoji: '😎', label: 'Kind', days: '0-3 days', quote: '"I\'m almost proud."', color: 'var(--accent)' },
            { emoji: '😐', label: 'Nudging', days: '4-7 days', quote: '"Those channels aren\'t going to scrub themselves."', color: 'var(--amber)' },
            { emoji: '😤', label: 'Impatient', days: '1-2 weeks', quote: '"I gave you a list. You ignored it."', color: 'var(--amber)' },
            { emoji: '😡', label: 'Annoyed', days: '2-4 weeks', quote: '"I can\'t help someone who won\'t help themselves."', color: 'var(--red)' },
            { emoji: '💀', label: 'Giving up', days: '4+ weeks', quote: '"You and your dead channels deserve each other."', color: 'var(--text-dim)' },
          ].map(m => (
            <div key={m.label} className="lp-mood-step">
              <div className="lp-mood-dot" style={{ background: m.color }}><span>{m.emoji}</span></div>
              <div className="lp-mood-label" style={{ color: m.color }}>{m.label}</div>
              <div className="lp-mood-days">{m.days}</div>
              <div className="lp-mood-quote">{m.quote}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-sep red-mint"><div className="lp-sep-line" /><div className="lp-sep-dot left" style={{ background: 'var(--red)' }} /><div className="lp-sep-dot right" style={{ background: 'var(--accent)' }} /></div>

      {/* FEATURES */}
      <div className="lp-section lp-sg-features" id="features">
        <div className="lp-section-label">Features</div>
        <h2 className="lp-section-h2">Everything you need. Nothing you don't.</h2>
        <p className="lp-section-sub">subscrub organises your subscriptions. The Critic keeps you honest.</p>
        <div className="lp-features-grid">
          {[
            { icon: '📂', title: 'Auto-sorted categories', desc: 'Channels sorted into topics instantly. Create subcategories to go deeper.', stat: '326', statLabel: 'sorted in seconds' },
            { icon: '📺', title: 'Clean, focused feed', desc: 'Browse by category. See today\'s uploads grouped by topic. Watch inline.', stat: '14', statLabel: 'topic feeds generated' },
            { icon: '👻', title: 'Dead weight detection', desc: 'The Critic flags channels you never watch, inactive uploaders, and clickbait.', stat: '52', statLabel: 'channels flagged', statColor: 'var(--red)' },
            { icon: '🧭', title: 'Discover channels', desc: 'Find channels you\'ll actually like based on your interests.' },
            { icon: '🏆', title: 'Badges and streaks', desc: 'Earn achievements for cleaning your feed. The Critic awards them reluctantly.' },
            { icon: '📊', title: 'Watch insights', desc: 'What you subscribe to versus what you actually watch. The gap is usually embarrassing.' },
          ].map(f => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon">{f.icon}</div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-desc">{f.desc}</div>
              {f.stat && <><div className="lp-feature-stat" style={f.statColor ? { color: f.statColor } : {}}>{f.stat}</div><div className="lp-feature-stat-label">{f.statLabel}</div></>}
            </div>
          ))}
        </div>
      </div>

      <div className="lp-sep mint-purple"><div className="lp-sep-line" /><div className="lp-sep-dot left" style={{ background: 'var(--accent)' }} /><div className="lp-sep-dot right" style={{ background: 'var(--purple)' }} /></div>

      {/* PRICING */}
      <div className="lp-section lp-sg-pricing" id="pricing">
        <div className="lp-section-label">Pricing</div>
        <h2 className="lp-section-h2">Start free. Go Pro when you're ready.</h2>
        <p className="lp-section-sub">The Critic's basic verdict is free. The full breakdown costs less than a coffee.</p>
        <div className="lp-pricing-grid">
          <div className="lp-price-card">
            <div className="lp-price-name">Free</div>
            <div className="lp-price-sub">Get organised</div>
            <div className="lp-price-amount">£0 <span>/ forever</span></div>
            <ul className="lp-price-features">
              <li>Auto-sort subscriptions</li>
              <li>The Critic's verdict</li>
              <li>Category feeds</li>
              <li>Inactive flagging</li>
              <li>Discover channels</li>
            </ul>
            <Link className="lp-price-cta free" href="/signin">Get started free</Link>
          </div>
          <div className="lp-price-card pro">
            <div className="lp-price-name">Pro</div>
            <div className="lp-price-sub">Get the full picture</div>
            <div className="lp-price-amount">£4.99 <span>/ month</span></div>
            <ul className="lp-price-features">
              <li>Everything in Free</li>
              <li>Auto subcategories</li>
              <li>Watch analytics</li>
              <li>Smart recommendations</li>
              <li>Saves and collections</li>
            </ul>
            <Link className="lp-price-cta pro-btn" href="/signin">Upgrade to Pro</Link>
          </div>
        </div>
      </div>

      <div className="lp-sep blue-amber"><div className="lp-sep-line" /><div className="lp-sep-dot left" style={{ background: 'var(--blue)' }} /><div className="lp-sep-dot right" style={{ background: 'var(--amber)' }} /></div>

      {/* STORY */}
      <div className="lp-section lp-sg-story">
        <div className="lp-section-label">Why this exists</div>
        <div className="lp-story">
          <p className="lp-story-text">"I had <strong>400+ subscriptions</strong> and no idea what half of them were. YouTube's subscription page is a wall of noise. I wanted something that just organised it. So I built subscrub. Then I added The Critic because I needed someone to hold me accountable for the mess I'd created."</p>
          <p className="lp-story-author">— The person who built this (and scored 43% on their first scan)</p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="lp-final-cta">
        <h2>Your subscriptions won't<br />scrub themselves.</h2>
        <p>Free to start. Set up in 2 minutes. The Critic is already waiting.</p>
        <div className="lp-hero-ctas">
          <Link className="lp-btn-hero primary" href="/signin">Get started free</Link>
        </div>
        <div className="lp-trust-row">
          <span>🔒 Google OAuth only</span>
          <span>👁 Read-only access</span>
          <span>🚫 No algorithm</span>
          <span>⚡ 2 minute setup</span>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <span className="lp-footer-left">© 2026 subscrub</span>
        <div className="lp-footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/blog">Blog</Link>
        </div>
      </footer>
    </div>
  );
}
