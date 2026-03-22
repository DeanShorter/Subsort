import { getAllPosts } from '@/lib/blog';
import BlogContent from './BlogContent';

export const metadata = {
  title: 'Blog',
  description: 'Tips, guides, and insights on organising your YouTube subscriptions, discovering quality creators, and getting more from your feed.',
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return <BlogContent posts={posts} />;
}
