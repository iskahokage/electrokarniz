import { Suspense } from "react";
import { PageHead } from "@/components/page-head";
import { CatalogBrowser, CatalogFallback } from "@/components/catalog/catalog-browser";
import type { Locale } from "@/i18n";
import { tc } from "@/i18n/pages/catalog";
import { buildMeta } from "@/lib/seo";

 
export function meta(locale: Locale) {
  const s = tc(locale);
  // Комбинации фильтров живут в query — canonical всегда на /katalog/, дублей в индексе нет.
  return buildMeta({ locale, path: "/katalog/", title: s.metaTitle, description: s.metaDescription });
}

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = tc(locale);
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/katalog/", label: s.title }]} title={s.title} lead={s.lead} />
      <div className="pb-20 md:pb-32">
        <Suspense fallback={<CatalogFallback locale={locale} />}>
          <CatalogBrowser locale={locale} />
        </Suspense>
      </div>
    </>
  );
}
