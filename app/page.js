import Link from 'next/link';
import styles from './page.module.css';
import SessionRedirect from './components/SessionRedirect';

const avatarColors = ['#E85D50','#378ADD','#3ECFA0','#EF9F27','#B07CED'];
const barWidths    = [[75,50],[85,40],[60,65],[70,35],[55,45]];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <SessionRedirect />

      {/* NAV */}
      <nav className={styles.nav}>
        <a href="/" className={`home-nav-brand ${styles.navBrand}`}>
          <img src="/icon.svg" alt="Freedly" className="home-nav-brand-icon" />
          <span className="home-nav-brand-wordmark">
            <span>free</span><span className="hnp-wordmark">dly</span>
          </span>
        </a>
        <ul className={styles.navLinks}>
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="/signin">Sign in</a></li>
          <li><a href="/signin" className={styles.navCta}>Get started</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Your subscriptions,<br/>freed from chaos.</h1>
          <p className={styles.heroSub}>
            Freedly sorts your subscriptions into clean, custom feeds automatically — so you only see what matters.
          </p>
          <div className={styles.heroButtons}>
            <a href="/signin" className={styles.btnPrimary}>
              Get started free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 8h10M9 4l4 4-4 4"/>
              </svg>
            </a>
            <a href="#features" className={styles.btnSecondary}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="6"/><polygon points="7,5.5 11,8 7,10.5" fill="currentColor" stroke="none"/>
              </svg>
              See how it works
            </a>
          </div>
          <p className={styles.heroMeta}>
            <svg viewBox="0 0 16 16" fill="none" strokeWidth="2" strokeLinecap="round" width="14" height="14" stroke="#38E9B1">
              <path d="M13.5 4.5l-7 7L3 8"/>
            </svg>
            Set up in under 2 minutes · Free plan available
          </p>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.productFrame}>
            <div className={styles.productTopbar}>
              <span className={styles.productLogo}><span>free</span>dly</span>
              <div className={styles.productTabs}>
                <span className={styles.tabActive}>Subscriptions</span>
                <span>Feeds</span>
                <span>Discover</span>
              </div>
            </div>
            <div className={styles.productBody}>
              <div className={styles.productSidebar}>
                {['All','Entertainment','Tech','Gaming','Music','News','Comedy','Sports'].map((c,i) => (
                  <div key={c} className={i === 1 ? `${styles.sidebarItem} ${styles.sidebarActive}` : styles.sidebarItem}>{c}</div>
                ))}
              </div>
              <div className={styles.productFeed}>
                {avatarColors.map((color, i) => (
                  <div key={i} className={styles.feedRow}>
                    <div className={styles.feedDot} style={{background: color}} />
                    <div className={styles.feedBars}>
                      <div className={styles.feedBar} style={{width: `${barWidths[i][0]}%`}} />
                      <div className={styles.feedBar} style={{width: `${barWidths[i][1]}%`, opacity: 0.5}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`${styles.floatCard} ${styles.floatCard1}`}>
            <div className={styles.floatNum}>146</div>
            <div className={styles.floatLabel}>channels you haven't<br/>watched in months</div>
          </div>
          <div className={`${styles.floatCard} ${styles.floatCard2}`}>
            <div className={`${styles.floatNum} ${styles.floatMint}`}>8</div>
            <div className={styles.floatLabel}>custom feeds<br/>created automatically</div>
          </div>
          <div className={`${styles.floatCard} ${styles.floatCard3}`}>
            <div className={styles.floatNum}>324</div>
            <div className={styles.floatLabel}>subscriptions<br/>sorted instantly</div>
          </div>
        </div>
      </section>

      {/* PROOF BAR */}
      <section className={styles.proofBar}>
        <div className={styles.proofInner}>
          <span>
            <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" strokeLinecap="round" width="16" height="16" stroke="#38E9B1">
              <circle cx="8" cy="8" r="7"/><path d="M5 8l2.5 2.5L11 6"/>
            </svg>
            Built for viewers, not creators
          </span>
          <div className={styles.proofDivider} />
          <span>
            <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" strokeLinecap="round" width="16" height="16" stroke="#38E9B1">
              <rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12"/>
            </svg>
            No algorithm interference
          </span>
          <div className={styles.proofDivider} />
          <span>
            <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" strokeLinecap="round" width="16" height="16" stroke="#38E9B1">
              <path d="M4 8l3 3 5-6"/>
            </svg>
            No missed uploads
          </span>
          <div className={styles.proofDivider} />
          <span>
            <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.5" strokeLinecap="round" width="16" height="16" stroke="#38E9B1">
              <path d="M8 3v5l3 2"/><circle cx="8" cy="8" r="6"/>
            </svg>
            Set up in 2 minutes
          </span>
        </div>
      </section>

      {/* FEATURES */}
      <section className={styles.features} id="features">
        <div className={styles.featuresHeader}>
          <h2>Everything in its place.</h2>
          <p>Connect your Google account and Freedly does the rest. Your subscriptions, sorted into feeds that actually make sense.</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconGreen}`}>
              <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" strokeLinecap="round" width="20" height="20" stroke="#38E9B1">
                <rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/>
                <rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/>
              </svg>
            </div>
            <h3>Auto-sorted subscriptions</h3>
            <p>Your channels are instantly grouped by topic — tech, sports, music, gaming, news — using YouTube's own category data. No manual work.</p>
            <div className={styles.featureStat}><span className={styles.statNum}>324</span> channels sorted in seconds</div>
          </div>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconAmber}`}>
              <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" strokeLinecap="round" width="20" height="20" stroke="#D4920D">
                <path d="M4 5h12M4 10h8M4 15h10"/>
              </svg>
            </div>
            <h3>Clean, focused feeds</h3>
            <p>Browse by category instead of one chaotic stream. Want just your tech channels? One click. Only favourites? Done. No algorithm deciding for you.</p>
            <div className={styles.featureStat}><span className={styles.statNum}>8</span> topic feeds generated</div>
          </div>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.iconBlue}`}>
              <svg viewBox="0 0 20 20" fill="none" strokeWidth="1.5" strokeLinecap="round" width="20" height="20" stroke="#378ADD">
                <circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 2.5"/>
              </svg>
            </div>
            <h3>Spot the dead weight</h3>
            <p>Freedly flags channels you haven't watched in months and inactive uploaders cluttering your feed. Clean house without losing anything good.</p>
            <div className={styles.featureStat}><span className={styles.statNum}>146</span> inactive channels found</div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className={styles.story} id="how-it-works">
        <div className={styles.storyInner}>
          <div className={styles.storyText}>
            <h2>I had 400+ subscriptions and no idea what half of them were.</h2>
            <p>YouTube's subscription page is a wall of noise. Videos from channels I forgot I subscribed to, buried between ones I actually care about. I wanted something that just... organised it for me.</p>
            <p>So I built Freedly. Connect your account, and it sorts everything into clean feeds automatically. No manual setup, no tagging — it just works.</p>
            <div className={styles.signature}>— The person building this</div>
          </div>
          <div className={styles.storyStats}>
            <div className={styles.storyStat}>
              <div className={styles.storyNum}>2min</div>
              <div className={styles.storyLabel}>Setup time</div>
            </div>
            <div className={styles.storyStat}>
              <div className={styles.storyNum}>100%</div>
              <div className={styles.storyLabel}>Automatic sorting</div>
            </div>
            <div className={styles.storyStat}>
              <div className={`${styles.storyNum} ${styles.storyNumMint}`}>0</div>
              <div className={styles.storyLabel}>Algorithm interference</div>
            </div>
            <div className={styles.storyStat}>
              <div className={styles.storyNum}>3</div>
              <div className={styles.storyLabel}>Feed views: list,<br/>grid, hybrid</div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className={styles.cta}>
        <h2>Ready to take back your feed?</h2>
        <p>Free to start. Set up in under 2 minutes. No credit card.</p>
        <a href="/signin" className={`${styles.btnPrimary} ${styles.btnLarge}`}>
          Get started free
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </a>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <span>© 2026 Freedly</span>
        <div className={styles.footerLinks}>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/blog">Blog</Link>
        </div>
      </footer>

    </div>
  );
}
