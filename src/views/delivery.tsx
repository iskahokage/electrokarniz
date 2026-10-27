import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { CtaBand } from "@/components/info/cta-band";
import { FactsRow, InfoRow, LineList, Steps } from "@/components/info/info-row";
import { site } from "@/content/site";
import { href, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { info } from "@/i18n/pages/info";
import { buildMeta } from "@/lib/seo";

export function meta(locale: Locale) {
  const s = info[locale].delivery;
  return buildMeta({ locale, path: "/dostavka-i-oplata/", title: s.metaTitle, description: s.metaDescription });
}

/** Крупный список мест — регионы читаются как адресная табличка, а не как мелкий текст. */
function Places({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-1 text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] leading-tight font-semibold tracking-[-0.03em]">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = info[locale];
  const d = s.delivery;
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/dostavka-i-oplata/", label: d.title }]} title={d.title} lead={d.lead} />
      <FactsRow items={d.times} label={d.timeTitle} />

      <div className="mx-auto mt-12 max-w-[1440px] px-4 md:mt-20 md:px-8">
        <InfoRow id="order" title={d.orderTitle}>
          <Steps items={d.orderSteps} />
        </InfoRow>

        <InfoRow id="pay" title={d.payTitle}>
          <p className="max-w-[56ch]">{d.payLead}</p>
          {/* У последнего ряда нижней линии нет — её даёт следующий раздел. */}
          <ul className="mt-6 grid border-t border-line sm:grid-cols-2 [&>li:last-child]:border-b-0 sm:[&>li:nth-last-child(2):nth-child(odd)]:border-b-0">
            {d.payMethods.map((m) => (
              <li key={m.t} className="border-b border-line py-4 sm:odd:pr-6">
                <p className="font-semibold">{m.t}</p>
                {m.d && <p className="mt-0.5 text-[15px] text-ink-2">{m.d}</p>}
              </li>
            ))}
          </ul>
        </InfoRow>

        <InfoRow id="price" title={d.priceTitle}>
          <LineList items={d.priceItems} />
          <p className="mt-5 max-w-[60ch] text-ink-2">{d.priceExtra}</p>
          <p className="mt-3 max-w-[60ch] text-ink-2">{d.powerNote}</p>
        </InfoRow>

        <InfoRow id="install" title={d.installTitle}>
          <Places items={site.installRegions[locale]} />
          <p className="mt-4 text-ink-2">{d.installLead}</p>
        </InfoRow>

        <InfoRow id="ship" title={d.shipTitle}>
          <Places items={d.shipRegions} />
          <p className="mt-4 max-w-[56ch]">{d.shipLead}</p>
          <div className="mt-5">
            <LineList items={d.shipItems} />
          </div>
          <p className="mt-6">
            <Link href={href(locale, "/usloviya/")} className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-[6px] hover:decoration-2">
              {d.termsLink}
            </Link>
          </p>
        </InfoRow>
      </div>

      <CtaBand
        from="delivery"
        title={s.projects.endTitle}
        lead={s.projects.endLead}
        note={s.replyNote}
        waText={d.waText}
        waLabel={t(locale).writeWa}
        second={{ href: href(locale, "/raschet/"), label: t(locale).calc }}
      />
    </>
  );
}
