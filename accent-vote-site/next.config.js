/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // APIプロキシ設定
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3003/api/:path*',
      },
    ];
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