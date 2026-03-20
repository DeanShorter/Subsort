export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/dashboard/',  // Don't index the SPA
      },
    ],
    sitemap: 'https://usefreedly.com/sitemap.xml',
  };
}
