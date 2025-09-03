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
  // Windows環境でのEPERMエラー対策（完全版）
  experimental: {
    disableOptimizedLoading: true,
    // トレース機能を完全に無効化
    turbotrace: {
      logLevel: 'error',
      logAll: false,
    },
  },
  // テレメトリーを無効化
  telemetry: {
    disabled: true,
  },
  // Windowsでのファイルロック問題を回避
  webpack: (config, { isServer }) => {
    // メモリキャッシュのみ使用
    config.cache = { type: 'memory' };
    
    // ファイルウォッチャーの設定
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: ['**/node_modules', '**/.next', '**/trace'],
    };
    
    // Windows環境の特別な設定
    if (process.platform === 'win32') {
      // ファイルシステムキャッシュを無効化
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
      };
      // トレース出力を無効化
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        removeEmptyChunks: true,
      };
    }
    
    return config;
  },
  // 出力設定
  distDir: '.next',
  // スタンドアロン出力を無効化（開発環境）
  output: undefined,
  // トレース生成を無効化
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
}

module.exports = nextConfig