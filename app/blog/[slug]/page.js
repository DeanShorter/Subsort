import Link from 'next/link';
import { getAllSlugs, getPostBySlug } from '@/lib/blog';
import styles from './post.module.css';
import BlogNav from '../BlogNav';

// Generate static paths at build time for all blog posts
export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map(slug => ({ slug }));
}

// Dynamic metadata for each post (SEO)
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return {
    title: post.title,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: 'article',
      publishedTime: post.date,
      authors: ['Subscrub'],
    },
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  // JSON-LD structured data for rich search results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Organization', name: 'Subscrub' },
    publisher: { '@type': 'Organization', name: 'Subscrub' },
    description: post.excerpt || post.title,
  };

  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BlogNav styles={styles} />

      <article className={styles.article}>
        <header className={styles.header}>
          <Link href="/blog" className={styles.backLink}>
            ← Back to Blog
          </Link>
          {post.category && <span className={styles.tag}>{post.category}</span>}
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.meta}>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime || '5 min read'}</span>
          </div>
        </header>

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <footer className={styles.footer}>
          <div className={styles.cta}>
            <h3>Ready to organise your YouTube?</h3>
            <p>Subscrub is free, runs in your browser, and doesn't store your data on any server.</p>
            <Link href="/dashboard" className={styles.ctaBtn}>Launch Subscrub</Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
