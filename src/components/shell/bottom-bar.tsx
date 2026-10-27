"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Calculator, LayoutGrid } from "lucide-react";
import { waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";
import { href, type Locale } from "@/i18n";
import { t } from "@/i18n/common";

// Внизу — не больше одной закреплённой панели: на страницах со своей sticky-кнопкой эта панель прячется.
const OWN_STICKY = [/^\/katalog\/[^/]+\/$/, /^\/korzina\//, /^\/oformlenie\//, /^\/raschet\//];

export function BottomBar({ locale }: { locale: Locale }) {
  const tt = t(locale);
  const bare = (usePathname() || "/").replace(/^\/ky(?=\/|$)/, "") || "/";
  if (OWN_STICKY.some((r) => r.test(bare))) return null;
  return (
    <>
      <div aria-hidden className="h-[calc(56px+env(safe-area-inset-bottom))] md:hidden" />
      <nav aria-label={tt.bottom.label} data-bottom-bar className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1.35fr_1fr_1fr] border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <a href={waLink(tt.waHello)} className="m-1.5 flex min-h-11 items-center justify-center gap-2 bg-accent text-[14px] text-accent-ink">
          <MessageCircle className="size-[18px]" strokeWidth={1.6} />
          {tt.bottom.wa}
        </a>
        <Link href={href(locale, "/raschet/")} className="flex min-h-14 items-center justify-center gap-2 text-[14px]">
          <Calculator className="size-[18px]" strokeWidth={1.6} />
          {tt.bottom.calc}
        </Link>
        {/* Текущий раздел помечаем: иначе кнопка «Каталог» на самом каталоге выглядит как переход. */}
        <Link
          href={href(locale, "/katalog/")}
          aria-current={bare === "/katalog/" ? "page" : undefined}
          className={cn("flex min-h-14 items-center justify-center gap-2 text-[14px]", bare === "/katalog/" && "text-ink underline decoration-accent decoration-2 underline-offset-[6px]")}
        >
          <LayoutGrid className="size-[18px]" strokeWidth={1.6} />
          {tt.bottom.catalog}
        </Link>
      </nav>
    </>
  );
}
