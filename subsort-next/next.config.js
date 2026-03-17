/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for blog pages
  output: 'standalone',
  
  // Rewrite /app to serve the SPA
  async rewrites() {
    return [
      {
        source: '/app/:path*',
        destination: '/app/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
