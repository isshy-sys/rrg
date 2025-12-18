const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  assetPrefix: '',
  skipTrailingSlashRedirect: true,
  generateBuildId: () => 'build',
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
  // 無効化したページを除外
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  experimental: {
    typedRoutes: false,
  },
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/login': { page: '/login' },
      '/home': { page: '/home' },
    }
  },
};

module.exports = nextConfig;