'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './blog.module.css';

const CATEGORIES = ['All', 'Product', 'Guide', 'Data', 'Update', 'Tutorial', 'Opinion', 'News'];

const CAT_COLOURS = {
  'Product':  { gradient: 'linear-gradient(135deg, #1D9E75, #3ECFA0)', bg: 'rgba(62,207,160,0.1)',  text: '#1D9E75' },
  'Guide':    { gradient: 'linear-gradient(135deg, #185FA5, #85B7EB)', bg: 'rgba(55,138,221,0.1)',  text: '#185FA5' },
  'Data':     { gradient: 'linear-gradient(135deg, #BA7517, #FAC775)', bg: 'rgba(239,159,39,0.1)',  text: '#854F0B' },
  'Update':   { gradient: 'linear-gradient(135deg, #534AB7, #CECBF6)', bg: 'rgba(176,124,237,0.1)', text: '#534AB7' },
  'Tutorial': { gradient: 'linear-gradient(135deg, #993C1D, #F0997B)', bg: 'rgba(216,90,48,0.1)',   text: '#993C1D' },
  'Opinion':  { gradient: 'linear-gradient(135deg, #993556, #ED93B1)', bg: 'rgba(212,83,126,0.1)',  text: '#993556' },
  'News':     { gradient: 'linear-gradient(135deg, #A32D2D, #F09595)', bg: 'rgba(226,75,74,0.1)',   text: '#A32D2D' },
};

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
          {filtered.map(post => {
            const colours = CAT_COLOURS[post.category] || CAT_COLOURS['Tips'];
            return (
              <Link href={`/blog/${post.slug}`} key={post.slug} className={styles.card}>
                <div className={styles.cardBanner} style={{ background: colours.gradient }} />
                <div className={styles.cardBody}>
                  {post.category && (
                    <span className={styles.cardTag} style={{ background: colours.bg, color: colours.text }}>
                      {post.category}
                    </span>
                  )}
                  <h2 className={styles.cardTitle}>{post.title}</h2>
                  <p className={styles.cardExcerpt}>{post.excerpt}</p>
                  <div className={styles.cardMeta}>
                    <span>{post.date}</span>
                    <span>{post.readTime || '5 min read'}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className={styles.noResults}>
          No articles match your search.
        </div>
      )}
    </>
  );
}
