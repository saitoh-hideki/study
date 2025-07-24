import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercelデプロイ用の最適化設定
  output: 'standalone',
  
  // 画像最適化設定
  images: {
    domains: ['localhost'],
    unoptimized: true, // Vercelで画像最適化を無効化
  },
  
  // サーバー外部パッケージの設定
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 環境変数の設定
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // ヘッダー設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
