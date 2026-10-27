import type { MetadataRoute } from "next";
import { site } from "@/content/site";

// Статическая сборка: robots.txt пишется один раз при build, поэтому окружение задаётся env на этапе сборки.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Staging и превью не должны попасть в индекс: там демо-фото и временные данные.
  if (process.env.NEXT_PUBLIC_SITE_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/korzina/", "/oformlenie/", "/ky/korzina/", "/ky/oformlenie/"] },
    sitemap: new URL("/sitemap.xml", site.url).toString(),
    host: site.url,
  };
}
