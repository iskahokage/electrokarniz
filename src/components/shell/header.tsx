"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCart } from "@/lib/cart";
import { waLink } from "@/lib/whatsapp";
import { site } from "@/content/site";
import { href, switchLocalePath, type Locale } from "@/i18n";
import { nav, t } from "@/i18n/common";
import { Logo } from "./logo";

export function CartLink({ locale, className }: { locale: Locale; className?: string }) {
  const { count } = useCart();
  return (
    <Link href={href(locale, "/korzina/")} aria-label={`${t(locale).cart}: ${count}`} className={cn("relative inline-flex size-11 items-center justify-center", className)}>
      <ShoppingBag className="size-5" strokeWidth={1.5} />
      {count > 0 && <span className="tnum absolute top-1 right-0 min-w-[18px] bg-accent px-1 text-center text-[12px] leading-[18px] text-accent-ink">{count}</span>}
    </Link>
  );
}

export function LangSwitch({ locale, className }: { locale: Locale; className?: string }) {
  const pathname = usePathname() || "/";
  const to: Locale = locale === "ru" ? "ky" : "ru";
  const base = switchLocalePath(pathname, to);
  // Фильтры и параметры расчёта живут в ?query и #hash: дописываем их в момент нажатия,
  // а не при рендере — иначе разойдётся гидратация статической страницы.
  const keep = (e: { currentTarget: HTMLAnchorElement }) => {
    e.currentTarget.href = base + window.location.search + window.location.hash;
  };
  // Ссылка <a>, а не Link: у языков разные корневые layout — переход всё равно полный.
  return (
    <a href={base} onPointerDown={keep} onClick={keep} onFocus={keep} hrefLang={to} lang={to} title={t(locale).lang[to]} className={cn("inline-flex h-11 items-center gap-1 px-2 font-mono text-[13px]", className)}>
      <span className="text-ink-3">{locale === "ru" ? "RU" : "KY"}</span>
      <span className="text-ink-3">/</span>
      <span className="underline decoration-1 underline-offset-4">{to === "ky" ? "KY" : "RU"}</span>
    </a>
  );
}

export function Header({ locale }: { locale: Locale }) {
  const tt = t(locale);
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const active = (p: string) => (pathname.replace(/^\/ky(?=\/|$)/, "") || "/").startsWith(p);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-[3px]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
        {tt.skip}
      </a>
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:h-16 md:px-8">
        <Link href={href(locale, "/")} aria-label={tt.brand} className="inline-flex min-h-11 items-center">
          <Logo />
        </Link>
        <nav aria-label={tt.menu} className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <Link key={n.path} href={href(locale, n.path)} aria-current={active(n.path) ? "page" : undefined} className={cn("relative py-5 text-[15px] text-ink-2 hover:text-ink", active(n.path) && "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent")}>
              {n[locale]}
            </Link>
          ))}
        </nav>
        <div className="flex items-center">
          {/* Телефон — только на широком экране: на 1024 рядом с меню ему тесно, а на телефоне звонят из меню. */}
          <a href={site.phoneHref} className="tnum mr-4 hidden min-h-11 items-center text-[15px] whitespace-nowrap text-ink-2 hover:text-ink xl:inline-flex">
            {site.phone}
          </a>
          <a href={waLink(tt.waHello)} className="btn btn-accent mr-2 hidden min-h-11 px-4 text-[14px] md:inline-flex">
            {tt.writeWa}
          </a>
          <LangSwitch locale={locale} />
          <CartLink locale={locale} />
          <button type="button" onClick={() => setOpen(true)} aria-label={tt.menu} className="inline-flex size-11 items-center justify-center lg:hidden">
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <Dialog open={open} onClose={setOpen} aria-label={tt.menu} className="relative z-50 lg:hidden">
        <div className="fixed inset-0 bg-ink/30" aria-hidden />
        <DialogPanel className="fixed inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col bg-paper pb-[env(safe-area-inset-bottom)]">
          <div className="flex h-14 items-center justify-between border-b border-line px-4">
            <Link href={href(locale, "/")} onClick={() => setOpen(false)} aria-label={tt.brand} className="inline-flex min-h-11 items-center">
              <Logo />
            </Link>
            {/* Шапка под меню недоступна (inert) — переключатель языка дублируем здесь. */}
            <div className="flex items-center">
              <LangSwitch locale={locale} />
              <button type="button" onClick={() => setOpen(false)} aria-label={tt.close} className="inline-flex size-11 items-center justify-center">
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
          {/* Разделы — крупно, справочные страницы — мельче и без линеек: два уровня, а не один длинный список. */}
          <nav aria-label={tt.menu} className="min-h-0 overflow-y-auto overscroll-contain px-4 py-2">
            {nav.map((n) => (
              <Link key={n.path} href={href(locale, n.path)} onClick={() => setOpen(false)} aria-current={active(n.path) ? "page" : undefined} className={cn("flex min-h-12 items-center border-b border-line py-2 text-[19px] leading-tight tracking-[-0.01em]", active(n.path) && "border-l-2 border-l-accent pl-3")}>
                {n[locale]}
              </Link>
            ))}
            <ul className="mt-4">
              {tt.footer.links.map((l) => (
                <li key={l.path}>
                  <Link href={href(locale, l.path)} onClick={() => setOpen(false)} aria-current={active(l.path) ? "page" : undefined} className={cn("flex min-h-11 items-center text-[15px] leading-tight text-ink-2", active(l.path) && "text-ink underline decoration-accent decoration-2 underline-offset-4")}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto space-y-2 border-t border-line p-4">
            <a href={waLink(tt.waHello)} className="btn btn-accent w-full">
              {tt.writeWa}
            </a>
            <a href={site.phoneHref} className="btn btn-line w-full">
              {tt.call} {site.phone}
            </a>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
