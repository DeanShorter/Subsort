import { getAllSlugs } from '@/lib/blog';

const BASE_URL = 'https://subsort.vercel.app';

export default function sitemap() {
  const blogSlugs = getAllSlugs();

  const blogUrls = blogSlugs.map(slug => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...blogUrls,
  ];
}
