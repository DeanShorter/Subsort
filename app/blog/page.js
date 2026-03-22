import { getAllPosts } from '@/lib/blog';
import styles from './blog.module.css';
import BlogNav from './BlogNav';
import BlogGrid from './BlogGrid';

export const metadata = {
  title: 'Blog',
  description: 'Tips, guides, and insights on organising your YouTube subscriptions, discovering quality creators, and getting more from your feed.',
};

export default function BlogIndex() {
  const posts = getAllPosts();

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
