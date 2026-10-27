"use client";

import Link from "next/link";
import { useState } from "react";
import { RailRange } from "@/components/controls";
import { WindowScheme } from "@/components/window-scheme";
import { formatMeters, formatSom } from "@/lib/format";
import { cornicePrice, PRICING } from "@/lib/pricing";
import { track } from "@/lib/track";
import { waLink } from "@/lib/whatsapp";
import { href, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { solutionsDict } from "@/i18n/pages/solutions";

// Мини-расчёт на странице решения: одна длина → цена сразу; детали (открытие, монтаж, марка) — на /raschet/.
export function MiniCalc({ locale, type, noun, rows }: { locale: Locale; type: string; noun: string; rows: 1 | 2 }) {
  const s = solutionsDict[locale].solution;
  const [len, setLen] = useState(3);
  const [touched, setTouched] = useState(false);
  const price = cornicePrice({ length: len, rows });
  const lenText = formatMeters(len, locale);
  const onChange = (v: number) => {
    if (!touched) {
      setTouched(true);
      track("calculator_start", { source: "solution", type, length: v });
    }
    setLen(v);
  };
  return (
    <div>
      <WindowScheme length={len} oneSide={false} rows={rows === 2 ? 1 : 0} locale={locale} className="h-auto w-full text-ink" accent="var(--color-accent)" />
      <div className="mt-4 flex items-end justify-between gap-4">
        <span className="text-[15px] text-ink-2">{s.calcLength}</span>
        <span aria-hidden className="tnum font-mono text-[26px] leading-none">
          {lenText}
        </span>
      </div>
      <RailRange label={s.calcLength} value={len} onChange={onChange} min={PRICING.minLength} max={PRICING.maxLength} className="mt-1 text-ink" />
      <div className="t-data flex justify-between">
        <span>{formatMeters(PRICING.minLength, locale)}</span>
        <span>{formatMeters(PRICING.maxLength, locale)}</span>
      </div>
      <div className="mt-6 border-t border-ink pt-4">
        <p aria-live="polite" className="tnum text-[40px] leading-none font-semibold tracking-[-0.03em] md:text-[48px]">
          {formatSom(price)}
        </p>
        <p className="mt-3 text-[14px] leading-snug text-ink-2">{s.priceNote}</p>
        {rows === 2 && <p className="mt-2 text-[14px] leading-snug text-ink-2">{s.twoRowsNote}</p>}
      </div>
      <div className="mt-5 grid gap-2">
        <Link href={`${href(locale, "/raschet/")}?type=${type}&l=${len.toFixed(1)}`} className="btn btn-accent">
          {s.calcOpen}
        </Link>
        <a href={waLink(s.waPriced(noun, lenText))} data-track={`solution-${type}`} className="btn btn-line">
          {t(locale).writeWa}
        </a>
      </div>
    </div>
  );
}
