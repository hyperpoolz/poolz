/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'HyperLoops',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Image optimization
  images: {
    domains: [],
    unoptimized: false,
  },

  // Webpack configuration
  webpack: (config, { isServer, webpack }) => {
    // Add polyfills for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Handle pino-pretty and other optional dependencies
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pino-pretty$/,
      })
    );

    // Add support for importing .svg files as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Experimental features
  experimental: {
    // Optimize server components
    serverComponentsExternalPackages: ['ethers'],
  },

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if type errors exist
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Don't run ESLint during builds in production
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [];
  },

  // Rewrites for API routes or external services
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;