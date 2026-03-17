export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/dashboard/',  // Don't index the SPA
      },
    ],
    sitemap: 'https://subsort.vercel.app/sitemap.xml',
  };
}
