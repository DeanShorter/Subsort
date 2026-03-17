/** @type {import('next').NextConfig} */
const nextConfig = {
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
