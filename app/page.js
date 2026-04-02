import Link from 'next/link';
import SessionRedirect from './components/SessionRedirect';

export const metadata = {
  title: 'Subscrub — Your YouTube subscriptions, organised',
  description: 'Subscrub helps you manage, categorise, and clean up your YouTube subscriptions. With The Critic watching over your shoulder.',
};

export default function HomePage() {
  return (
    <div className="lp">
      <SessionRedirect />

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-logo"><span style={{ color: '#00A651' }}>SUB</span><span style={{ color: '#fff' }}>SCRUB</span></div>
        <div className="lp-nav-right">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#critic" className="lp-nav-link">The Critic</a>
          <a href="#pricing" className="lp-nav-link">Pricing</a>
          <Link href="/signin" className="lp-nav-link">Sign in</Link>
          <a href="#join" className="lp-nav-cta">Join the waitlist</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-badge"><div className="lp-hero-badge-dot" /> Coming soon</div>
        <h1>Your YouTube subscriptions, <em>organised.</em></h1>
        <p>Subscrub helps you manage, categorise, and clean up your YouTube subscriptions. With The Critic watching over your shoulder.</p>
        <div className="lp-hero-actions">
          <a href="#join" className="lp-btn-primary">
            Join the waitlist
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
          <a href="#features" className="lp-btn-secondary">See features</a>
        </div>
      </section>

      {/* PREVIEW */}
      <section className="lp-preview-section">
        <div className="lp-preview-frame">
          <div className="lp-preview-bar">
            <div className="lp-preview-dot" style={{ background: '#FF5F57' }} />
            <div className="lp-preview-dot" style={{ background: '#FEBC2E' }} />
            <div className="lp-preview-dot" style={{ background: '#28C840' }} />
          </div>
          <div className="lp-preview-body">
            <div className="lp-preview-sidebar">
              <div style={{ marginBottom: 16 }}>
                <div className="lp-nav-logo" style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                  <span style={{ color: '#00A651' }}>SUB</span><span style={{ color: '#fff' }}>SCRUB</span>
                </div>
              </div>
              <div className="lp-preview-nav-item active"><div className="lp-preview-nav-dot" style={{ background: '#fff' }} /> Home</div>
              <div className="lp-preview-nav-item"><div className="lp-preview-nav-dot" style={{ background: 'var(--lp-green)' }} /> Subscriptions</div>
              <div className="lp-preview-nav-item"><div className="lp-preview-nav-dot" style={{ background: 'var(--lp-orange)' }} /> Feed</div>
              <div className="lp-preview-nav-item"><div className="lp-preview-nav-dot" style={{ background: 'var(--lp-iris)' }} /> Discover</div>
              <div style={{ height: 1, background: '#e0e0e0', margin: '8px 0' }} />
              <div className="lp-preview-nav-item"><div className="lp-preview-nav-dot" style={{ background: 'var(--lp-ocean)' }} /> Stash</div>
            </div>
            <div className="lp-preview-main">
              <div className="lp-preview-card">
                <div className="lp-preview-card-head" style={{ background: 'var(--lp-green)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.8 3.6L13 5.7l-3 2.8.7 4.1L7 10.5l-3.7 2.1.7-4.1-3-2.8 4.2-.6z" fill="#fff" /></svg>
                    <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>The Critic</span>
                  </div>
                </div>
                <div className="lp-preview-card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="lp-preview-score">99%</div>
                  <div>
                    <div className="lp-preview-card-title">Not bad, Dean.</div>
                    <div className="lp-preview-card-text">322 active channels out of 326. Keep going.</div>
                  </div>
                </div>
              </div>
              <div className="lp-preview-row">
                <div className="lp-preview-insight">
                  <div className="lp-preview-insight-stat" style={{ color: 'var(--lp-green)' }}>3</div>
                  <div className="lp-preview-insight-label" style={{ color: 'var(--lp-green-text)' }}>uncategorised</div>
                  <div className="lp-preview-insight-cta" style={{ background: 'var(--lp-green)' }}>Auto-sort</div>
                </div>
                <div className="lp-preview-insight">
                  <div className="lp-preview-insight-stat" style={{ color: 'var(--lp-orange)' }}>10</div>
                  <div className="lp-preview-insight-label" style={{ color: 'var(--lp-orange-text)' }}>7+ year subs</div>
                  <div className="lp-preview-insight-cta" style={{ background: 'var(--lp-orange)' }}>Review</div>
                </div>
                <div className="lp-preview-insight">
                  <div className="lp-preview-insight-stat" style={{ color: 'var(--lp-iris)' }}>6</div>
                  <div className="lp-preview-insight-label" style={{ color: 'var(--lp-iris-text)' }}>favourites</div>
                  <div className="lp-preview-insight-cta" style={{ background: 'var(--lp-iris)' }}>Discover</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-features" id="features">
        <div className="lp-features-label">FEATURES</div>
        <h2>Everything you need to take control</h2>
        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <div className="lp-feature-icon" style={{ background: 'var(--lp-green-soft)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M5 10h10M7 15h6" stroke="var(--lp-green)" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <div className="lp-feature-title">Smart categories</div>
            <div className="lp-feature-text">Auto-sort your subscriptions into categories and subcategories. Or organise them your way.</div>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon" style={{ background: 'var(--lp-orange-soft)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="var(--lp-orange)" strokeWidth="1.5" /><path d="M10 6v4l3 2" stroke="var(--lp-orange)" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <div className="lp-feature-title">Activity tracking</div>
            <div className="lp-feature-text">See which channels you actually watch and which ones are collecting dust.</div>
          </div>
          <div className="lp-feature-card">
            <div className="lp-feature-icon" style={{ background: 'var(--lp-iris-soft)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3l2.5 5 5.5.8-4 3.8 1 5.4L10 15l-5 3 1-5.4-4-3.8 5.5-.8z" stroke="var(--lp-iris)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="lp-feature-title">The Critic</div>
            <div className="lp-feature-text">Your personal subscription advisor. Opinionated, observant, and occasionally cheeky.</div>
          </div>
        </div>
      </section>

      {/* CRITIC SECTION */}
      <section className="lp-critic-section" id="critic">
        <div className="lp-critic-inner">
          <h2>Meet The Critic</h2>
          <p>An opinionated guide that watches your habits, spots patterns, and tells you what you need to hear. With a smile.</p>
          <div className="lp-critic-cards">
            <div className="lp-critic-card">
              <div className="lp-critic-card-head" style={{ background: 'var(--lp-green-soft)' }}>
                <div className="lp-critic-card-icon" style={{ background: 'var(--lp-green)' }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3 3 .4-2.2 2.1.5 3L6 8l-2.8 1.5.5-3L1.5 4.4l3-.4z" fill="#fff" /></svg></div>
                <span className="lp-critic-card-mood" style={{ color: 'var(--lp-green-text)' }}>Impressed</span>
              </div>
              <div className="lp-critic-card-body">
                <div className="lp-critic-card-quote">&ldquo;322 out of 326 active. Not bad. Not bad at all.&rdquo;</div>
              </div>
            </div>
            <div className="lp-critic-card">
              <div className="lp-critic-card-head" style={{ background: 'var(--lp-orange-soft)' }}>
                <div className="lp-critic-card-icon" style={{ background: 'var(--lp-orange)' }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3 3 .4-2.2 2.1.5 3L6 8l-2.8 1.5.5-3L1.5 4.4l3-.4z" fill="#fff" /></svg></div>
                <span className="lp-critic-card-mood" style={{ color: 'var(--lp-orange-text)' }}>Fired up</span>
              </div>
              <div className="lp-critic-card-body">
                <div className="lp-critic-card-quote">&ldquo;38 channels for 7 years. That&rsquo;s not loyalty, that&rsquo;s hoarding.&rdquo;</div>
              </div>
            </div>
            <div className="lp-critic-card">
              <div className="lp-critic-card-head" style={{ background: 'var(--lp-iris-soft)' }}>
                <div className="lp-critic-card-icon" style={{ background: 'var(--lp-iris)' }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3 3 .4-2.2 2.1.5 3L6 8l-2.8 1.5.5-3L1.5 4.4l3-.4z" fill="#fff" /></svg></div>
                <span className="lp-critic-card-mood" style={{ color: 'var(--lp-iris-text)' }}>Curious</span>
              </div>
              <div className="lp-critic-card-body">
                <div className="lp-critic-card-quote">&ldquo;Found 12 channels you might like. No pressure. Much.&rdquo;</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="lp-pricing" id="pricing">
        <h2>Simple pricing</h2>
        <p>Start free. Upgrade when your subscriptions demand it.</p>
        <div className="lp-pricing-cards">
          <div className="lp-pricing-card">
            <div className="lp-pricing-badge" style={{ background: 'var(--lp-bg)', color: 'var(--lp-txt-mid)' }}>Free</div>
            <h3>Starter</h3>
            <div className="lp-pricing-price">&pound;0 <span>/month</span></div>
            <div className="lp-pricing-period">Up to 50 subscriptions</div>
            <ul className="lp-pricing-list">
              <li>All features included</li>
              <li>Smart categories</li>
              <li>The Critic</li>
              <li>Activity tracking</li>
            </ul>
            <button className="lp-pricing-btn" style={{ background: 'var(--lp-bg)', color: 'var(--lp-txt-mid)' }}>Get started free</button>
          </div>
          <div className="lp-pricing-card featured">
            <div className="lp-pricing-badge" style={{ background: 'var(--lp-green-soft)', color: 'var(--lp-green-text)' }}>Popular</div>
            <h3>Pro</h3>
            <div className="lp-pricing-price" style={{ color: 'var(--lp-green)' }}>&pound;3 <span>/month</span></div>
            <div className="lp-pricing-period">or &pound;24/year &mdash; save 33%</div>
            <ul className="lp-pricing-list">
              <li>Unlimited subscriptions</li>
              <li>Chrome extension</li>
              <li>Subscrub Stash</li>
              <li>Priority support</li>
            </ul>
            <button className="lp-pricing-btn" style={{ background: 'var(--lp-green)', color: '#fff' }}>Upgrade to Pro</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta-section" id="join">
        <div className="lp-cta-inner">
          <h2>Get early access</h2>
          <p>Join the waitlist and be one of the first to try Subscrub. The Critic is already judging your subscriptions.</p>
          <div className="lp-cta-email">
            <input type="email" placeholder="Your email address" />
            <button>Join waitlist</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-logo"><span style={{ color: '#00A651' }}>SUB</span><span style={{ color: '#fff' }}>SCRUB</span></div>
        <div className="lp-footer-text">Built in Stockport. For YouTube addicts everywhere.</div>
      </footer>
    </div>
  );
}
