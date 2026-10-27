import Link from "next/link";
import { site } from "@/content/site";
import { waLink } from "@/lib/whatsapp";
import { href, type Locale } from "@/i18n";
import { nav, t } from "@/i18n/common";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { LangSwitch } from "./header";
import { brands } from "@/content/brands";

// Ссылки подвала — от 44 px по высоте: в них часто попадают пальцем.
const link = "inline-flex min-h-11 min-w-11 items-center py-1 text-[15px] leading-tight hover:underline";

// Подписи Tomorrow Techs нет — владелец решил убрать (26.10.2026).
export function Footer({ locale }: { locale: Locale }) {
  const f = t(locale).footer;
  return (
    <footer className="mt-16 border-t border-ink bg-paper md:mt-24">
      {/* На телефоне — компактно: два столбца ссылок вместо четырёх блоков друг под другом. */}
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 md:grid-cols-12 md:gap-y-10 md:px-8 md:py-12">
        <div className="col-span-2 md:col-span-12 lg:col-span-4">
          <Logo />
          <p className="mt-4 max-w-sm text-[15px] leading-snug text-ink-2">{f.tagline}</p>
          <p className="t-data mt-4">{f.regions}</p>
          <p className="t-data mt-1">{f.hours}</p>
        </div>
        <nav aria-label={f.sections} className="md:col-span-3 lg:col-span-2">
          <p className="mb-1 text-[13px] text-ink-3">{f.sections}</p>
          <ul>
            {nav.map((n) => (
              <li key={n.path}>
                <Link href={href(locale, n.path)} className={link}>
                  {n[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={f.buyers} className="md:col-span-5 lg:col-span-3">
          <p className="mb-1 text-[13px] text-ink-3">{f.buyers}</p>
          <ul>
            {f.links.map((l) => (
              <li key={l.path}>
                <Link href={href(locale, l.path)} className={link}>
                  {l.label}
                </Link>
              </li>
            ))}
            {/* Страницы марок — по ТЗ (раздел 29) в подвале: на них ищут «Dooya Бишкек», «Novo Бишкек». */}
            {Object.values(brands).map((b) => (
              <li key={b.id}>
                <Link href={href(locale, `/brendy/${b.id}/`)} className={link}>
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="col-span-2 md:col-span-4 lg:col-span-3">
          <p className="mb-1 text-[13px] text-ink-3">{f.contacts}</p>
          <ul className="flex flex-wrap gap-x-6 md:block">
            <li>
              <a href={site.phoneHref} className={cn(link, "tnum")}>{site.phone}</a>
            </li>
            <li>
              <a href={waLink(t(locale).waHello)} className={link}>WhatsApp</a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className={cn(link, "[overflow-wrap:anywhere]")}>{site.email}</a>
            </li>
            <li>
              <a href={site.instagram} className={cn(link, "[overflow-wrap:anywhere]")} rel="noopener">Instagram {site.instagramHandle}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-5 text-[13px] text-ink-3 md:flex-row md:justify-between md:gap-8 md:px-8">
          {/* Пока ИП оформляется, номер-заглушку (000000000) не показываем: на сайте он выглядит как настоящий. */}
          <p>© 2026 {site.name}. {f.legal(site.legal.name, site.legal.temporary ? null : site.legal.license)}</p>
          <p>{f.demo}</p>
          <LangSwitch locale={locale} className="-ml-2 self-start md:-my-3 md:ml-0" />
        </div>
      </div>
    </footer>
  );
}
