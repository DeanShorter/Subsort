'use client';
import Link from 'next/link';
import { useAuth } from '../components/AuthContext';

export default function BlogNav({ styles }) {
  const { user } = useAuth();

  // Authenticated users get the sidebar nav — hide the blog nav entirely
  if (user) return null;

  return (
    <nav className={styles.nav}>
      <Link href="/" className={`home-nav-brand ${styles.navBrand}`}>
        <img src="/icon.svg" alt="Subscrub" className="home-nav-brand-icon" />
        <span className="home-nav-brand-wordmark">
          <span>sub</span><span className="hnp-wordmark">scrub</span>
        </span>
      </Link>
      <div className={styles.navLinks}>
        <Link href="/blog">Blog</Link>
        <a href="/signin" className={styles.navCta}>Sign In</a>
      </div>
    </nav>
  );
}
