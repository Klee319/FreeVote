import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // SVG画像のサポート
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  // 必要に応じてビルド出力ディレクトリを指定（デフォルトは.next）
  // distDir: '.next',
};

export default nextConfig;
