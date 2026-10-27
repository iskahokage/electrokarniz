import { waLink } from "@/lib/whatsapp";
import { site } from "@/content/site";
import type { Locale } from "@/i18n";
import { t } from "@/i18n/common";

/** Финальный призыв: одна главная кнопка — WhatsApp с готовым текстом по теме страницы. */
export function CtaBand({ locale, title, lead, wa, label, track }: { locale: Locale; title: string; lead: string; wa: string; label?: string; track: string }) {
  const tt = t(locale);
  return (
    <section aria-labelledby={`cta-${track}`} className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-32 md:px-8">
      <div className="grid gap-6 border-t border-ink pt-8 md:grid-cols-12 md:gap-10 md:pt-12">
        <div className="md:col-span-7">
          <h2 id={`cta-${track}`} className="t-h2 max-w-[16ch]">
            {title}
          </h2>
          <p className="t-lead mt-4 max-w-[48ch]">{lead}</p>
        </div>
        <div className="flex flex-col gap-3 md:col-span-5 md:items-start md:justify-end">
          <a href={waLink(wa)} data-track={track} className="btn btn-accent w-full md:w-auto">
            {label ?? tt.writeWa}
          </a>
          <a href={site.phoneHref} className="tnum inline-flex min-h-11 items-center text-[16px] underline decoration-1 underline-offset-[6px]">
            {site.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
