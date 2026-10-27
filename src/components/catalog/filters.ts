// Фильтры каталога: разбор и сборка query-строки, применение к списку товаров.
// Живут в URL — после «назад» со страницы товара выбор на месте, ссылкой можно поделиться.
import type { BrandId, CategoryId, Ecosystem, Product } from "@/content/types";

export type Filters = {
  cat: CategoryId | null;
  brand: BrandId[];
  stock: boolean;
  eco: Ecosystem[];
};

export const EMPTY: Filters = { cat: null, brand: [], stock: false, eco: [] };

export const CATEGORY_ORDER: CategoryId[] = ["kits", "motors", "remotes", "parts", "lift", "manual"];
const BRAND_ORDER: BrandId[] = ["novo", "dooya"];
const ECO_ORDER: Ecosystem[] = ["remote", "tuya", "alice", "mihome", "zigbee", "homekit", "google", "switch"];

/** Только значения, по которым реально есть товары (ТЗ, раздел 15). */
export function available(products: Product[]) {
  const has = <T,>(order: T[], pick: (p: Product) => T[]) => order.filter((v) => products.some((p) => pick(p).includes(v)));
  return {
    cats: has(CATEGORY_ORDER, (p) => [p.category]),
    brands: has(BRAND_ORDER, (p) => (p.brand ? [p.brand] : [])),
    ecos: has(ECO_ORDER, (p) => p.ecosystems),
    stockToggle: products.some((p) => p.stock === "in") && products.some((p) => p.stock !== "in"),
  };
}

export function parse(sp: URLSearchParams, products: Product[]): Filters {
  const av = available(products);
  const list = <T extends string>(key: string, allowed: T[]) =>
    (sp.get(key) ?? "")
      .split(",")
      .filter((v): v is T => (allowed as string[]).includes(v));
  const cat = sp.get("cat");
  return {
    cat: cat && (av.cats as string[]).includes(cat) ? (cat as CategoryId) : null,
    brand: list("brand", av.brands),
    stock: sp.get("stock") === "in",
    eco: list("eco", av.ecos),
  };
}

export function toQuery(f: Filters) {
  const sp = new URLSearchParams();
  if (f.cat) sp.set("cat", f.cat);
  if (f.brand.length) sp.set("brand", f.brand.join(","));
  if (f.stock) sp.set("stock", "in");
  if (f.eco.length) sp.set("eco", f.eco.join(","));
  // Запятые оставляем читаемыми: ?brand=novo,dooya
  return sp.toString().replace(/%2C/g, ",");
}

/** Фильтры кроме категории — их показываем чипами и считаем на кнопке «Фильтры». */
export function extraCount(f: Filters) {
  return f.brand.length + f.eco.length + (f.stock ? 1 : 0);
}

export function apply(products: Product[], f: Filters) {
  return products.filter(
    (p) =>
      (!f.cat || p.category === f.cat) &&
      (!f.brand.length || (p.brand && f.brand.includes(p.brand))) &&
      (!f.stock || p.stock === "in") &&
      // Управление: товар подходит, если умеет хотя бы одно из выбранного.
      (!f.eco.length || f.eco.some((e) => p.ecosystems.includes(e))),
  );
}

export function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}
