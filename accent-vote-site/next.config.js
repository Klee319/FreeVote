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
  // Windows環境でのEPERMエラー対策とNext.js 15対応
  experimental: {
    disableOptimizedLoading: true,
  },
  // Next.js 15での新しい設定位置
  serverExternalPackages: [],
  // Windowsでのファイルロック問題を回避
  webpack: (config, { isServer }) => {
    // メモリキャッシュのみ使用
    config.cache = false;
    
    // ファイルウォッチャーの設定
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: /node_modules|\.next|trace/,
    };
    
    // Windows環境の特別な設定
    if (process.platform === 'win32') {
      // ファイルシステムキャッシュを無効化
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
      };
    }
    
    return config;
  },
  // 出力設定
  distDir: '.next',
  // トレース生成を完全に無効化
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
}

module.exports = nextConfig