import Link from "next/link";
import { brands } from "@/content/brands";
import { products } from "@/content/catalog";
import type { Product } from "@/content/types";
import { href, tr, type Locale } from "@/i18n";
import { solutionsDict } from "@/i18n/pages/solutions";
import { ecoOrder } from "./eco";
import { cornicePrice } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";

// Сравниваем то, что клиент покупает, — комплекты «под ключ»; отдельные моторы дублировали бы те же модели.
export function compareModels(): Product[] {
  const rank = (p: Product) => (p.isDefault ? 0 : p.brand === "novo" ? 1 : 2);
  return products.filter((p) => p.brand && p.category === "kits").sort((a, b) => rank(a) - rank(b));
}

type Row = { key: string; label: string; values: (string | null)[] };

// «Управление» из паспорта и «Связь» заменяет одна строка из экосистем — она есть у всех моделей.
const SKIP = new Set(["Управление", "Связь"]);

/**
 * Строки — только характеристики с источником, которые известны хотя бы у двух моделей:
 * строка с одним значением и рядом «уточним» ничего не сравнивает. Пустая клетка — «уточним», не выдумываем.
 */
function buildRows(models: Product[], locale: Locale): Row[] {
  const d = solutionsDict[locale];
  const labels = new Map<string, string>();
  for (const m of models) for (const s of m.specs) if (s.source && !SKIP.has(s.label.ru) && !labels.has(s.label.ru)) labels.set(s.label.ru, tr(s.label, locale));
  const rows: Row[] = [...labels]
    .map(([key, label]) => ({
      key,
      label,
      values: models.map((m) => {
        const s = m.specs.find((x) => x.label.ru === key && x.source);
        if (!s) return null;
        return typeof s.value === "string" ? s.value : tr(s.value, locale);
      }),
    }))
    .filter((r) => r.values.filter(Boolean).length >= 2);
  rows.push({
    key: "control",
    label: d.solution.compareControl,
    values: models.map((m) => {
      // В перечислении «пульт» и «выключатель» — нарицательные, со строчной; названия приложений и Алиса — как есть.
      const e = ecoOrder
        .filter((x) => m.ecosystems.includes(x))
        .map((x, i) => (i > 0 && (x === "remote" || x === "switch") ? d.eco[x].charAt(0).toLowerCase() + d.eco[x].slice(1) : d.eco[x]));
      return e.length ? e.join(", ") : null;
    }),
  });
  // Цена комплекта — по формуле владельца (от 1 м), одинаковая у всех моделей; без неё таблица не отвечает на главный вопрос.
  rows.push({
    key: "price",
    label: d.solution.comparePrice,
    values: models.map((m) => {
      if (m.kind !== "kit") return null;
      const n = formatNumber(cornicePrice({ length: 1, rows: 1, base: m.price.base, perMeter: m.price.perMeter }));
      return locale === "ky" ? `${n} сомдон` : `от ${n} сом`;
    }),
  });
  return rows;
}

export function MotorCompare({ locale }: { locale: Locale }) {
  const d = solutionsDict[locale].solution;
  const models = compareModels();
  if (models.length < 2) return null;
  const rows = buildRows(models, locale);
  const empty = <span className="text-ink-3">{d.compareEmpty}</span>;
  return (
    <>
      <p className="t-data mt-6 md:hidden">{d.compareScroll}</p>
      {/* Одна таблица на всех ширинах: на телефоне листается только она, колонка с подписями закреплена. */}
      {/* relative: иначе sr-only (absolute) внутри таблицы позиционируется от страницы и даёт горизонтальную прокрутку. */}
      <div className="relative -mx-4 mt-3 overflow-x-auto px-4 md:mx-0 md:mt-2 md:px-0" role="region" aria-labelledby="compare" tabIndex={0}>
        {/* table-fixed: колонки моделей равной ширины, длинное значение переносится, а не раздвигает соседей. */}
        <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-[15px]">
          <caption className="sr-only">{d.compare}</caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-[132px] bg-paper py-4 pr-4 align-bottom font-normal md:w-[20%]">
                <span className="sr-only">{solutionsDict[locale].control.model}</span>
              </th>
              {models.map((m) => (
                <th key={m.slug} scope="col" className="py-4 pr-5 align-bottom font-normal">
                  <Link href={href(locale, `/katalog/${m.slug}/`)} className="inline-flex min-h-11 flex-col justify-end hover:underline">
                    <span className="t-data block">{m.brand ? brands[m.brand].name : ""}</span>
                    <span className="text-[18px] font-semibold tracking-[-0.02em] whitespace-nowrap">{m.name}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line">
                <th scope="row" className="sticky left-0 z-10 bg-paper py-3 pr-4 align-top font-normal text-ink-2">
                  {r.label}
                </th>
                {r.values.map((v, i) => (
                  <td key={models[i].slug} className="tnum py-3 pr-5 align-top break-words">
                    {v ?? empty}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="t-data mt-4">{d.compareSource}</p>
    </>
  );
}
