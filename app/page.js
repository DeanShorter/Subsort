import Link from 'next/link';
import styles from './page.module.css';

const avatarColors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6'];

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
            <a href="/signin" className={styles.navLogin}>Sign in</a>
            <a href="/signin" className={styles.navCta}>Get started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>
              Your YouTube.<br />
              Finally organised.
            </h1>
            <p className={styles.heroSub}>What YouTube should have been.</p>
            <p className={styles.heroDesc}>
              Freedly organises your subscriptions into clean, custom feeds – so you only see what matters.
            </p>
            <div className={styles.heroCtas}>
              <a href="/signin" className={styles.btnPrimary}>Get started free</a>
              <a href="#features" className={styles.btnSecondary}>See how it works</a>
            </div>
            <p className={styles.heroTagline}>Set up in under 2 minutes · Free plan available</p>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.appMockup}>
              <div className={styles.mockupInner}>
                <div className={styles.mockupHeader}>
                  <img src="/logo.svg" alt="freedly" height="15" />
                  <div className={styles.mockupTabs}>
                    <span className={styles.mockupTabActive}>Subscriptions</span>
                    <span>Feeds</span>
                    <span>Discover</span>
                  </div>
                </div>
                <div className={styles.mockupBody}>
                  <div className={styles.mockupSidebar}>
                    {['All','Tech','Gaming','Music','News','Comedy','Sports'].map((c,i) => (
                      <div key={c} className={i === 0 ? `${styles.mockupCat} ${styles.mockupCatActive}` : styles.mockupCat}>{c}</div>
                    ))}
                  </div>
                  <div className={styles.mockupFeed}>
                    <div className={styles.mockupSubTabs}>
                      <span className={styles.mockupSubActive}>Entertainment</span>
                      <span className={styles.mockupSubTab}>Feeds</span>
                      <span className={styles.mockupSubTab}>Discover</span>
                    </div>
                    {avatarColors.map((color, i) => (
                      <div key={i} className={styles.mockupRow}>
                        <div className={styles.mockupAvatar} style={{background: color}} />
                        <div className={styles.mockupMeta}>
                          <div className={styles.mockupLine} />
                          <div className={`${styles.mockupLine} ${styles.mockupLineSm}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating stat cards */}
              <div className={`${styles.statCard} ${styles.statCard1}`}>
                <span className={styles.statNum}>146</span>
                <span className={styles.statLabel}>channels you haven't watched<br/>in months</span>
              </div>
              <div className={`${styles.statCard} ${styles.statCard2}`}>
                <span className={styles.statNum}>12</span>
                <span className={styles.statLabel}>still uncategorised</span>
              </div>
              <div className={`${styles.statCard} ${styles.statCard3}`}>
                <div className={styles.statCard3Row}>
                  <div className={styles.statCard3Icon}>
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <rect x="3" y="3" width="14" height="14" rx="3" fill="#38E9B1" opacity=".25"/>
                      <rect x="3" y="3" width="14" height="14" rx="3" stroke="#38E9B1" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div>
                    <span className={styles.statSmall}>Entertainment</span>
                    <span className={styles.statLabel}>feed: <strong>Clean</strong></span>
                  </div>
                  <div className={styles.statCheckCircle}>
                    <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                      <circle cx="10" cy="10" r="9" fill="#38E9B1"/>
                      <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className={`${styles.statCard} ${styles.statCard4}`}>
                <span className={styles.statSmall}>Health Score</span>
                <span className={styles.statNum}>82</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features} id="features">
        <div className={styles.featuresInner}>
          <h2 className={styles.featuresTitle}>What YouTube should have been.</h2>
          <p className={styles.featuresSubtitle}>
            Freedly organises your subscriptions into clean, custom feeds.
          </p>
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7a2 2 0 0 1 2-2h3.17a2 2 0 0 1 1.42.59L11 7h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
                </svg>
              </div>
              <h3>Organise your<br/>subscriptions</h3>
              <p>324 channels sorted</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                  <line x1="3" y1="14" x2="15" y2="14"/>
                  <line x1="3" y1="18" x2="18" y2="18"/>
                </svg>
              </div>
              <h3>Build clean feeds</h3>
              <p>No algorithm noise</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>Stay in control</h3>
              <p>146 inactive removed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <span>No algorithm interference</span>
        <span className={styles.sep}>·</span>
        <span>No missed uploads</span>
        <span className={styles.sep}>·</span>
        <span>No subscription chaos</span>
      </div>

    </div>
  );
}
