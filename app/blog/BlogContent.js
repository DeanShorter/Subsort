'use client';
import { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import BlogNav from './BlogNav';
import BlogGrid from './BlogGrid';
import PageHeader from '../components/PageHeader';
import styles from './blog.module.css';

const CATEGORIES = ['All', 'Guides', 'Insights', 'Tips', 'Behind the scenes'];

export default function BlogContent({ posts }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Authenticated: use dashboard layout with PageHeader
  if (user) {
    return (
      <main className="home-main">
        <PageHeader
          title="Blog"
          subtitle="Tips, guides, and insights on organising your YouTube subscriptions and discovering quality creators."
          right={
            <div className="ph-search-wrap">
              <svg viewBox="0 0 14 14"><circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L13 13" /></svg>
              <input className="ph-search" type="text" placeholder="Search articles…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          }
          filters={<>
            {CATEGORIES.map(cat => (
              <button key={cat} className={`ph-chip${activeFilter === cat ? ' active' : ''}`} onClick={() => setActiveFilter(cat)}>
                {cat}
              </button>
            ))}
          </>}
        />
        {posts.length > 0 ? (
          <BlogGrid posts={posts} search={search} activeFilter={activeFilter} />
        ) : (
          <div className={styles.empty}><p>Articles coming soon.</p></div>
        )}
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
          <BlogGrid posts={posts} search={search} activeFilter={activeFilter} showToolbar />
        ) : (
          <div className={styles.empty}>
            <p>Articles coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
