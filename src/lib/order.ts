// Отправка заказа в Google Apps Script (apps-script/orders.gs). Заказ не должен теряться молча:
// нет адреса скрипта → тестовый номер DEV-…; скрипт недоступен → экран «отправьте в WhatsApp».
import type { Locale } from "../i18n";
import type { CartItem } from "./cart";
import type { Payment, ReceiveMethod } from "../i18n/pages/order";
import { cartTotals, configSummary } from "./order-message";
import { readUtm, type Utm } from "./track";

// UTM пишет один механизм — src/components/shell/analytics.tsx (sessionStorage «ek-utm», первая страница визита).
// Здесь только читаем: второй «запоминатель» затирал бы landing и referrer.
function readReferrer(utm: Utm) {
  if (utm.referrer) return utm.referrer;
  try {
    return document.referrer.startsWith(window.location.origin) ? "" : document.referrer.slice(0, 300);
  } catch {
    return "";
  }
}

export type OrderForm = {
  name: string;
  phone: string; // уже нормализованный, E.164
  method: ReceiveMethod;
  city: string;
  address: string;
  comment: string;
  payment: Payment | null;
};

export type OrderPayload = OrderForm & {
  type: "order";
  locale: Locale;
  page: string;
  referrer: string;
  utm: Utm;
  items: { slug: string; title: string; config: string; qty: number; unit?: "m"; unitPrice: number | null; lineTotal: number | null }[];
  total: number;
  hasUnknown: boolean;
  elapsedMs: number;
  hp: string; // honeypot: у людей пусто
};

export function buildPayload(form: OrderForm, items: CartItem[], locale: Locale, elapsedMs: number, hp: string): OrderPayload {
  const { total, hasUnknown } = cartTotals(items);
  const utm = readUtm();
  return {
    ...form,
    type: "order",
    locale,
    page: typeof window === "undefined" ? "" : window.location.pathname,
    referrer: typeof window === "undefined" ? "" : readReferrer(utm),
    utm,
    items: items.map((i) => ({
      slug: i.slug,
      title: i.title.ru, // в таблице — по-русски, чтобы владельцу было проще искать
      config: i.config ? configSummary(i.config, "ru") : "",
      qty: i.qty,
      ...(i.unit ? { unit: i.unit } : {}),
      unitPrice: i.unitPrice,
      lineTotal: i.unitPrice == null ? null : i.unitPrice * i.qty,
    })),
    total,
    hasUnknown,
    elapsedMs: Math.round(elapsedMs),
    hp,
  };
}

export type SubmitResult = { ok: true; number: string; dev?: boolean } | { ok: false; error: string };

export async function submitOrder(payload: OrderPayload): Promise<SubmitResult> {
  const endpoint = process.env.NEXT_PUBLIC_ORDER_ENDPOINT;
  if (!endpoint) {
    const number = `DEV-${Math.floor(1000 + Math.random() * 9000)}`;
    console.info("[order] NEXT_PUBLIC_ORDER_ENDPOINT не задан — тестовый номер", number, payload);
    return { ok: true, number, dev: true };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    // text/plain — «простой» запрос без preflight: Apps Script не отвечает на OPTIONS.
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: ctrl.signal,
    });
    const data = (await res.json()) as { ok?: boolean; number?: string; error?: string };
    if (data.ok && data.number) return { ok: true, number: String(data.number) };
    return { ok: false, error: data.error || `status ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  } finally {
    clearTimeout(timer);
  }
}
