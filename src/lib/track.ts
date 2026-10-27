// Единая точка аналитики: одно событие раздаётся в GA4, Meta Pixel и Яндекс Метрику (если подключены в env).
// Отправку делает src/components/shell/analytics.tsx (window.__ekTrack); разделы только вызывают track().
//
// Параметры (все необязательные, единые для всех событий — так их одинаково поймут GA, Meta и Метрика):
//   value — сумма в сомах (число), item_id — slug товара, item_name — название, quantity — штук,
//   length — длина карниза в метрах, method — "whatsapp" | "phone" | "form" и т. п.
// Валюту (KGS) подставляет analytics.tsx сам.
export type TrackEvent =
  | "view_item"
  | "add_to_cart"
  | "begin_checkout"
  | "order_submit"
  | "order_error"
  | "calculator_start"
  | "calculator_complete"
  | "whatsapp_click"
  | "call_click";

export type TrackParams = Record<string, string | number | undefined>;

export function track(event: TrackEvent, params: TrackParams = {}) {
  if (typeof window === "undefined") return;
  (window as unknown as { __ekTrack?: (e: string, p: object) => void }).__ekTrack?.(event, params);
}

/** Ключ sessionStorage, где лежат UTM-метки первой страницы визита (JSON). */
export const UTM_KEY = "ek-utm";
export const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "yclid"] as const;
export type Utm = Partial<Record<(typeof UTM_FIELDS)[number] | "landing" | "referrer", string>>;

/** UTM-метки визита для заказа; в приватном режиме sessionStorage может бросать — тогда пусто. */
export function readUtm(): Utm {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(UTM_KEY) || "{}") as Utm;
  } catch {
    return {};
  }
}
