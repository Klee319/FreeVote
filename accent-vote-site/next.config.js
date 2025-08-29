/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Windows環境でのEPERMエラー対策
  experimental: {
    disableOptimizedLoading: true,
  },
  // Windowsでのファイルロック問題を回避
  webpack: (config) => {
    config.cache = { type: 'memory' };
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
}

module.exports = nextConfig