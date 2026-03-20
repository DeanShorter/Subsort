import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navLeft}>
            <img src="/logo-dark.svg" alt="freedly" height="26" />
            <div className={styles.navLinks}>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it Works</a>
              <a href="#pricing">Pricing</a>
              <Link href="/blog">Blog</Link>
            </div>
          </div>
          <div className={styles.navRight}>
            <a href="/signin" className={styles.navLogin}>Log in</a>
            <a href="/signin" className={styles.navCta}>Get started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Your feed.<br />Your rules.</h1>
          <p className={styles.heroDesc}>
            Freedly turns your subscriptions into clean,<br />
            custom feeds – so you see what matters,<br />
            when it matters.
          </p>
          <div className={styles.heroCtas}>
            <a href="/signin" className={styles.btnPrimary}>Get started free</a>
            <a href="#features" className={styles.btnSecondary}>View demo</a>
          </div>
          <p className={styles.heroTagline}>Free forever plan · Set up in minutes.</p>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.appMockup}>
            <div className={styles.mockupInner}>
              <div className={styles.mockupHeader}>
                <img src="/logo.svg" alt="freedly" height="16" />
                <div className={styles.mockupTabs}>
                  <span className={styles.mockupTabActive}>Subscriptions</span>
                  <span>Feeds</span>
                  <span>Discover</span>
                </div>
              </div>
              <div className={styles.mockupBody}>
                <div className={styles.mockupSidebar}>
                  {['All', 'Tech', 'Gaming', 'Music', 'News', 'Comedy', 'Sports'].map(c => (
                    <div key={c} className={styles.mockupCat}>{c}</div>
                  ))}
                </div>
                <div className={styles.mockupFeed}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={styles.mockupRow}>
                      <div className={styles.mockupAvatar} />
                      <div className={styles.mockupMeta}>
                        <div className={styles.mockupLine} />
                        <div className={`${styles.mockupLine} ${styles.mockupLineSm}`} />
                      </div>
                      <div className={styles.mockupThumb} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating stat cards */}
            <div className={`${styles.statCard} ${styles.statCard1}`}>
              <span className={styles.statNum}>146</span>
              <span className={styles.statLabel}>Inactive Channels</span>
            </div>
            <div className={`${styles.statCard} ${styles.statCard2}`}>
              <span className={styles.statNum}>12</span>
              <span className={styles.statLabel}>Uncategorised</span>
            </div>
            <div className={`${styles.statCard} ${styles.statCard3}`}>
              <div className={styles.statCard3Row}>
                <div>
                  <span className={styles.statSmall}>Entertainment</span>
                  <span className={styles.statLabel}>Feed Clean</span>
                </div>
                <span className={styles.statCheck}>✓</span>
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCard4}`}>
              <span className={styles.statSmall}>Health Score:</span>
              <span className={styles.statNum}>82</span>
            </div>
          </div>
        </div>
      </section>

      {/* What YouTube should have been */}
      <section className={styles.features} id="features">
        <h2 className={styles.featuresTitle}>What YouTube should have been.</h2>
        <p className={styles.featuresSubtitle}>
          YouTube is built for creators. <strong>Freedly</strong> is built for viewers like you.
        </p>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <h3>Organise your subscriptions</h3>
            <p>Group channels your way.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><line x1="4" y1="6" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="4" y1="14" x2="12" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <h3>Build clean feeds</h3>
            <p>Browse by category without algorithm distractions.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <h3>Stay in control</h3>
            <p>Spot inactive channels and keep your feed sharp.</p>
          </div>
        </div>
      </section>

      {/* Bottom tagline */}
      <div className={styles.bottomBar}>
        <span>No algorithm overload</span>
        <span className={styles.sep}>·</span>
        <span>No missed uploads</span>
        <span className={styles.sep}>·</span>
        <span>No subscription chaos</span>
      </div>

    </div>
  );
}
