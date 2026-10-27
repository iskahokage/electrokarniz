// Состояние калькулятора и его разбор из адреса / localStorage. Отдельно от компонента — чтобы покрыть тестами.
import { products } from "@/content/catalog";
import type { Product, SolutionId } from "@/content/types";
import { calcTypes, openings, mounts, shapes, fabrics, controls, regions, type CalcType } from "@/i18n/pages/order";

// Индексы вариантов (так удобнее сегментам) + длина, окна и выбранный мотор.
export type CalcState = { type: CalcType; l: number; o: number; mt: number; sh: number; r: number; f: number; c: number; rg: number; w: number; m: string | null };

export const DEFAULTS: CalcState = { type: "sliding", l: 3, o: 0, mt: 0, sh: 0, r: 0, f: 1, c: 0, rg: 0, w: 1, m: null };
export const MAX_INPUT = 50; // больше — уже явно опечатка
export const MAX_WINDOWS = 20;

// Ссылки со страниц решений приходят со slug решения — переводим в параметры расчёта.
const FROM_SOLUTION: Partial<Record<SolutionId, Partial<CalcState>>> = {
  pryamye: { type: "sliding", sh: 0 },
  "skrytyy-v-nishu": { type: "sliding", mt: 2 },
  erker: { type: "sliding", sh: 1 },
  dvuhryadnye: { type: "sliding", r: 1 },
  rulonnye: { type: "roller" },
  rimskie: { type: "roman" },
  "zhalyuzi-i-plisse": { type: "plisse" },
  "lift-sistemy": { type: "lift" },
  ulichnye: { type: "outdoor" },
};

const pick = <T extends string>(list: readonly T[], v: string | null | undefined) => {
  const i = v ? list.indexOf(v as T) : -1;
  return i >= 0 ? i : undefined;
};
const roundLen = (n: number) => Math.round(Math.min(n, MAX_INPUT) * 10) / 10;

/** Комплекты по длине: сначала мотор по умолчанию, потом Novo (решение владельца). */
export const kits: Product[] = products
  .filter((p) => p.kind === "kit")
  .sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault) || (a.brand === "novo" ? -1 : 0) - (b.brand === "novo" ? -1 : 0));

/**
 * Разбор адреса. Параметр m используют двумя способами: объекты передают монтаж (m=ceiling|wall|niche),
 * корзина и товары — slug модели. Значения не пересекаются, поэтому различаем по самому значению.
 * Монтаж можно передать и явно: mt=…
 */
export function fromQuery(q: URLSearchParams): Partial<CalcState> | null {
  const out: Partial<CalcState> = {};
  const set = <K extends keyof CalcState>(k: K, v: CalcState[K] | undefined) => {
    if (v !== undefined) out[k] = v;
  };
  const type = q.get("type");
  if (type) {
    if ((calcTypes as readonly string[]).includes(type)) out.type = type as CalcType;
    else Object.assign(out, FROM_SOLUTION[type as SolutionId] ?? {});
  }
  const l = Number((q.get("l") || "").replace(",", "."));
  if (Number.isFinite(l) && l > 0) out.l = roundLen(l);
  set("o", pick(openings, q.get("o")));
  set("sh", pick(shapes, q.get("sh")));
  set("r", q.get("r") === "2" ? 1 : q.get("r") === "1" ? 0 : undefined);
  set("f", pick(fabrics, q.get("f")));
  set("c", pick(controls, q.get("c")));
  set("rg", pick(regions, q.get("rg")));
  const w = Number(q.get("w"));
  if (Number.isInteger(w) && w >= 1 && w <= MAX_WINDOWS) out.w = w;

  const m = q.get("m");
  const model = q.get("model") ?? (m && pick(mounts, m) === undefined ? m : null);
  set("mt", pick(mounts, q.get("mt")) ?? pick(mounts, m));
  // Пришли со страницы товара — мотор уже выбран.
  const p = model ? products.find((x) => x.slug === model) : undefined;
  if (p) {
    if (p.kind === "kit") {
      out.m = p.slug;
      out.type = "sliding";
    } else if (p.category === "lift") out.type = "lift";
  }
  // Параметры раздвижного карниза без типа — значит, речь о нём.
  if (!out.type && (out.o !== undefined || out.mt !== undefined || out.r !== undefined)) out.type = "sliding";
  return Object.keys(out).length ? out : null;
}

export function toQuery(s: CalcState) {
  const q = new URLSearchParams();
  q.set("type", s.type);
  q.set("l", s.l.toFixed(1));
  if (s.type === "sliding") {
    q.set("o", openings[s.o]);
    q.set("mt", mounts[s.mt]);
    q.set("sh", shapes[s.sh]);
    q.set("r", String(s.r + 1));
    q.set("f", fabrics[s.f]);
    if (s.m) q.set("m", s.m);
  }
  q.set("c", controls[s.c]);
  q.set("rg", regions[s.rg]);
  if (s.w > 1) q.set("w", String(s.w));
  return q.toString();
}

/** Сохранённое состояние проверяем поле за полем: старая версия или ручная правка не должны ломать страницу. */
export function sanitize(v: unknown): Partial<CalcState> | null {
  if (!v || typeof v !== "object") return null;
  const x = v as Record<string, unknown>;
  const out: Partial<CalcState> = {};
  const idx = (k: "o" | "mt" | "sh" | "r" | "f" | "c" | "rg", len: number) => {
    const n = x[k];
    if (typeof n === "number" && Number.isInteger(n) && n >= 0 && n < len) out[k] = n;
  };
  if (typeof x.type === "string" && (calcTypes as readonly string[]).includes(x.type)) out.type = x.type as CalcType;
  if (typeof x.l === "number" && Number.isFinite(x.l) && x.l > 0) out.l = roundLen(x.l);
  idx("o", openings.length);
  idx("mt", mounts.length);
  idx("sh", shapes.length);
  idx("r", 2);
  idx("f", fabrics.length);
  idx("c", controls.length);
  idx("rg", regions.length);
  if (typeof x.w === "number" && Number.isInteger(x.w) && x.w >= 1 && x.w <= MAX_WINDOWS) out.w = x.w;
  if (typeof x.m === "string" && kits.some((p) => p.slug === x.m)) out.m = x.m;
  return Object.keys(out).length ? out : null;
}

export function parseStored(raw: string | null): Partial<CalcState> | null {
  try {
    return sanitize(JSON.parse(raw || "null"));
  } catch {
    return null;
  }
}
