const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
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
};

module.exports = nextConfig;