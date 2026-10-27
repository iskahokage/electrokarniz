// Языки: русский — основной, без префикса; кыргызский — /ky/… (одинаковые slug-и).
// Кыргызский — черновик, владелец — носитель языка и проверит сам (У19).
export type Locale = "ru" | "ky";
export const locales: Locale[] = ["ru", "ky"];

/** Текст на двух языках. */
export type L = { ru: string; ky: string };

export function tr(v: L, locale: Locale) {
  return v[locale] || v.ru;
}

/** Путь страницы для языка: href("ky", "/katalog/") → "/ky/katalog/". */
export function href(locale: Locale, path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return locale === "ru" ? p : `/ky${p === "/" ? "/" : p}`;
}

/** Тот же путь на другом языке — для переключателя. */
export function switchLocalePath(pathname: string, to: Locale) {
  const bare = pathname.replace(/^\/ky(?=\/|$)/, "") || "/";
  return href(to, bare);
}

export function localeFromPath(pathname: string): Locale {
  return /^\/ky(\/|$)/.test(pathname) ? "ky" : "ru";
}
