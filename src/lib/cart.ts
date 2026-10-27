"use client";

// Корзина в localStorage. Читаем через useSyncExternalStore: на сервере пусто,
// без расхождения при гидрации; переживает переход в WhatsApp и обратно.
import { useSyncExternalStore } from "react";
import type { L } from "@/i18n";

export type KitConfig = {
  length: number;
  opening: "center" | "side";
  mount: "ceiling" | "wall" | "niche";
  control: "remote" | "app" | "alice" | "switch";
  rows: 1 | 2;
  region: "bishkek" | "chui" | "issyk-kul" | "osh" | "delivery";
  shape?: "straight" | "bay" | "corner";
  fabric?: "sheer" | "regular" | "heavy";
};

export type CartItem = {
  id: string; // уникальный ключ строки: slug + конфигурация
  slug: string;
  kind: "kit" | "item";
  title: L;
  brand?: string;
  image?: string; // имя из media manifest
  qty: number;
  unitPrice: number | null; // null — цена уточняется
  config?: KitConfig;
  /** "m" — товар продаётся метрами (профиль, ремень): qty — это метры, а не штуки. */
  unit?: "m";
  /** Товара больше нет в каталоге: в сумму не входит, уточняем в WhatsApp. */
  gone?: boolean;
};

const KEY = "ek-cart-v1";
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;
const EMPTY: CartItem[] = [];

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Другая вкладка изменила корзину.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const cart = {
  add(item: Omit<CartItem, "qty"> & { qty?: number }) {
    const items = read();
    const found = items.find((i) => i.id === item.id);
    if (found) write(items.map((i) => (i.id === item.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i)));
    else write([...items, { ...item, qty: item.qty ?? 1 }]);
  },
  setQty(id: string, qty: number) {
    write(qty <= 0 ? read().filter((i) => i.id !== id) : read().map((i) => (i.id === id ? { ...i, qty } : i)));
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  clear() {
    write([]);
  },
  /** Заменить корзину целиком — после сверки с текущим каталогом. */
  replace(items: CartItem[]) {
    write(items);
  },
};

export function kitId(slug: string, c: KitConfig) {
  return `${slug}|${c.length.toFixed(1)}|${c.opening}|${c.mount}|${c.control}|${c.rows}|${c.region}|${c.shape ?? ""}|${c.fabric ?? ""}`;
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.qty, 0);
  const hasUnknown = items.some((i) => i.unitPrice == null);
  return { items, count, total, hasUnknown, ...cart };
}
