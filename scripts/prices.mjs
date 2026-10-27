// Прайс из Google-таблицы (ТЗ, раздел 21). Запускается перед сборкой (prebuild).
// PRICES_CSV_URL — опубликованная таблица в формате price-list-template.csv.
// Удалось скачать и проверить → пишем data/prices.snapshot.json. Не удалось → оставляем прошлый снимок и предупреждаем.
// Колонку «примечание» в снимок не берём: она для владельца, не для сайта. Себестоимости в таблице быть не должно.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { z } from "zod";

const OUT = new URL("../data/prices.snapshot.json", import.meta.url);
const url = process.env.PRICES_CSV_URL;

// id из шаблона прайса → slug в каталоге (у шаблона свои короткие id).
const ALIASES = {
  "kit-novo-n21-wifi": "novo-n21-wifi",
  "kit-novo-mini": "novo-mini",
  "kit-dooya-dt82tv": "dooya-dt82tv",
  "kit-dooya-dt82e": "dooya-dt82te",
  "lift-system": "lift-sistema",
  "motor-dooya-dt82e": "motor-dooya-dt82te",
  "motor-tube-45": "lift-motor-45",
  "manual-cornice": "karniz-ruchnoy",
  profile: "profil",
  belt: "remen",
  runner: "begunki",
  carriage: "karetki",
  mount: "kronshteyny",
  stopper: "stopory",
  connector: "soedinitel",
  bend: "povoroty-erker",
};

/** CSV с разделителем «;» или «,», кавычками и BOM — как выгружает Google Таблицы. */
export function parseCsv(text) {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    rows.push(row);
    row = [];
    cell = "";
  };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      endRow();
    } else cell += ch;
  }
  if (cell || row.length) endRow();
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  const keys = (head ?? []).map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

// Пустая клетка — «цены нет» (на сайте знак сома), не ноль.
const money = z
  .string()
  .transform((v) => v.replace(/[\s  ]/g, "").replace(",", "."))
  .refine((v) => v === "" || /^\d+(\.\d+)?$/.test(v), "не число")
  .transform((v) => (v === "" ? null : Number(v)));

const Row = z.object({
  id: z.string().min(1),
  цена_сом: money,
  доплата_за_метр_сом: money.optional().default(""),
  наличие: z.string().optional().default(""),
  срок_под_заказ_дней: z.string().optional().default(""),
  показывать_на_сайте: z.string().optional().default(""),
});

export function toSnapshot(rows) {
  const items = {};
  const errors = [];
  rows.forEach((raw, n) => {
    const r = Row.safeParse(raw);
    if (!r.success) {
      errors.push(`строка ${n + 2} (${raw.id || "без id"}): ${r.error.issues.map((i) => `${i.path.join(".")} — ${i.message}`).join("; ")}`);
      return;
    }
    const d = r.data;
    const slug = ALIASES[d.id] ?? d.id;
    const stock = /налич/i.test(d.наличие) ? "in" : /заказ/i.test(d.наличие) ? "order" : undefined;
    items[slug] = {
      price: d.цена_сом,
      perMeter: d.доплата_за_метр_сом,
      ...(stock ? { stock } : {}),
      ...(d.срок_под_заказ_дней ? { leadDays: d.срок_под_заказ_дней.replace("-", "–") } : {}),
    };
  });
  return { items, errors };
}

async function main() {
  if (!existsSync(new URL("../data/", import.meta.url))) mkdirSync(new URL("../data/", import.meta.url));
  const hasSnapshot = existsSync(OUT);
  if (!url) {
    if (!hasSnapshot) writeFileSync(OUT, JSON.stringify({ source: null, updatedAt: null, items: {} }, null, 2) + "\n");
    console.log("prices: PRICES_CSV_URL не задан — цены из каталога и прошлого снимка");
    return;
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { items, errors } = toSnapshot(parseCsv(await res.text()));
    if (errors.length) throw new Error(`ошибки в таблице:\n  ${errors.join("\n  ")}`);
    if (!Object.keys(items).length) throw new Error("таблица пустая");
    writeFileSync(OUT, JSON.stringify({ source: "PRICES_CSV_URL", updatedAt: new Date().toISOString(), items }, null, 2) + "\n");
    console.log(`prices: ${Object.keys(items).length} позиций, снимок обновлён`);
  } catch (err) {
    // Пустого каталога быть не может: остаёмся на прошлом снимке.
    const prev = hasSnapshot ? JSON.parse(readFileSync(OUT, "utf8")).updatedAt : null;
    console.warn(`prices: ВНИМАНИЕ — прайс не загружен (${err.message}). Используем прошлый снимок${prev ? ` от ${prev}` : " (пустой)"}.`);
    if (!hasSnapshot) writeFileSync(OUT, JSON.stringify({ source: null, updatedAt: null, items: {} }, null, 2) + "\n");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
