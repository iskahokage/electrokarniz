import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { PageHead } from "@/components/page-head";
import { FactsRow, InfoRow, LineList, Steps } from "@/components/info/info-row";
import { WaButton } from "@/components/info/wa-button";
import { href, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { info } from "@/i18n/pages/info";
import { buildMeta } from "@/lib/seo";

export function meta(locale: Locale) {
  const s = info[locale].warranty;
  return buildMeta({ locale, path: "/garantiya/", title: s.metaTitle, description: s.metaDescription });
}

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = info[locale];
  const w = s.warranty;
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/garantiya/", label: w.title }]} title={w.title} lead={w.lead} />
      <FactsRow items={w.facts} label={w.title} />

      <div className="mx-auto mt-12 max-w-[1440px] px-4 md:mt-20 md:px-8">
        <InfoRow id="broke" title={w.brokeTitle}>
          <Steps items={w.brokeSteps} />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <WaButton text={w.waText} from="warranty" className="btn btn-ink w-full sm:w-auto md:btn-accent">
              <MessageCircle className="size-5" strokeWidth={1.6} aria-hidden />
              {t(locale).writeWa}
            </WaButton>
            <p className="text-[14px] leading-snug text-ink-2">{s.replyNote}</p>
          </div>
        </InfoRow>

        <InfoRow id="cover" title={w.coverTitle}>
          <LineList items={w.cover} />
        </InfoRow>

        <InfoRow id="after" title={w.afterTitle}>
          <p className="max-w-[58ch]">{w.after}</p>
          <p className="mt-6">
            <Link href={href(locale, "/kontakty/")} className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-[6px] hover:decoration-2">
              {s.contacts.title}
            </Link>
          </p>
        </InfoRow>

        {/* СЛОТ: сканы дилерских сертификатов Dooya/Novo и договор с гарантией (У10).
            Владелец пришлёт — добавить сюда InfoRow с <Picture> сканов. Пока ничего не показываем. */}
      </div>
    </>
  );
}
