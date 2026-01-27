import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Optimisation des images Next.js
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'koda-marketplace-storage.s3.eu-west-3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.s3.eu-west-3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Compression automatique
  compress: true,

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://*.stripe.network https://challenges.cloudflare.com https://*.hcaptcha.com https://hcaptcha.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' data: https://koda-marketplace-storage.s3.eu-west-3.amazonaws.com https://*.s3.eu-west-3.amazonaws.com https://*.s3.amazonaws.com https://img.clerk.com https://*.stripe.com https://images.unsplash.com;",
              "font-src 'self' https://fonts.gstatic.com;",
              "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://api.stripe.com https://*.sentry.io https://*.ingest.sentry.io https://challenges.cloudflare.com https://*.hcaptcha.com https://hcaptcha.com https://koda-marketplace-storage.s3.eu-west-3.amazonaws.com;",
              "frame-src 'self' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://*.hcaptcha.com https://hcaptcha.com;",
              "object-src 'none';",
              "base-uri 'self';",
              "form-action 'self';",
              "frame-ancestors 'none';",
              "upgrade-insecure-requests;"
            ].join(' ')
          },
        ],
      },
    ];
  },

  // Optimisations expérimentales
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "koda-10",

  project: "koda",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});




