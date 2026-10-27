import Link from "next/link";
import type { ReactNode } from "react";
import { href, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { site } from "@/content/site";
import { ldJson } from "@/lib/jsonld";

type Crumb = { path: string; label: string };

/** Заголовок внутренней страницы: хлебные крошки (+ JSON-LD BreadcrumbList), h1, лид. */
export function PageHead({ locale, crumbs, title, lead, children }: { locale: Locale; crumbs: Crumb[]; title: string; lead?: string; children?: ReactNode }) {
  const all = [{ path: "/", label: t(locale).home }, ...crumbs];
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: new URL(href(locale, c.path), site.url).toString() })),
  };
  return (
    <div className="mx-auto max-w-[1440px] px-4 pt-6 md:px-8 md:pt-10">
      {/* Крошки в одну строку: длинное название текущей страницы (часто кыргызское) обрезается многоточием, а не переносится. */}
      <nav aria-label={t(locale).crumbs} data-crumbs>
        <ol className="flex items-center gap-x-2 text-[13px] text-ink-3 md:text-[14px]">
          {all.map((c, i) => (
            <li key={c.path} className={i < all.length - 1 ? "flex shrink-0 items-center gap-2 whitespace-nowrap" : "flex min-w-0 max-w-full items-center gap-2"}>
              {i > 0 && <span aria-hidden>/</span>}
              {i < all.length - 1 ? (
                <Link href={href(locale, c.path)} className="inline-flex min-h-11 min-w-11 items-center hover:text-ink hover:underline">{c.label}</Link>
              ) : (
                <span aria-current="page" title={c.label} className="min-w-0 truncate py-[13px] leading-[18px] text-ink-2">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <h1 className="t-h1 mt-2 max-w-[18ch]">{title}</h1>
      {lead && <p className="t-lead mt-4 max-w-[60ch]">{lead}</p>}
      {children}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(ld) }} />
    </div>
  );
}
