/** @type {import('next').NextConfig} */
const nextConfig = {
  // GitHub Pages 用に静的書き出しする
  output: "export",
  // https://kazuma-oki.github.io/portfolio-2026/ で配信するため
  basePath: "/portfolio-2026",
  // 画像最適化サーバーは使えないので無効化
  images: { unoptimized: true },
  // 各ページを /path/index.html として出力する
  trailingSlash: true,
};

export default nextConfig;
