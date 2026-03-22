'use client';
import { useAuth } from '../components/AuthContext';
import BlogNav from './BlogNav';
import BlogGrid from './BlogGrid';
import PageHeader from '../components/PageHeader';
import styles from './blog.module.css';

export default function BlogContent({ posts }) {
  const { user } = useAuth();

  // Authenticated: use dashboard layout styling
  if (user) {
    return (
      <main className="home-main">
        <PageHeader
          title="Blog"
          subtitle="Tips, guides, and insights on organising your YouTube subscriptions and discovering quality creators."
        />
        <div style={{ padding: '1rem 0' }}>
          {posts.length > 0 ? (
            <BlogGrid posts={posts} />
          ) : (
            <div className={styles.empty}>
              <p>Articles coming soon.</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Unauthenticated: standalone page with its own nav
  return (
    <div className={styles.page}>
      <BlogNav styles={styles} />
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Blog</h1>
          <p className={styles.subtitle}>
            Tips, guides, and insights on organising your YouTube subscriptions
            and discovering quality creators.
          </p>
        </header>
        {posts.length > 0 ? (
          <BlogGrid posts={posts} />
        ) : (
          <div className={styles.empty}>
            <p>Articles coming soon. We're working on guides to help you get the most out of Freedly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
