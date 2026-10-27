"use client";

import Link from "next/link";
import { useState } from "react";
import { RailRange } from "@/components/controls";
import { WindowScheme } from "@/components/window-scheme";
import { formatMeters, formatSom } from "@/lib/format";
import { cornicePrice, PRICING } from "@/lib/pricing";
import { waLink } from "@/lib/whatsapp";
import { track } from "@/lib/track";
import { href, type Locale } from "@/i18n";
import { th } from "@/i18n/pages/home";
import { t } from "@/i18n/common";

// Вход в калькулятор: одна длина → цена сразу. Подробности (открытие, монтаж, ряды) — на /raschet/, туда передаём ?l=.
export function CalcTeaser({ locale }: { locale: Locale }) {
  const s = th(locale).calc;
  const [len, setLen] = useState(3);
  const [touched, setTouched] = useState(false);
  const price = cornicePrice({ length: len, rows: 1 });
  const lenText = formatMeters(len, locale);
  const onChange = (v: number) => {
    if (!touched) {
      setTouched(true);
      track("calculator_start", { source: "home", length: v });
    }
    setLen(v);
  };
  return (
    <div className="grid gap-6 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-6 lg:col-span-7">
        {/* Схема окна растёт вместе с длиной: видно, что именно меняет цену. */}
        <WindowScheme length={len} oneSide={false} rows={0} locale={locale} className="mx-auto h-auto w-full max-w-[300px] text-ink md:max-w-[560px]" accent="var(--color-accent)" />
      </div>
      <div className="md:col-span-6 lg:col-span-5">
        <div className="flex items-end justify-between gap-4">
          <span className="text-[15px] text-ink-2">{s.length}</span>
          <span aria-hidden className="tnum font-mono text-[28px] leading-none md:text-[34px]">
            {lenText}
          </span>
        </div>
        <RailRange label={s.length} value={len} onChange={onChange} min={PRICING.minLength} max={PRICING.maxLength} className="mt-2 text-ink" />
        <div className="t-data flex justify-between">
          <span>{formatMeters(PRICING.minLength, locale)}</span>
          <span>{formatMeters(PRICING.maxLength, locale)}</span>
        </div>
        <div className="mt-6 border-t border-ink pt-5 md:mt-8">
          <p className="text-[15px] text-ink-2">{s.price}</p>
          <p aria-live="polite" className="tnum mt-1 text-[44px] leading-none font-semibold tracking-[-0.03em] md:text-[56px]">
            {formatSom(price)}
          </p>
          <p className="mt-3 max-w-[52ch] text-[14px] leading-snug text-ink-2">{s.note}</p>
        </div>
        {/* В узкой колонке (планшет) кнопки друг под другом: кыргызский «WhatsApp'ка жазуу» иначе ломается в две строки. */}
        <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
          <Link href={`${href(locale, "/raschet/")}?l=${len.toFixed(1)}`} className="btn btn-ink">
            {s.more}
          </Link>
          <a href={waLink(s.wa(lenText, formatSom(price)))} data-track="home-calc" className="btn btn-line">
            {t(locale).writeWa}
          </a>
        </div>
      </div>
    </div>
  );
}
