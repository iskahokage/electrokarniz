import type { Locale } from "@/i18n";
import { buildMeta } from "@/lib/seo";
import { PageHead } from "@/components/page-head";
import { Calculator } from "@/components/order/calculator";
import { os } from "@/i18n/pages/order";

 
export function meta(locale: Locale) {
  const s = os(locale).calc;
  return buildMeta({ locale, path: "/raschet/", title: s.metaTitle, description: s.metaDescription });
}

// Страница — серверная оболочка (крошки, h1); весь интерактив — в клиентском калькуляторе.
export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = os(locale).calc;
  return (
    <div className="pb-4 md:pb-28">
      <PageHead locale={locale} crumbs={[{ path: "/raschet/", label: s.crumb }]} title={s.title} lead={s.lead} />
      <div className="mt-8 md:mt-12">
        <Calculator locale={locale} />
      </div>
    </div>
  );
}
