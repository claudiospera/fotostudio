import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
