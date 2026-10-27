"use client";

import { site } from "@/content/site";
import type { Locale } from "@/i18n";
import { info } from "@/i18n/pages/info";
import { track } from "@/lib/track";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

/** Контакты — крупными строками во всю ширину: с телефона попасть пальцем легко, номер читается издалека. */
export function ContactRows({ locale }: { locale: Locale }) {
  const c = info[locale].contacts;
  const rows = [
    { key: "wa", label: c.wa, value: site.phone, action: c.waAction, href: waLink(c.waText), accent: true, onClick: () => track("whatsapp_click", { method: "whatsapp", item_id: "contacts" }) },
    { key: "tel", label: c.phone, value: site.phone, action: c.phoneAction, href: site.phoneHref, onClick: () => track("call_click", { method: "phone", item_id: "contacts" }) },
    { key: "mail", label: c.email, value: site.email, action: c.emailAction, href: `mailto:${site.email}` },
    { key: "ig", label: c.instagram, value: site.instagramHandle, action: c.instagramAction, href: site.instagram, external: true },
  ];
  return (
    <ul className="border-t border-ink">
      {rows.map((r) => (
        <li key={r.key} className="border-b border-line">
          <a
            href={r.href}
            onClick={r.onClick}
            {...(r.external ? { rel: "noopener", target: "_blank" } : {})}
            className={cn(
              "group grid min-h-24 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-0 py-5 md:min-h-32 md:grid-cols-12 md:gap-8",
              r.accent && "-mx-4 bg-accent px-4 text-accent-ink hover:bg-accent-2 md:-mx-8 md:px-8",
            )}
          >
            <span className={cn("t-data col-span-2 md:col-span-2", r.accent && "text-accent-ink/80")}>{r.label}</span>
            <span className="tnum min-w-0 text-[clamp(1.5rem,1rem+2.6vw,3.25rem)] leading-none font-semibold tracking-[-0.035em] break-words md:col-span-7">
              {r.value}
            </span>
            <span className="justify-self-end text-[15px] underline decoration-1 underline-offset-[6px] group-hover:decoration-2 md:col-span-3">
              {r.action}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
