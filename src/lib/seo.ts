import type { Metadata } from "next";
import { site } from "@/content/site";
import { href, type Locale } from "@/i18n";

const isProd = process.env.NEXT_PUBLIC_SITE_ENV === "production";

/**
 * Кыргызская версия в поиске. Тексты — черновик, публикуем после проверки владельцем (У19):
 * в production без NEXT_PUBLIC_KY_ENABLED страницы /ky/ работают, но noindex, без hreflang и вне sitemap.
 */
export const kyIndexed = !isProd || ["1", "true", "yes"].includes((process.env.NEXT_PUBLIC_KY_ENABLED || "").toLowerCase());

/** hreflang-альтернативы пути (общие для <head> и sitemap.xml). */
export function languageAlternates(path: string) {
  const url = (p: string) => new URL(p, site.url).toString();
  return {
    ru: url(href("ru", path)),
    ...(kyIndexed ? { ky: url(href("ky", path)) } : {}),
    "x-default": url(href("ru", path)),
  };
}

// Название сайта в конце заголовка. Если в заголовке уже есть своё тире, второе «—» читается как цепочка
// («Спальня — объект — Электрокарниз»), поэтому тогда разделитель «·». Длиннее ~65 знаков Google всё равно обрежет — тогда без хвоста.
const MAX_TITLE = 65;
// Название как отдельное слово: «Электрокарнизы» и «электрокарниздер» — обычные слова, не бренд.
const BRAND_WORD = new RegExp(`${site.name}(?![а-яёөүңa-z])`, "i");

// Корзина и оформление — личные страницы: не в индекс даже в production (robots.txt их тоже закрывает).
const PRIVATE = /^\/(korzina|oformlenie)\//;

/** Заголовок без точки в конце; если название сайта уже есть или строка длинная — без хвоста. */
function pageTitle(raw: string): Metadata["title"] {
  const title = raw.trim().replace(/\.$/, "");
  const full = `${title}${title.includes("—") ? " · " : " — "}${site.name}`;
  return { absolute: BRAND_WORD.test(title) || full.length > MAX_TITLE ? title : full };
}

/** Metadata страницы: canonical от основного домена, hreflang ru/ky, OpenGraph. */
export function buildMeta({ locale, path, title, description, image }: { locale: Locale; path: string; title: string; description: string; image?: string }): Metadata {
  const url = (p: string) => new URL(p, site.url).toString();
  const ogTitle = title.trim().replace(/\.$/, "");
  const index = isProd && !PRIVATE.test(path) && (locale === "ru" || kyIndexed);
  return {
    title: pageTitle(title),
    description,
    alternates: {
      canonical: url(href(locale, path)),
      languages: languageAlternates(path),
    },
    openGraph: {
      title: ogTitle,
      description,
      url: url(href(locale, path)),
      siteName: site.name,
      locale: locale === "ru" ? "ru_KG" : "ky_KG",
      type: "website",
      // Своя картинка для кыргызских страниц: в превью ссылки текст на языке страницы.
      images: [{ url: image ?? (locale === "ky" ? "/og/default-ky.png" : "/og/default.png"), width: 1200, height: 630, alt: ogTitle }],
    },
    twitter: { card: "summary_large_image" },
    // Staging не индексируется совсем; в production закрыты корзина, оформление и /ky/ до проверки текстов.
    robots: index ? { index: true, follow: true } : { index: false, follow: isProd },
  };
}
