import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <img src="/logo.svg" alt="myfeed." height="30" />
        </div>
        <div className={styles.navLinks}>
          <Link href="/blog">Blog</Link>
          <a href="/signin" className={styles.navCta}>Sign In</a>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroGlow1} />
          <div className={styles.heroGlow2} />
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Your YouTube subscriptions<br />are a <em>mess.</em>
          </h1>
          <p className={styles.heroDesc}>
            Subsort pulls in all your subscriptions, organises them into categories,
            flags dead channels, and gives you analytics on your feed health.
            All in your browser — nothing stored on our servers.
          </p>
          <div className={styles.heroCtas}>
            <a href="/signin" className={styles.btnPrimary}>
              Get Started — It's Free
            </a>
            <Link href="/blog" className={styles.btnSecondary}>
              Read the Blog
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything you need to <em>clean up</em> your feed</h2>
        <div className={styles.featureGrid}>
          {[
            { icon: '📂', title: 'Smart Categorisation', desc: 'Auto-categorise channels by topic, or organise them manually with categories and subcategories.' },
            { icon: '📊', title: 'Feed Analytics', desc: 'See your subscription health score, find dead channels, and understand your viewing patterns.' },
            { icon: '🔍', title: 'Discover Channels', desc: 'Find quality creators similar to channels you already love, filtered by real quality metrics.' },
            { icon: '🤖', title: 'AI-Powered', desc: 'Let Claude analyse your subscriptions and suggest the perfect category structure.' },
            { icon: '📰', title: 'Custom Feeds', desc: 'Browse recent videos filtered by category — your own personalised YouTube homepage.' },
            { icon: '⭐', title: 'Premium Insights', desc: 'Upload your watch history for deep analytics on viewing habits and hidden patterns.' },
          ].map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <h2>Ready to organise your YouTube?</h2>
        <p>Free forever. No account required. Your data stays in your browser.</p>
        <a href="/signin" className={styles.btnPrimary}>
          Launch Subsort
        </a>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <img src="/logo.svg" alt="myfeed." height="30" />
          </div>
          <div className={styles.footerLinks}>
            <Link href="/blog">Blog</Link>
            <a href="/signin">Sign In</a>
          </div>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} Subsort. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
