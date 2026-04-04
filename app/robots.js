export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: '/home/',  // Don't index the app
      },
    ],
    sitemap: 'https://getsubsnub.com/sitemap.xml',
  };
}
