"use client";

// Сверка корзины с каталогом. В localStorage цена и название «застывают» на момент добавления;
// после обновления прайса клиент видел бы и отправлял старую цену. Пересчитываем при открытии корзины и оформления.
import { useEffect } from "react";
import { productBySlug } from "@/content/catalog";
import { cart, type CartItem } from "./cart";
import { cornicePrice } from "./pricing";

export function syncItem(i: CartItem): CartItem {
  const p = productBySlug(i.slug);
  if (!p) return i.gone && i.unitPrice == null ? i : { ...i, gone: true, unitPrice: null };
  const unitPrice =
    i.kind === "kit" && i.config
      ? p.price.base != null
        ? cornicePrice({ length: i.config.length, rows: i.config.rows, base: p.price.base, perMeter: p.price.perMeter })
        : null
      : (p.price.unit ?? null);
  const unit = p.price.per?.ru === "за метр" ? ("m" as const) : undefined;
  const next: CartItem = { ...i, title: p.title, unitPrice, unit, gone: undefined };
  if (!next.unit) delete next.unit;
  if (!next.gone) delete next.gone;
  return next;
}

/** Один раз после показа: обновляет цены, названия и единицы; пропавшие товары помечает. */
export function useCartSync(items: CartItem[], ready: boolean) {
  useEffect(() => {
    if (!ready || !items.length) return;
    const next = items.map(syncItem);
    if (JSON.stringify(next) !== JSON.stringify(items)) cart.replace(next);
    // Только при открытии страницы: дальше корзину меняет сам человек.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}
