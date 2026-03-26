export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/home/',  // Don't index the app
      },
    ],
    sitemap: 'https://getsubscrub.com/sitemap.xml',
  };
}
