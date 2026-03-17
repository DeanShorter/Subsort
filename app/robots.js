export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/app/',  // Don't index the SPA
      },
    ],
    sitemap: 'https://subsort.vercel.app/sitemap.xml',
  };
}
