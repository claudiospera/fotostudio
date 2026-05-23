import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-53356d483eb74822990977c0e5c21f6c.r2.dev',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'claudiospera.com' }],
        destination: 'https://storiedaraccontare.it/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.claudiospera.com' }],
        destination: 'https://storiedaraccontare.it/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
