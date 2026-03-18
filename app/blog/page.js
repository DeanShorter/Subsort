import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import styles from './blog.module.css';

export const metadata = {
  title: 'Blog',
  description: 'Tips, guides, and insights on organising your YouTube subscriptions, discovering quality creators, and getting more from your feed.',
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.navBrand}>
          <div className={styles.navLogo}><svg viewBox="0 0 32 32" fill="none" width="32" height="32"><rect x="1" y="11" width="19" height="19" rx="5" fill="#5B6CFF" opacity="0.6"/><rect x="12" y="1" width="19" height="19" rx="5" fill="#5B6CFF"/></svg></div>
          <span className={styles.navTitle}>Subsort</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/blog">Blog</Link>
          <a href="/signin" className={styles.navCta}>Sign In</a>
        </div>
      </nav>

      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Blog</h1>
          <p className={styles.subtitle}>
            Tips, guides, and insights on organising your YouTube subscriptions
            and discovering quality creators.
          </p>
        </header>

        <div className={styles.grid}>
          {posts.map(post => (
            <Link href={`/blog/${post.slug}`} key={post.slug} className={styles.card}>
              {post.image && (
                <div className={styles.cardImage} style={{ backgroundImage: `url(${post.image})` }} />
              )}
              <div className={styles.cardBody}>
                {post.category && <span className={styles.cardTag}>{post.category}</span>}
                <h2 className={styles.cardTitle}>{post.title}</h2>
                <p className={styles.cardExcerpt}>{post.excerpt}</p>
                <div className={styles.cardMeta}>
                  <span>{post.date}</span>
                  <span>{post.readTime || '5 min read'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className={styles.empty}>
            <p>Articles coming soon. We're working on guides to help you get the most out of Subsort.</p>
          </div>
        )}
      </div>
    </div>
  );
}
