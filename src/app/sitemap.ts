import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { products } from "@/content/catalog";
import { brands } from "@/content/brands";
import { solutions } from "@/content/solutions";
import { projects } from "@/content/projects";
import { href, locales } from "@/i18n";
import { kyIndexed, languageAlternates } from "@/lib/seo";

// Статическая сборка (output: 'export'): sitemap.xml собирается один раз при build.
export const dynamic = "force-static";

// Корзина и оформление — служебные страницы, в поиске им делать нечего.
const pages = ["/", "/resheniya/", "/katalog/", "/upravlenie/", "/raschet/", "/obekty/", "/dostavka-i-oplata/", "/garantiya/", "/kontakty/", "/usloviya/", "/privacy/"];

// Главные разделы чаще меняются и важнее для поиска, юридические — реже.
const priority = (path: string) => (path === "/" ? 1 : /^\/(usloviya|privacy)\//.test(path) ? 0.3 : path.split("/").length > 3 ? 0.7 : 0.8);

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...pages,
    ...solutions.map((s) => `/resheniya/${s.slug}/`),
    ...products.map((p) => `/katalog/${p.slug}/`),
    ...Object.keys(brands).map((b) => `/brendy/${b}/`),
    ...projects.map((p) => `/obekty/${p.slug}/`),
  ];
  const abs = (p: string) => new URL(p, site.url).toString();

  // Каждая страница — двумя адресами (ru и ky), у обоих одинаковые hreflang-альтернативы.
  // Кыргызские адреса — только когда версия открыта для поиска (см. kyIndexed в src/lib/seo.ts).
  return paths.flatMap((path) =>
    locales.filter((l) => l === "ru" || kyIndexed).map((locale) => ({
      url: abs(href(locale, path)),
      changeFrequency: path === "/" || path === "/katalog/" ? ("weekly" as const) : ("monthly" as const),
      priority: priority(path),
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
