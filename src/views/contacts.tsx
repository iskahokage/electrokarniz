import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { ContactRows } from "@/components/info/contact-rows";
import { site } from "@/content/site";
import { href, type Locale } from "@/i18n";
import { info } from "@/i18n/pages/info";
import { buildMeta } from "@/lib/seo";

export function meta(locale: Locale) {
  const s = info[locale].contacts;
  return buildMeta({ locale, path: "/kontakty/", title: s.metaTitle, description: s.metaDescription });
}

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = info[locale];
  const c = s.contacts;
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/kontakty/", label: c.title }]} title={c.title} lead={c.lead} />

      <div className="mx-auto mt-10 max-w-[1440px] px-4 md:mt-16 md:px-8">
        <ContactRows locale={locale} />

        <div className="mt-14 grid gap-10 md:mt-24 md:grid-cols-3 md:gap-8">
          <section aria-labelledby="hours" className="border-t border-ink pt-4">
            <h2 id="hours" className="t-h3">{c.hoursTitle}</h2>
            <p className="mt-3 max-w-[34ch] text-[17px] leading-[1.5] text-ink-2">{c.hours}</p>
          </section>
          <section aria-labelledby="regions" className="border-t border-ink pt-4">
            <h2 id="regions" className="t-h3">{c.regionsTitle}</h2>
            <ul className="mt-3 text-[17px] leading-[1.6]">
              {site.installRegions[locale].map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-2 text-[15px] text-ink-2">{c.regionsNote}</p>
          </section>
          <section aria-labelledby="showroom" className="border-t border-ink pt-4">
            <h2 id="showroom" className="t-h3">{c.showroomTitle}</h2>
            <p className="mt-3 max-w-[38ch] text-[17px] leading-[1.5] text-ink-2">{c.showroom}</p>
            <Link href={href(locale, "/obekty/")} className="mt-2 inline-flex min-h-11 items-center underline decoration-1 underline-offset-[6px] hover:decoration-2">
              {c.seeProjects}
            </Link>
          </section>
        </div>

        <section aria-labelledby="legal" className="mt-14 border-t border-line pt-4 md:mt-20">
          <h2 id="legal" className="t-data">{c.legalTitle}</h2>
          {/* ВРЕМЕННО: ИП в процессе открытия — данные из site.legal заменить, когда придут. */}
          <p className="mt-2 text-[15px] text-ink-2">
            {site.legal.name}
            {/* Номер — только когда ИП зарегистрирован: заглушку не показываем. */}
            {!site.legal.temporary && <>, {c.license}&nbsp;{site.legal.license}</>}
          </p>
        </section>
      </div>
      {/* Отдельной разметки организации нет: она одна на весь сайт (businessLd в оболочке, @id #business). */}
    </>
  );
}
