import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Хостинг владельца не Vercel, поэтому собираем статический сайт, который встанет куда угодно.
  output: "export",
  // /katalog/ → /katalog/index.html: так работают обычные хостинги без настроек.
  trailingSlash: true,
  // Без сервера next/image не оптимизирует; размеры готовит scripts/media.mjs.
  images: { unoptimized: true },
  // Значок dev-режима перекрывает нижнюю панель на скриншотах.
  devIndicators: false,
  // Два корневых layout (ru и ky) — общей 404 нужен global-not-found.
  experimental: { globalNotFound: true },
  // cacheComponents и partialPrefetching не совместимы со статической сборкой (PPR в export запрещён).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
