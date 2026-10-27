// Короткий текст для WhatsApp: номер, позиции, итог, способ получения. Полные данные — в таблице заказов.
// Импорты относительные: файл проверяется в vitest без настройки алиасов.
import type { Locale } from "../i18n";
import type { CartItem, KitConfig } from "./cart";
import { orderStrings, openings, mounts, controls, regions, shapes, fabrics, type Shape, type Fabric, type ReceiveMethod } from "../i18n/pages/order";
import { formatMeters, formatNumber } from "./format";
import { cartTotals } from "./cart-totals";

export { cartTotals, cornicesCount } from "./cart-totals";

/** Конфигурация комплекта из калькулятора: форма и ткань сверх KitConfig корзины. */
export type KitConfigX = KitConfig & { shape?: Shape; fabric?: Fabric };

const idx = <T extends string>(list: readonly T[], v: T | undefined) => Math.max(0, v ? list.indexOf(v) : 0);

/** «3,2 м, от центра, потолок, пульт, 1 ряд, Бишкек» — одна строка для корзины, сводки и сообщения. */
export function configSummary(c: KitConfigX, locale: Locale): string {
  const s = orderStrings[locale];
  const parts = [
    formatMeters(c.length, locale),
    s.calc.openingOpts[idx(openings, c.opening)].toLowerCase(),
    s.calc.mountOpts[idx(mounts, c.mount)].toLowerCase(),
  ];
  if (c.shape && c.shape !== "straight") parts.push(s.calc.shapeOpts[idx(shapes, c.shape)].toLowerCase());
  parts.push(c.rows === 2 ? s.summary.rows2 : s.summary.rows1);
  if (c.fabric) parts.push(s.calc.fabricOpts[idx(fabrics, c.fabric)].toLowerCase());
  // «Алиса» — имя, остальное — обычные слова в середине строки.
  const ctl = s.calc.controlOpts[idx(controls, c.control)];
  parts.push(c.control === "alice" ? ctl : ctl.toLowerCase());
  parts.push(s.calc.regionOpts[idx(regions, c.region)]);
  return parts.join(", ");
}

const som = (n: number) => `${formatNumber(n)} сом`;

export type OrderMessageInput = {
  locale: Locale;
  number?: string;
  items: CartItem[];
  method?: ReceiveMethod;
  city?: string;
  name?: string;
};

/** Сообщение о заказе. Без адреса и комментария: длинная ссылка wa.me ломается в некоторых браузерах. */
export function buildOrderMessage({ locale, number, items, method, city, name }: OrderMessageInput): string {
  const s = orderStrings[locale];
  const lines = [s.msg.hello, number ? s.msg.order(number) : s.msg.orderNoNum, ""];
  items.forEach((i, n) => {
    const title = i.title[locale] || i.title.ru;
    const cfg = i.config ? ` (${configSummary(i.config, locale)})` : "";
    const price = i.unitPrice == null ? s.msg.unknown : som(i.unitPrice * i.qty);
    // Профиль и ремень — метрами: «× 3 м», а не «× 3» (читается как штуки).
    lines.push(`${n + 1}. ${title}${cfg} × ${i.qty}${i.unit === "m" ? ` ${s.cart.meters}` : ""} — ${price}`);
  });
  const { discount, total, hasUnknown } = cartTotals(items);
  lines.push("");
  // Одна строка про скидку: ссылка wa.me с длинным текстом ломается в некоторых браузерах.
  if (discount > 0) lines.push(`${s.msg.discount}: −${som(discount)}`);
  if (total > 0) lines.push(`${s.msg.total}: ${som(total)}${hasUnknown ? ` ${s.msg.plusUnknown}` : ""}`);
  else lines.push(`${s.msg.total}: ${s.msg.unknown}`);
  if (method) lines.push(`${s.msg.receive}: ${s.checkout.methods[method].t}${city ? `, ${city}` : ""}`);
  if (name) lines.push(`${s.msg.name}: ${name}`);
  return lines.join("\n");
}

export type CalcMessageInput = {
  locale: Locale;
  typeLabel: string;
  config?: KitConfigX;
  model?: string;
  windows: number;
  price: number | null;
  /** Скидка за количество карнизов, уже вычтена из price. */
  discount?: number;
  over?: boolean;
  /** Параметры без цены (ширина окна, управление, регион) — для типов «по расчёту». */
  details?: string[];
  url?: string;
};

/** Текст расчёта или заявки «по расчёту» из калькулятора. */
export function buildCalcMessage({ locale, typeLabel, config, model, windows, price, discount = 0, over, details, url }: CalcMessageInput): string {
  const s = orderStrings[locale];
  const head = price != null && !over ? s.msg.calc : s.msg.ask;
  const parts = [typeLabel];
  if (model) parts.push(model);
  if (config) parts.push(configSummary(config, locale));
  if (details) parts.push(...details);
  if (windows > 1) parts.push(s.msg.windows(windows));
  const lines = [`${s.msg.hello} ${head}`, parts.join(", ")];
  if (over) lines.push(s.msg.over);
  else if (price != null) {
    if (discount > 0) lines.push(`${s.msg.discount}: −${som(discount)}`);
    lines.push(`${s.msg.total}: ${som(price)}`);
  }
  if (url) lines.push(`${s.msg.link}: ${url}`);
  return lines.join("\n");
}
