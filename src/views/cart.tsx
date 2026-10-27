import type { Locale } from "@/i18n";
import { buildMeta } from "@/lib/seo";
import { PageHead } from "@/components/page-head";
import { CartView } from "@/components/order/cart-page";
import { os } from "@/i18n/pages/order";

 
export function meta(locale: Locale) {
  const s = os(locale).cart;
  return buildMeta({ locale, path: "/korzina/", title: s.metaTitle, description: s.metaDescription });
}

// Корзина — в localStorage, поэтому содержимое рисует клиентский компонент.
export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = os(locale).cart;
  return (
    <div className="pb-6 md:pb-28">
      <PageHead locale={locale} crumbs={[{ path: "/korzina/", label: s.crumb }]} title={s.title} />
      <CartView locale={locale} />
    </div>
  );
}
