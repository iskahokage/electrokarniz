"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Picture } from "@/components/picture";
import { Price } from "@/components/price";
import { brands } from "@/content/brands";
import { useCart, type CartItem } from "@/lib/cart";
import { useCartSync } from "@/lib/cart-sync";
import { DISCOUNT, PRICING } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import { configSummary, type KitConfigX } from "@/lib/order-message";
import { href, tr, type Locale } from "@/i18n";
import { os } from "@/i18n/pages/order";
import { cn } from "@/lib/cn";
import { useReached } from "./use-reached";

const noop = () => () => {};
/** true только в браузере после гидрации: корзина живёт в localStorage, сервер её не видит. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Ссылка «Изменить расчёт»: открывает калькулятор с параметрами этого комплекта. */
export function recalcHref(locale: Locale, item: CartItem) {
  const c = item.config as KitConfigX | undefined;
  if (!c) return href(locale, `/katalog/${item.slug}/`);
  const q = new URLSearchParams({ type: "sliding", l: c.length.toFixed(1), o: c.opening, mt: c.mount, r: String(c.rows), c: c.control, rg: c.region, m: item.slug });
  if (c.shape) q.set("sh", c.shape);
  if (c.fabric) q.set("f", c.fabric);
  if (item.qty > 1) q.set("w", String(item.qty));
  return `${href(locale, "/raschet/")}?${q}`;
}

export function CartView({ locale }: { locale: Locale }) {
  const s = os(locale).cart;
  const mounted = useMounted();
  const { items, subtotal, discount, total, cornices, hasUnknown, setQty, remove } = useCart();
  const [checkoutRef, checkoutVisible] = useReached<HTMLAnchorElement>();
  useCartSync(items, mounted);

  if (!mounted) {
    return <p className="mx-auto max-w-[1440px] px-4 py-16 text-ink-3 md:px-8" role="status">{s.loading}</p>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mt-8 border-t border-ink pt-8 md:mt-12 md:grid md:grid-cols-12 md:gap-10">
          <h2 className="t-h3 md:col-span-5">{s.empty}</h2>
          <div className="mt-3 md:col-span-6 md:col-start-7 md:mt-0">
            <p className="t-lead max-w-[48ch]">{s.emptyLead}</p>
            <div className="mt-6 grid gap-2 sm:flex">
              <Link href={href(locale, "/raschet/")} className="btn btn-accent">{s.toCalc}</Link>
              <Link href={href(locale, "/katalog/")} className="btn btn-line">{s.toCatalog}</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const kitsTotal = items.filter((i) => i.kind === "kit").reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.qty, 0);
  const belowMin = kitsTotal > 0 && kitsTotal < PRICING.minOrder;
  const hasInstall = items.some((i) => i.kind === "kit" && i.config?.region === "bishkek");
  // «Позиции» — строки заказа: комплект на 3 окна — одна позиция.
  const count = items.length;
  // begin_checkout отправляет форма оформления (один раз на показ) — здесь не дублируем.

  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-8">
      <div className="mt-8 md:mt-12 md:grid md:grid-cols-12 md:gap-10">
        <ul className="border-t border-ink md:col-span-7 lg:col-span-8">
          {items.map((i) => (
            <Line key={i.id} item={i} locale={locale} onQty={(q) => setQty(i.id, q)} onRemove={() => remove(i.id)} />
          ))}
        </ul>

        <aside aria-labelledby="cart-total" className="mt-8 md:col-span-5 md:mt-0 lg:col-span-4">
          <div className="border-t border-ink bg-paper-2 p-5 md:sticky md:top-24 md:p-6">
            <p className="text-[15px] text-ink-2">{s.items(count)}</p>
            <h2 id="cart-total" className="mt-4 text-[15px] text-ink-2">{s.total}</h2>
            <p aria-live="polite" className="tnum mt-1 font-display text-[40px] leading-none font-semibold tracking-[-0.04em]">
              {total > 0 ? `${formatNumber(total)} сом` : <Price value={null} locale={locale} />}
            </p>
            {hasUnknown && <p className="mt-2 text-[14px] text-ink-2">{total > 0 ? s.unknownExtra : s.unknownOnly}</p>}
            <dl className="mt-5 grid gap-2 border-t border-line pt-4 text-[14px] leading-snug">
              {discount > 0 && (
                <>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-2">{s.subtotal}</dt>
                    <dd className="tnum text-right">{formatNumber(subtotal)} сом</dd>
                  </div>
                  <div className="flex justify-between gap-4 text-accent">
                    <dt>{s.discount}</dt>
                    <dd className="tnum text-right">−{formatNumber(discount)} сом</dd>
                  </div>
                </>
              )}
              {hasInstall && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-2">{s.install}</dt>
                  <dd className="text-right">{s.installValue}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">{s.delivery}</dt>
                <dd className="text-right">{s.deliveryValue}</dd>
              </div>
            </dl>
            {/* Подсказка про скидку — только когда до неё 1–3 карниза: дальше она уже действует. */}
            {cornices > 0 && cornices < DISCOUNT.minCornices && (
              <p className="mt-4 border-l-2 border-accent pl-3 text-[14px] leading-snug">{s.discountHint(DISCOUNT.minCornices - cornices)}</p>
            )}
            {belowMin && <p className="mt-4 border-l-2 border-error pl-3 text-[14px] text-error">{s.minOrder}</p>}
            {kitsTotal > 0 && <p className="mt-4 text-[13px] leading-snug text-ink-3">{s.measure}</p>}
            <Link ref={checkoutRef} href={href(locale, "/oformlenie/")} className="btn btn-accent mt-6 w-full">
              {s.checkout}
            </Link>
            <p className="mt-3 text-[13px] leading-snug text-ink-3">{s.noPay}</p>
            <Link href={href(locale, "/katalog/")} className="mt-3 inline-flex min-h-11 items-center text-[15px] underline decoration-1 underline-offset-[6px]">
              {s.continue}
            </Link>
          </div>
        </aside>
      </div>

      {/* Телефон: «Оформить заказ» закреплена внизу вместо общей панели, пока не видна такая же кнопка в итоге. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-paper/95 px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 motion-reduce:transition-none md:hidden",
          checkoutVisible && "translate-y-full",
        )}
        inert={checkoutVisible}
      >
        <div className="min-w-0 flex-1">
          <span className="block text-[12px] leading-tight text-ink-3">{s.total}</span>
          <span className="tnum block truncate font-display text-[22px] leading-tight font-semibold tracking-[-0.03em]">
            {total > 0 ? `${formatNumber(total)} сом` : <Price value={null} locale={locale} />}
            {hasUnknown && total > 0 && <span className="font-sans text-[14px] font-normal text-ink-2"> +</span>}
          </span>
        </div>
        <Link href={href(locale, "/oformlenie/")} className="btn btn-accent min-h-12 shrink-0 px-5">
          {s.checkout}
        </Link>
      </div>
    </div>
  );
}

function Line({ item: i, locale, onQty, onRemove }: { item: CartItem; locale: Locale; onQty: (q: number) => void; onRemove: () => void }) {
  const s = os(locale).cart;
  const title = tr(i.title, locale);
  return (
    <li className="grid grid-cols-[80px_1fr] gap-x-4 border-b border-line py-5 md:grid-cols-[120px_1fr] md:gap-x-6">
      <Picture name={i.image ?? ""} alt="" sizes="120px" className="aspect-square bg-paper-2" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {/* Марку подписываем, только если её нет в самом названии — иначе «Novo» дважды подряд. */}
            {i.brand && i.brand in brands && !title.includes(brands[i.brand as keyof typeof brands].name) && <p className="t-data">{brands[i.brand as keyof typeof brands].name}</p>}
            <h3 className="mt-0.5 text-[17px] leading-tight font-semibold tracking-[-0.02em] md:text-[19px]">{title}</h3>
          </div>
          <button type="button" onClick={onRemove} aria-label={s.removeLabel(title)} className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center text-ink-2 hover:text-ink">
            <X aria-hidden className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        {i.config && <p className="t-data mt-1.5">{configSummary(i.config, locale)}</p>}
        {i.gone && <p className="mt-1.5 border-l-2 border-error pl-3 text-[14px] text-ink-2">{s.gone}</p>}
        {i.kind === "kit" && (
          <Link href={recalcHref(locale, i)} className="mt-1 inline-flex min-h-11 items-center text-[14px] underline decoration-1 underline-offset-4">
            {s.recalc}
          </Link>
        )}
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-px" role="group" aria-label={s.qty}>
              <button type="button" aria-label={s.less} onClick={() => onQty(i.qty - 1)} disabled={i.qty <= 1} className="grid size-11 place-items-center bg-paper-2 hover:bg-paper-3 disabled:opacity-40">
                <Minus aria-hidden className="size-4" />
              </button>
              <output aria-live="polite" className="tnum grid h-11 min-w-12 place-items-center bg-paper-2 px-1 text-[17px]">
                {i.qty}
                {i.unit === "m" ? `\u00a0${s.meters}` : ""}
              </output>
              <button type="button" aria-label={s.more} onClick={() => onQty(i.qty + 1)} disabled={i.qty >= 99} className="grid size-11 place-items-center bg-paper-2 hover:bg-paper-3 disabled:opacity-40">
                <Plus aria-hidden className="size-4" />
              </button>
            </div>
            {/* Цены нет — строка «⃀ за шт.» ничего не сообщает: знак сома уже стоит в сумме строки. */}
            {i.unitPrice != null && (
              <p className="t-data mt-1.5">
                <Price value={i.unitPrice} locale={locale} /> {i.kind === "kit" ? s.perWindow : i.unit === "m" ? s.perMeter : s.each}
              </p>
            )}
          </div>
          <p className="tnum text-[18px] font-semibold">
            <Price value={i.unitPrice == null ? null : i.unitPrice * i.qty} locale={locale} />
          </p>
        </div>
      </div>
    </li>
  );
}
