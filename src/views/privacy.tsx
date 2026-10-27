import { PageHead } from "@/components/page-head";
import { DraftBadge, LegalSections } from "@/components/info/legal-doc";
import type { Locale } from "@/i18n";
import { info } from "@/i18n/pages/info";
import { buildMeta } from "@/lib/seo";

export function meta(locale: Locale) {
  const s = info[locale].privacy;
  return buildMeta({ locale, path: "/privacy/", title: s.metaTitle, description: s.metaDescription });
}

// ЧЕРНОВИК (draft: true): сроки хранения и список счётчиков — предложение, владелец и юрист подтвердят.
// Номера статей закона не указываем, пока их не проверил юрист.
export const draft = true;

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = info[locale].privacy;
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/privacy/", label: s.title }]} title={s.title} lead={s.lead}>
        <DraftBadge locale={locale} />
      </PageHead>
      <LegalSections sections={s.sections} prefix="privacy" />
    </>
  );
}
