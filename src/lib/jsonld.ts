// Помощники schema.org (JSON-LD). Только факты из site.ts и данных каталога: ничего не выдумываем.
import { site } from "@/content/site";
import { brands } from "@/content/brands";
import type { Product, Solution } from "@/content/types";
import manifestJson from "../../public/media/manifest.json";
import { href, tr, type Locale } from "@/i18n";

const abs = (p: string) => new URL(p, site.url).toString();
const orgId = abs("/#business");
const manifest = manifestJson as Record<string, { widths: number[] }>;

/** Абсолютный URL самой крупной WebP-версии картинки из manifest; нет файла — нет поля image. */
function mediaUrl(name: string | undefined) {
  const m = name ? manifest[name] : undefined;
  return m ? abs(`/media/${name}-${m.widths[m.widths.length - 1]}.webp`) : undefined;
}

/** Безопасная строка для <script type="application/ld+json">: «</script» в данных не закроет тег. */
export function ldJson(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Организация. Адреса нет: шоурума пока нет, только склад (решение владельца 27.10.2026). */
export function businessLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": orgId,
    name: site.name,
    url: abs(href(locale, "/")),
    // Растровый логотип: Google не принимает SVG в logo.
    logo: abs("/apple-icon.png"),
    // Превью на языке страницы — та же картинка, что в og:image.
    image: abs(locale === "ky" ? "/og/default-ky.png" : "/og/default.png"),
    telephone: site.phone.replace(/\s/g, ""),
    email: site.email,
    sameAs: [site.instagram],
    currenciesAccepted: "KGS",
    paymentAccepted: "Cash, Bank transfer, QR",
    areaServed: site.installRegions[locale].map((name, i) =>
      // Бишкек и Ош — города, остальные — области.
      ({ "@type": i === 0 || name === "Ош" ? "City" : "AdministrativeArea", name }),
    ),
    // Ответ без выходных; точные часы владелец не задавал — не пишем openingHours.
    contactPoint: {
      "@type": "ContactPoint",
      telephone: site.phone.replace(/\s/g, ""),
      email: site.email,
      contactType: "customer service",
      availableLanguage: ["ru", "ky"],
    },
  };
}

/**
 * Товар. priceFrom — реальная цена (для комплекта — цена от 1 м по формуле); null → Offer не выводим:
 * Google не принимает Offer без цены, а выдуманную цену показывать нельзя.
 */
export function productLd(product: Product, locale: Locale, priceFrom: number | null | undefined) {
  const url = abs(href(locale, `/katalog/${product.slug}/`));
  const brand = product.brand ? brands[product.brand] : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tr(product.title, locale),
    description: tr(product.description ?? product.short, locale),
    sku: product.slug,
    model: product.name,
    url,
    ...(mediaUrl(product.images[0]) ? { image: mediaUrl(product.images[0]) } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand.name } } : {}),
    ...(typeof priceFrom === "number" && priceFrom > 0
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: priceFrom,
            priceCurrency: "KGS",
            availability: product.stock === "in" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
            seller: { "@id": orgId },
          },
        }
      : {}),
  };
}

/** Услуга «тип решения»: установка в регионах, где работает бригада. */
export function serviceLd(solution: Solution, locale: Locale = "ru") {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: tr(solution.title, locale),
    description: tr(solution.short, locale),
    url: abs(href(locale, `/resheniya/${solution.slug}/`)),
    ...(mediaUrl(solution.image) ? { image: mediaUrl(solution.image) } : {}),
    provider: { "@id": orgId },
    areaServed: site.installRegions[locale].map((name) => ({ "@type": "Place", name })),
  };
}
