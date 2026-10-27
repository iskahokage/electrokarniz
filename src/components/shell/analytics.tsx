"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { UTM_FIELDS, UTM_KEY, type Utm } from "@/lib/track";

// Счётчики грузятся только в production и только с ID из env: staging и локальная разработка не портят статистику.
const isProd = process.env.NEXT_PUBLIC_SITE_ENV === "production";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID || 0);
const enabled = isProd && Boolean(GA_ID || PIXEL_ID || YM_ID);

type Fn = ((...args: unknown[]) => void) & { q?: unknown[]; l?: number; queue?: unknown[]; callMethod?: (...a: unknown[]) => void; loaded?: boolean; version?: string; push?: unknown };
type W = Window & { dataLayer?: unknown[]; gtag?: Fn; fbq?: Fn; _fbq?: Fn; ym?: Fn; __ekTrack?: (e: string, p?: Record<string, unknown>) => void };

// Событие сайта → стандартные события GA4 и Meta (их понимают рекламные кабинеты для оптимизации).
const GA_MAP: Record<string, string> = { order_submit: "generate_lead" };
const META_MAP: Record<string, string> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  order_submit: "Lead",
  whatsapp_click: "Contact",
  call_click: "Contact",
};
const MONEY = new Set(["view_item", "add_to_cart", "begin_checkout", "order_submit"]);

function addScript(src: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Заглушки-очереди: события до загрузки скриптов не теряются, а копятся и уходят после. */
function installStubs(w: W) {
  if (GA_ID && !w.gtag) {
    w.dataLayer = w.dataLayer || [];
    // gtag ждёт именно объект arguments, а не массив.
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    } as Fn;
    w.gtag("js", new Date());
    w.gtag("config", GA_ID);
  }
  if (PIXEL_ID && !w.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue!.push(args);
    } as Fn;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    w.fbq = fbq;
    w._fbq = fbq;
    fbq("init", PIXEL_ID);
    fbq("track", "PageView");
  }
  if (YM_ID && !w.ym) {
    const ym = function (...args: unknown[]) {
      (ym.q = ym.q || []).push(args);
    } as Fn;
    ym.l = Date.now();
    w.ym = ym;
    ym(YM_ID, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
}

function loadScripts() {
  if (GA_ID) addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`);
  if (PIXEL_ID) addScript("https://connect.facebook.net/en_US/fbevents.js");
  if (YM_ID) addScript("https://mc.yandex.ru/metrika/tag.js");
}

function send(w: W, event: string, raw: Record<string, unknown> = {}) {
  const params: Record<string, unknown> = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== ""));
  if (MONEY.has(event) && typeof params.value === "number") params.currency = "KGS";
  if (!enabled) {
    // Разработка: видно, что событие вызывается, но наружу ничего не уходит.
    if (process.env.NODE_ENV === "development") console.debug("[track]", event, params);
    return;
  }
  w.gtag?.("event", GA_MAP[event] ?? event, params);
  if (w.fbq) {
    const meta = META_MAP[event];
    if (meta) w.fbq("track", meta, params);
    else w.fbq("trackCustom", event, params);
  }
  if (YM_ID) w.ym?.(YM_ID, "reachGoal", event, params);
}

/** UTM-метки первой страницы визита: заказ (src/lib/order.ts) прикладывает их к заявке. */
function storeUtm() {
  try {
    if (window.sessionStorage.getItem(UTM_KEY)) return;
    const q = new URLSearchParams(window.location.search);
    const utm: Utm = {};
    for (const k of UTM_FIELDS) {
      const v = q.get(k);
      if (v) utm[k] = v.slice(0, 200);
    }
    utm.landing = window.location.pathname;
    if (document.referrer && !document.referrer.startsWith(window.location.origin)) utm.referrer = document.referrer.slice(0, 300);
    window.sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
  } catch {
    // Приватный режим / запрет хранилища — просто без меток.
  }
}

export function Analytics() {
  const pathname = usePathname();
  // Предыдущий адрес — referer для Метрики при переходе внутри сайта; null до первого рендера.
  const prev = useRef<string | null>(null);

  useEffect(() => {
    const w = window as W;
    storeUtm();
    // Клик по WhatsApp/телефону, который ещё не отправлен: ждём, не вызовет ли кнопка свой track() в этом же клике.
    let pending: { event: string; params: Record<string, unknown>; timer: number } | null = null;
    w.__ekTrack = (e, p) => {
      // Кнопка с собственным track() (калькулятор, контакты…) — одно событие, а не два: склеиваем параметры.
      if (pending && pending.event === e) {
        window.clearTimeout(pending.timer);
        const merged = { ...pending.params, ...p };
        pending = null;
        send(w, e, merged);
        return;
      }
      send(w, e, p);
    };

    // Клики по WhatsApp и телефону ловим одним слушателем на всём сайте: кнопок много, и в каждую track() не вставишь.
    // Захват (capture) срабатывает раньше onClick кнопки; отправка — следующей задачей, чтобы успеть склеить с ним.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="https://wa.me/"], a[href^="tel:"]');
      if (!a) return;
      const isWa = a.href.startsWith("https://wa.me/");
      const event = isWa ? "whatsapp_click" : "call_click";
      const params = { method: isWa ? "whatsapp" : "phone", page: window.location.pathname, label: a.dataset.track };
      if (pending) send(w, pending.event, pending.params);
      const timer = window.setTimeout(() => {
        if (pending?.timer === timer) {
          send(w, event, params);
          pending = null;
        }
      }, 0);
      pending = { event, params, timer };
    };
    document.addEventListener("click", onClick, true);
    if (!enabled) return () => document.removeEventListener("click", onClick, true);
    installStubs(w);

    // Скрипты счётчиков — после первого взаимодействия, простоя после load или 4 с: не мешают LCP и INP.
    let done = false;
    let idle = 0;
    const go = () => {
      if (done) return;
      done = true;
      stopWaiting();
      loadScripts();
    };
    const onLoad = () => {
      idle = "requestIdleCallback" in w ? w.requestIdleCallback(go, { timeout: 4000 }) : 0;
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    const timer = window.setTimeout(go, 4000);
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((ev) => window.addEventListener(ev, go, { once: true, passive: true }));
    function stopWaiting() {
      if (idle && "cancelIdleCallback" in w) w.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      window.removeEventListener("load", onLoad);
      events.forEach((ev) => window.removeEventListener(ev, go));
    }
    return () => {
      stopWaiting();
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  // Переходы внутри сайта (клиентская навигация): GA4 ловит их сам по History API, Pixel и Метрике — сообщаем.
  useEffect(() => {
    const from = prev.current;
    prev.current = window.location.href;
    if (from === null || !enabled) return;
    const w = window as W;
    w.fbq?.("track", "PageView");
    if (YM_ID) w.ym?.(YM_ID, "hit", window.location.href, { referer: from });
  }, [pathname]);

  return null;
}
