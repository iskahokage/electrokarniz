import type { Locale } from "@/i18n";
import { buildMeta } from "@/lib/seo";
import { PageHead } from "@/components/page-head";
import { CheckoutForm } from "@/components/order/checkout-form";
import { os } from "@/i18n/pages/order";

 
export function meta(locale: Locale) {
  const s = os(locale).checkout;
  return buildMeta({ locale, path: "/oformlenie/", title: s.metaTitle, description: s.metaDescription });
}

// Один экран без регистрации: форма, сводка, затем «Заказ № … принят» на этой же странице.
export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = os(locale).checkout;
  return (
    <div className="pb-6 md:pb-28">
      <PageHead locale={locale} crumbs={[{ path: "/korzina/", label: os(locale).cart.crumb }, { path: "/oformlenie/", label: s.crumb }]} title={s.title} lead={s.lead} />
      <div className="mx-auto mt-8 max-w-[1440px] px-4 md:mt-12 md:px-8">
        <CheckoutForm locale={locale} />
      </div>
    </div>
  );
}
