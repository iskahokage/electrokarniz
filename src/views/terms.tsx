import { PageHead } from "@/components/page-head";
import { DraftBadge, LegalSections } from "@/components/info/legal-doc";
import type { Locale } from "@/i18n";
import { info } from "@/i18n/pages/info";
import { buildMeta } from "@/lib/seo";

export function meta(locale: Locale) {
  const s = info[locale].terms;
  return buildMeta({ locale, path: "/usloviya/", title: s.metaTitle, description: s.metaDescription });
}

// ЧЕРНОВИК (draft: true): до проверки владельцем и юристом. Возврат: проданный товар возврату не подлежит (У16, 27.10.2026).
export const draft = true;

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = info[locale].terms;
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/usloviya/", label: s.title }]} title={s.title} lead={s.lead}>
        <DraftBadge locale={locale} />
      </PageHead>
      <LegalSections sections={s.sections} prefix="terms" />
    </>
  );
}
