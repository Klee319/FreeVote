import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // SVG画像のサポート
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  // ビルドキャッシュの最適化
  experimental: {
    // CSS最適化を有効化（パフォーマンス向上）
    optimizeCss: true,
  },
  // 開発サーバーの設定 - Next.js 15対応
  devIndicators: {
    // buildActivityPosition は position に名称変更
    position: 'bottom-right',
  },
  // TypeScriptの型チェックをビルド時に並列実行
  typescript: {
    // ビルド時の型チェックを継続
    ignoreBuildErrors: false,
  },
  // ESLintの設定
  eslint: {
    // ビルド時のESLint実行を継続
    ignoreDuringBuilds: false,
  },
  // APIプロキシ設定 - バックエンドAPIへのリクエストをプロキシ
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
    ];
  },
  // 必要に応じてビルド出力ディレクトリを指定（デフォルトは.next）
  // distDir: '.next',
};

export default nextConfig;
