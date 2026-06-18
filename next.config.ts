import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp', '@napi-rs/canvas'],
  outputFileTracingIncludes: {
    '**/*': ['./lib/fonts/**'],
  },
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

export default withSentryConfig(nextConfig, {
  org: 'fotostudio',
  project: 'fotostudio',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { disable: false },
  disableLogger: true,
})
