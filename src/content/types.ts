import type { L } from "@/i18n";

export type BrandId = "dooya" | "novo";

export type Ecosystem = "remote" | "tuya" | "mihome" | "zigbee" | "alice" | "switch" | "homekit" | "google";

export type CategoryId =
  | "kits" // электрокарниз-комплект по длине
  | "motors"
  | "remotes"
  | "parts" // комплектующие
  | "lift" // лифт-системы
  | "manual"; // обычные карнизы

export type Spec = {
  label: L;
  value: L | string;
  /** Откуда взято: URL паспорта/страницы производителя или «owner». Без источника характеристику не показываем. */
  source: string;
};

export type Product = {
  slug: string;
  category: CategoryId;
  kind: "kit" | "item"; // kit — цена по длине (калькулятор), item — штучный
  brand?: BrandId;
  name: string; // модель, латиницей: «DT82TV»
  title: L; // «Электрокарниз Dooya DT82TV»
  short: L; // одна строка для карточки
  description?: L;
  specs: Spec[];
  ecosystems: Ecosystem[];
  /** Для kit: база первого метра и цена метра; для item: цена за штуку/метр. null — цена уточняется (знак сома). */
  price: { base?: number | null; perMeter?: number | null; unit?: number | null; per?: L } ;
  images: string[]; // имена из public/media/manifest.json
  stock: "in" | "order";
  leadDays?: string;
  isDefault?: boolean;
  /** Данные найдены в интернете / демо — владелец подправит (27.10.2026). */
  demo: boolean;
  sources: string[];
};

export type SolutionId =
  | "pryamye"
  | "skrytyy-v-nishu"
  | "erker"
  | "dvuhryadnye"
  | "rulonnye"
  | "rimskie"
  | "zhalyuzi-i-plisse"
  | "lift-sistemy"
  | "ulichnye"
  | "obychnye-karnizy";

export type Solution = {
  slug: SolutionId;
  title: L;
  short: L;
  body: L[]; // абзацы
  fits: L[]; // где подходит
  image: string;
  priced: boolean; // есть формула цены (раздвижные электрокарнизы)
  products: string[]; // slug-и подходящих товаров
};

export type Project = {
  slug: string;
  title: L;
  room: L;
  district: L;
  length: number;
  product: string; // slug товара
  mount: "ceiling" | "wall" | "niche";
  opening: "center" | "side";
  control: "remote" | "app" | "alice" | "switch";
  days: number;
  images: string[];
  demo: true | false;
};
