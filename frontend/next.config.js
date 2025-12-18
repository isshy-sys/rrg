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
  typedRoutes: false,
  // 無効化したページを除外
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    // 無効化されたフォルダを除外
    config.module.rules.push({
      test: /\/_.*-disabled\//,
      loader: 'ignore-loader'
    });
    
    return config;
  },
};

module.exports = nextConfig;