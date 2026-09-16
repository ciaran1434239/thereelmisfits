// @ts-check

/**
 * Next.js configuration.
 *
 * Kept deliberately small for v0.2. As real concerns appear (image hosts,
 * redirects from the legacy Vite app, security headers) they slot in here.
 *
 * @type {import('next').NextConfig}
 */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,

  // Force all webpack modules to use Next.js's bundled React (canary).
  // Without this, stable react 19.2.6 is used, which mismatches with
  // react-server-dom-webpack/client (which uses canary internals), causing
  // hydrateRoot to silently fail and the page to render blank.
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, 'node_modules/next/dist/compiled/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/next/dist/compiled/react-dom'),
    };
    return config;
  },

  // Enable typed routes — `<Link href="/movie/...">` is type-checked against
  // the actual app/ route tree. Catches dead links at build time.
  typedRoutes: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org'  },
      { protocol: 'https', hostname: 'i.ytimg.com'     },
      { protocol: 'https', hostname: 'yt3.ggpht.com'   },
    ],
  },

  // Block builds if there are TS or ESLint errors. Don't let type drift
  // accumulate.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
