import { CalendarClock, MessageCircle, Mic, Radio, Smartphone, ToggleRight, Workflow, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { CtaBand } from "@/components/solutions/cta-band";
import { ecoOrder } from "@/components/solutions/eco";
import { RemoteDemo } from "@/components/solutions/remote-demo";
import { MotorCompare } from "@/components/solutions/motor-compare";
import { SectionHead } from "@/components/section-head";
import { brands } from "@/content/brands";
import { products } from "@/content/catalog";
import type { Product } from "@/content/types";
import { href, type Locale } from "@/i18n";
import { solutionsDict } from "@/i18n/pages/solutions";
import { buildMeta } from "@/lib/seo";

export function meta(locale: Locale) {
  const d = solutionsDict[locale].control;
  return buildMeta({
    locale,
    path: "/upravlenie/",
    title: d.metaTitle,
    description: d.metaDesc,
  });
}

const icons: Record<string, LucideIcon> = {
  remote: Radio,
  app: Smartphone,
  alice: Mic,
  switch: ToggleRight,
  timer: CalendarClock,
  scenes: Workflow,
};

// Модели в матрице: комплекты, отдельные моторы, которых нет среди комплектов (Mini Zigbee), и лифт-система.
// Мотор того же названия, что и комплект, не повторяем: «Mini (N99) Wi-Fi» = комплект «Mini (N99)».
const base = (p: Product) => `${p.brand} ${p.name.replace(/\s*wi-?fi\s*/i, " ").trim()}`.toLowerCase();
function matrixModels(): Product[] {
  const kits = products.filter((p) => p.category === "kits" && p.ecosystems.length > 0);
  const kitNames = new Set(kits.map(base));
  const motors = products.filter((p) => p.category === "motors" && p.ecosystems.length > 0 && !kitNames.has(base(p)));
  // Мотор лифт-системы продаётся с ней — в матрице одна строка на систему.
  const lift = products.filter((p) => p.category === "lift" && !/motor/i.test(p.slug) && p.ecosystems.length > 0);
  const rank = (p: Product) => (p.category === "lift" ? 2 : p.brand === "novo" ? 0 : 1);
  return [...kits, ...motors, ...lift].sort((a, b) => rank(a) - rank(b));
}

function Matrix({ locale }: { locale: Locale }) {
  const d = solutionsDict[locale];
  const models = matrixModels();
  if (!models.length) return <p className="t-lead mt-6">{d.control.matrixEmpty}</p>;
  // Колонки — только экосистемы, которые есть хотя бы у одной модели: пустой столбец ничего не сообщает.
  const cols = ecoOrder.filter((e) => models.some((m) => m.ecosystems.includes(e)));
  return (
    // Таблица шире телефона: прокручивается только она, первая колонка закреплена.
    <>
      <p className="t-data mt-6 md:hidden">{d.control.matrixScroll}</p>
      {/* relative: иначе sr-only (absolute) внутри таблицы позиционируется от страницы и даёт горизонтальную прокрутку. */}
      <div className="relative -mx-4 mt-3 overflow-x-auto px-4 md:mx-0 md:mt-6 md:px-0" role="region" aria-labelledby="matrix" tabIndex={0}>
        <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
          <caption className="sr-only">{d.control.matrix}</caption>
          <thead>
            <tr className="border-b border-ink">
              <th scope="col" className="sticky left-0 z-10 bg-paper py-3 pr-4 font-normal text-ink-2">
                {d.control.model}
              </th>
              {cols.map((e) => (
                <th key={e} scope="col" className="px-3 py-3 text-center align-bottom font-normal whitespace-nowrap text-ink-2">
                  {d.eco[e]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.slug} className="border-b border-line">
                <th scope="row" className="sticky left-0 z-10 bg-paper py-3 pr-4 text-left font-normal">
                  <Link href={href(locale, `/katalog/${m.slug}/`)} className="inline-flex min-h-11 flex-col justify-center hover:underline">
                    <span className="t-data">{m.brand ? brands[m.brand].name : ""}</span>
                    <span className="font-semibold whitespace-nowrap">{m.name}</span>
                  </Link>
                </th>
                {cols.map((e) => {
                  const ok = m.ecosystems.includes(e);
                  return (
                    <td key={e} className="px-3 py-3 text-center">
                      {/* aria-label на простом span читалкам не виден — даём скрытый текст. Тире вместо точки: точку на телефоне не видно. */}
                      <span className="sr-only">{ok ? d.control.yes : d.control.no}</span>
                      <span aria-hidden className={ok ? "text-[18px] text-accent" : "text-ink-3"}>
                        {ok ? "✓" : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const d = solutionsDict[locale];
  const c = d.control;
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/upravlenie/", label: c.title }]} title={c.title} lead={c.lead} />

      <div className="mx-auto mt-8 max-w-[1440px] md:mt-12 md:px-8">
        <RemoteDemo
          image="living-wide"
          labels={{
            group: c.demoLabel,
            open: c.open,
            stop: c.stop,
            close: c.close,
          }}
          caption={c.demoCaption}
        />
      </div>

      <section aria-labelledby="ways" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:px-8">
        <div className="grid gap-6 border-t border-ink pt-5 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-4 lg:col-span-3">
            <h2 id="ways" className="t-h2">
              {c.ways}
            </h2>
            <p className="mt-3 max-w-[36ch] text-[15px] leading-snug text-ink-2">{c.waysLead}</p>
          </div>
          <ul className="grid gap-x-10 sm:grid-cols-2 md:col-span-8 lg:col-span-9">
            {d.waysList.map((w) => {
              const Icon = icons[w.id] ?? MessageCircle;
              return (
                <li key={w.id} className="border-b border-line py-6 first:pt-0 sm:[&:nth-child(2)]:pt-0">
                  <Icon className="size-6 text-accent" strokeWidth={1.4} aria-hidden />
                  <h3 className="t-h3 mt-3">{w.title}</h3>
                  <p className="mt-2 max-w-[48ch] text-[16px] leading-relaxed">{w.text}</p>
                  <p className="t-data mt-3">
                    {c.needs}: {w.needs}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section aria-labelledby="matrix" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:px-8">
        <h2 id="matrix" className="t-h2 max-w-[20ch]">
          {c.matrix}
        </h2>
        <p className="t-lead mt-3 max-w-[56ch]">{c.matrixLead}</p>
        <Matrix locale={locale} />
      </section>

      {/* ТЗ, раздел 15: сравнение Novo и Dooya — и здесь, и на странице раздвижных карнизов. */}
      <section aria-labelledby="compare" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:px-8">
        <SectionHead id="compare" title={solutionsDict[locale].solution.compare} lead={solutionsDict[locale].solution.compareLead} />
        <div className="mt-2">
          <MotorCompare locale={locale} />
        </div>
      </section>

      <section aria-label={c.included} className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:px-8">
        <div className="grid gap-px bg-line md:grid-cols-3">
          {[
            [c.included, c.includedText],
            [c.power, c.powerText],
            [c.smart, c.smartText],
          ].map(([h, p]) => (
            <div key={h} className="bg-paper py-6 md:px-8 md:py-2 md:first:pl-0">
              <h3 className="t-h3">{h}</h3>
              <p className="mt-2 max-w-[44ch] text-[16px] leading-relaxed text-ink-2">{p}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand locale={locale} title={c.ctaTitle} lead={c.ctaLead} wa={c.wa} track="control-cta" />
    </>
  );
}
