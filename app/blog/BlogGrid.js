'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './blog.module.css';

const CATEGORIES = ['All', 'Guides', 'Insights', 'Tips', 'Behind the scenes'];

export default function BlogGrid({ posts, search: externalSearch, activeFilter: externalFilter, showToolbar = false }) {
  const [localSearch, setLocalSearch] = useState('');
  const [localFilter, setLocalFilter] = useState('All');

  // Use external state when provided (authenticated view), local state for standalone
  const search = externalSearch !== undefined ? externalSearch : localSearch;
  const activeFilter = externalFilter !== undefined ? externalFilter : localFilter;

  const filtered = useMemo(() => {
    let result = posts;
    if (activeFilter !== 'All') {
      result = result.filter(p => p.category === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, search, activeFilter]);

  return (
    <>
      {/* Only show toolbar for unauthenticated view — authenticated uses PageHeader */}
      {showToolbar && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search articles…"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterChips}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`${styles.chip}${localFilter === cat ? ` ${styles.chipActive}` : ''}`}
                onClick={() => setLocalFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map(post => (
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
      ) : (
        <div className={styles.noResults}>
          No articles match your search.
        </div>
      )}
    </>
  );
}
