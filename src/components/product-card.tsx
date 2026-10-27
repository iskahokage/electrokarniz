"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Picture } from "@/components/picture";
import { cn } from "@/lib/cn";
import { Price } from "@/components/price";
import { brands } from "@/content/brands";
import type { Product } from "@/content/types";
import { cart } from "@/lib/cart";
import { cornicePrice } from "@/lib/pricing";
import { track } from "@/lib/track";
import { href, tr, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { tc } from "@/i18n/pages/catalog";

/** Карточка товара: спокойная, без «Хит!» и вечных скидок. Комплект — «Выбрать длину», штучный — сразу в корзину. */
export function ProductCard({ product: p, locale, sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" }: { product: Product; locale: Locale; sizes?: string }) {
  const tt = t(locale);
  const link = href(locale, `/katalog/${p.slug}/`);
  const from = p.kind === "kit" ? cornicePrice({ length: 1, rows: 1, base: p.price.base, perMeter: p.price.perMeter }) : (p.price.unit ?? null);
  // Только характеристики с источником, максимум две — карточка не паспорт.
  const specs = p.specs.filter((s) => s.source).slice(0, 2);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(id);
  }, [added]);
  return (
    <article className="group flex w-full flex-col">
      <Link href={link} className="block bg-paper-2" tabIndex={-1} aria-hidden>
        <Picture
          name={p.images[0]}
          alt=""
          sizes={sizes}
          className="aspect-square"
          imgClassName="transition-transform duration-700 ease-out-soft group-hover:scale-[1.02] motion-reduce:transition-none"
          demo={p.demo}
          fit={p.category === "kits" ? "cover" : "contain"}
        />
      </Link>
      {/* Марка — только если есть; без неё строка повторяла бы первое слово названия. */}
      {p.brand && <p className="t-data mt-3">{brands[p.brand].name}</p>}
      <h3 className={cn(p.brand ? "mt-0.5" : "mt-3", "text-[18px] leading-tight font-semibold tracking-[-0.02em]")}>
        {/* Ссылка выше строки на 44 px для пальца; отрицательные поля не раздвигают карточку. */}
        <Link href={link} className="-my-[11px] inline-block min-w-11 py-[11px] hover:underline">
          {p.kind === "kit" || p.brand ? p.name : tr(p.title, locale)}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-ink-2">{tr(p.short, locale)}</p>
      {specs.length > 0 && (
        <dl className="mt-2 space-y-0.5">
          {specs.map((s) => (
            // Перенос вместо двух колонок: длинные кыргызские подписи иначе ломаются в узкой карточке.
            <div key={s.label.ru} className="t-data flex flex-wrap gap-x-1.5">
              <dt className="text-ink-3">{tr(s.label, locale)}</dt>
              <dd className="min-w-0 break-words">{typeof s.value === "string" ? s.value : tr(s.value, locale)}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-auto pt-3">
        <p className="text-[17px]">
          <Price value={from} from={p.kind === "kit"} locale={locale} />
          {p.kind === "item" && p.price.per && <span className="t-data ml-2 text-ink-2">{tr(p.price.per, locale)}</span>}
        </p>
        <p className="t-data mt-0.5">{p.stock === "in" ? tt.inStock : tt.onOrder(p.leadDays ?? "15–20")}</p>
        {p.kind === "kit" ? (
          <Link href={link} className="btn btn-line mt-3 min-h-11 w-full px-1 text-[14px] whitespace-nowrap min-[360px]:px-2 min-[360px]:text-[15px]">
            {tc(locale).card.choose}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              cart.add({ id: p.slug, slug: p.slug, kind: "item", title: p.title, brand: p.brand, image: p.images[0], unitPrice: p.price.unit ?? null, ...(p.price.per?.ru === "за метр" ? { unit: "m" as const } : {}) });
              track("add_to_cart", { item_id: p.slug, source: "card" });
              setAdded(true);
            }}
            className="btn btn-line mt-3 min-h-11 w-full px-1 text-[14px] whitespace-nowrap min-[360px]:px-2 min-[360px]:text-[15px]"
          >
            <span aria-live="polite">{added ? tc(locale).card.added : tt.toCart}</span>
          </button>
        )}
      </div>
    </article>
  );
}
