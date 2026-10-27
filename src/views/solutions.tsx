import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { Picture } from "@/components/picture";
import { Price } from "@/components/price";
import { Reveal } from "@/components/info/reveal";
import { CtaBand } from "@/components/solutions/cta-band";
import { solutionGroups, solutions, type SolutionFull } from "@/content/solutions";
import { tr, href, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { solutionsDict } from "@/i18n/pages/solutions";
import { cornicePrice } from "@/lib/pricing";
import { buildMeta } from "@/lib/seo";

export function meta(locale: Locale) {
  const d = solutionsDict[locale].index;
  return buildMeta({ locale, path: "/resheniya/", title: d.metaTitle, description: d.metaDesc });
}

function Item({ s, locale, first }: { s: SolutionFull; locale: Locale; first: boolean }) {
  const d = solutionsDict[locale].index;
  const pic = <Picture name={s.image} alt="" sizes="(min-width: 768px) 34vw, 100vw" className="aspect-[4/3] bg-paper-2" priority={first} demo />;
  return (
    <li>
      <Link href={href(locale, `/resheniya/${s.slug}/`)} className="group block">
        {/* Фото ниже экрана раскрываются от центра, как шторы; видимые сразу — без анимации (LCP). */}
        <Reveal>{pic}</Reveal>
        <h3 className="t-h3 mt-4 underline-offset-[5px] group-hover:underline">{tr(s.title, locale)}</h3>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-snug text-ink-2">{tr(s.short, locale)}</p>
        <p className="mt-3 text-[16px]">
          {s.priced ? (
            <Price value={cornicePrice({ length: 1, rows: s.slug === "dvuhryadnye" ? 2 : 1 })} from locale={locale} />
          ) : (
            <>
              <Price value={null} locale={locale} />
              <span className="ml-2 text-ink-2">{d.priceByCalc}</span>
            </>
          )}
        </p>
      </Link>
    </li>
  );
}

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const d = solutionsDict[locale].index;
  const s = solutionsDict[locale].solution;
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/resheniya/", label: d.title }]} title={d.title} lead={d.lead} />
      {solutionGroups.map((g, gi) => {
        const list = solutions.filter((s) => s.group === g);
        return (
          <section key={g} aria-labelledby={`g-${g}`} className="mx-auto mt-14 max-w-[1440px] px-4 md:mt-24 md:px-8">
            <div className="grid gap-6 border-t border-ink pt-5 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-4 lg:col-span-3">
                <div className="md:sticky md:top-24">
                  <h2 id={`g-${g}`} className="t-h2">
                    {d.groups[g]}
                  </h2>
                  <p className="mt-3 max-w-[36ch] text-[15px] leading-snug text-ink-2">{d.groupLead[g]}</p>
                </div>
              </div>
              <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 md:col-span-8 lg:col-span-9">
                {list.map((s, i) => (
                  <Item key={s.slug} s={s} locale={locale} first={gi === 0 && i < 2} />
                ))}
              </ul>
            </div>
          </section>
        );
      })}
      <CtaBand locale={locale} title={s.ctaTitle} lead={s.ctaLead} wa={t(locale).waHello} track="solutions-cta" />
    </>
  );
}
