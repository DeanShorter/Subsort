/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/dashboard/index.html',
      },
    ];
  },
};

module.exports = nextConfig;
