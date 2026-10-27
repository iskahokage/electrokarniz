import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n";
import { t } from "@/i18n/common";

// Знак кыргызского сома (⃀, U+20C0) рисуем SVG: в большинстве шрифтов глифа ещё нет.
export function SomSign({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 20" aria-hidden className={cn("inline-block h-[0.95em] w-[0.76em] align-[-0.08em]", className)}>
      <path d="M13 4.2A6.2 6.2 0 1 0 13 13.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M1.5 18h13" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Цена: число + «сом»; если цены нет (прайс не утверждён) — только знак сома (решение владельца). */
export function Price({ value, locale, from, className }: { value: number | null | undefined; locale: Locale; from?: boolean; className?: string }) {
  if (value == null) {
    return (
      <span className={cn("tnum", className)} title={t(locale).priceTbd}>
        <span className="sr-only">{t(locale).priceTbd}</span>
        <SomSign />
      </span>
    );
  }
  const n = `${formatNumber(value)} сом`;
  const text = from ? (locale === "ky" ? `${n}дон` : `от ${n}`) : n;
  return <span className={cn("tnum", className)}>{text}</span>;
}
