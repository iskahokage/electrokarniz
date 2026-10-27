import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/page-head";
import { Picture } from "@/components/picture";
import { Price } from "@/components/price";
import { ProductCard } from "@/components/product-card";
import { SectionHead } from "@/components/section-head";
import { ProjectFigure } from "@/components/info/project-figure";
import { CtaBand } from "@/components/solutions/cta-band";
import { Faq } from "@/components/solutions/faq";
import { MiniCalc } from "@/components/solutions/mini-calc";
import { MotorCompare, compareModels } from "@/components/solutions/motor-compare";
import { productBySlug } from "@/content/catalog";
import { projects } from "@/content/projects";
import { catalogHasBends, solutionBySlug, solutions, type SolutionFull } from "@/content/solutions";
import type { Product, Project } from "@/content/types";
import { href, tr, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { solutionsDict } from "@/i18n/pages/solutions";
import { ldJson, serviceLd } from "@/lib/jsonld";
import { buildMeta } from "@/lib/seo";
import { cn } from "@/lib/cn";
import { waLink } from "@/lib/whatsapp";

export function staticParams() {
  return solutions.map((s) => ({ slug: s.slug }));
}

export function meta(locale: Locale, params: { slug?: string }) {
  const s = solutionBySlug(params.slug ?? "");
  if (!s)
    return buildMeta({
      locale,
      path: "/resheniya/",
      title: solutionsDict[locale].index.metaTitle,
      description: solutionsDict[locale].index.metaDesc,
    });
  return buildMeta({
    locale,
    path: `/resheniya/${s.slug}/`,
    title: tr(s.metaTitle, locale),
    description: metaDesc(tr(s.short, locale), s.priced ? solutionsDict[locale].solution.priceNote : solutionsDict[locale].solution.measure),
  });
}

// Длиннее ~160 знаков поисковик обрежет посередине фразы — тогда без второй части.
// Иначе берём первое предложение примечания: «Монтаж, подключение к Алисе и настройка входят».
function metaDesc(short: string, note: string) {
  const full = `${short} ${note}`;
  if (full.length <= 160) return full;
  const first = `${short} ${note.split(/(?<=\.)\s/)[0]}`;
  return first.length <= 160 ? first : short;
}

// Объекты этого типа: в данных объекта нет «типа решения», поэтому берём то, что надёжно следует из полей.
function projectsFor(s: SolutionFull): Project[] {
  const text = (p: Project) => `${p.title.ru} ${p.room.ru}`;
  switch (s.slug) {
    case "pryamye":
      return projects.filter((p) => p.mount !== "niche");
    case "skrytyy-v-nishu":
      return projects.filter((p) => p.mount === "niche");
    case "erker":
      return projects.filter((p) => /эркер|углов/i.test(text(p)));
    case "dvuhryadnye":
      return projects.filter((p) => /двухряд|два ряда/i.test(text(p)));
    default:
      return [];
  }
}

// Сетка из пяти: телефон 2 кол. (первая на всю ширину), планшет 6 кол. (две по 3 + три по 2), xl — 5 в ряд.
const kitSpan = (i: number) => (i === 0 ? "col-span-2 md:col-span-3 xl:col-span-1" : i === 1 ? "md:col-span-3 xl:col-span-1" : "md:col-span-2 xl:col-span-1");

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export default function View({ locale, params }: { locale: Locale; params: { slug?: string } }) {
  const s = solutionBySlug(params.slug ?? "");
  if (!s) notFound();
  const d = solutionsDict[locale];
  const tt = t(locale);
  const title = tr(s.title, locale);
  const noun = tr(s.noun, locale);
  const items = s.products.map(productBySlug).filter((p): p is Product => Boolean(p));
  // Комплекты и системы — карточками; детали шины — коротким списком ниже, чтобы не тянуть страницу.
  const main = items.filter((p) => p.category !== "parts");
  const parts = items.filter((p) => p.category === "parts");
  const five = main.length === 5;
  const objs = projectsFor(s).slice(0, 3);
  const showCompare = s.priced && compareModels().length >= 2;
  const others = solutions.filter((x) => x.slug !== s.slug && x.group === s.group);

  return (
    <article>
      <PageHead
        locale={locale}
        crumbs={[
          { path: "/resheniya/", label: d.solution.crumb },
          { path: `/resheniya/${s.slug}/`, label: title },
        ]}
        title={title}
        lead={tr(s.short, locale)}
      />

      <div className="mx-auto mt-8 max-w-[1440px] md:mt-12 md:grid md:grid-cols-12 md:gap-x-10 md:px-8">
        {/* Фото в родных пропорциях — без кадрирования под сетку, как в журнале. */}
        {/* На телефоне кадрируем 3:2 — иначе вертикальное фото уводит цену на второй экран. */}
        <figure className="md:col-span-7 md:row-start-1">
          <Picture name={s.image} alt={title} sizes="(min-width: 768px) 58vw, 100vw" priority demo className="aspect-[3/2] bg-paper-2 md:aspect-auto" />
        </figure>

        {/* Цена и действие: на десктопе закреплены рядом с текстом, на телефоне — сразу под фото. */}
        <aside aria-label={d.solution.priceTitle} className="px-4 pt-8 md:col-span-5 md:col-start-8 md:row-span-3 md:row-start-1 md:px-0 md:pt-0 lg:col-span-4 lg:col-start-9">
          <div className="md:sticky md:top-24">
            <h2 className="t-data">{d.solution.priceTitle}</h2>
            {s.priced ? (
              <div className="mt-3">
                <MiniCalc locale={locale} type={s.slug} noun={noun} rows={s.slug === "dvuhryadnye" ? 2 : 1} />
              </div>
            ) : (
              <div className="mt-3">
                {/* Знак сома и подпись одной строкой: одинокий знак крупным кеглем читался как ошибка вёрстки. */}
                <p className="flex items-baseline gap-3 text-[28px] leading-tight font-semibold tracking-[-0.02em]">
                  <Price value={null} locale={locale} className="shrink-0" />
                  <span aria-hidden>{d.solution.byCalcTitle}</span>
                </p>
                <p className="mt-2 text-[15px] leading-snug text-ink-2">{d.solution.byCalcNote}</p>
                <a href={waLink(d.solution.waCalc(noun))} data-track={`solution-${s.slug}`} className="btn btn-accent mt-5 w-full">
                  {d.solution.byCalcCta}
                </a>
                {/* Без формулы цены расчёт на сайте всё равно собирает размеры в заявку — для тех, кто не пишет в WhatsApp. */}
                {s.slug !== "obychnye-karnizy" && (
                  <Link href={`${href(locale, "/raschet/")}?type=${s.slug}`} className="btn btn-line mt-2 w-full">
                    {d.solution.calcSite}
                  </Link>
                )}
              </div>
            )}
            <p className="mt-4 text-[14px] leading-snug text-ink-2">{d.solution.measure}</p>
          </div>
        </aside>

        <section aria-labelledby="how" className="px-4 pt-14 md:col-span-7 md:row-start-2 md:px-0 md:pt-16">
          <h2 id="how" className="t-h3">
            {d.solution.how}
          </h2>
          <div className="mt-4 max-w-[62ch] space-y-4 text-[17px] leading-relaxed">
            {s.body.map((p) => (
              <p key={p.ru}>{tr(p, locale)}</p>
            ))}
            {s.slug === "erker" && catalogHasBends() && <p>{d.solution.bends}</p>}
          </div>
        </section>

        <section aria-labelledby="fits" className="px-4 pt-12 md:col-span-7 md:row-start-3 md:px-0">
          <h2 id="fits" className="t-h3">
            {d.solution.fits}
          </h2>
          <ul className="mt-4 border-b border-line">
            {s.fits.map((f) => (
              <li key={f.ru} className="border-t border-line py-3 text-[17px]">
                {tr(f, locale)}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {showCompare && (
        <section aria-labelledby="compare" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:px-8">
          <SectionHead id="compare" title={d.solution.compare} lead={d.solution.compareLead} />
          <div className="mt-2">
            <MotorCompare locale={locale} />
          </div>
        </section>
      )}

      <section aria-labelledby="products" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:px-8">
        <SectionHead
          id="products"
          title={d.solution.products}
          link={{
            href: href(locale, "/katalog/"),
            label: d.solution.allCatalog,
          }}
        />
        {/* Пять комплектов без одинокой карточки: на телефоне первая (модель по умолчанию) во всю ширину — 1+2+2,
            на планшете 2+3, на широком экране — один ряд. */}
        {main.length ? (
          <div className={`mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-6 ${five ? "md:grid-cols-6 xl:grid-cols-5" : "md:grid-cols-4"}`}>
            {main.slice(0, 8).map((p, i) => (
              <div key={p.slug} className={cn("flex", five && kitSpan(i))}>
                <ProductCard product={p} locale={locale} sizes={five && i < 2 ? "(min-width: 1280px) 20vw, (min-width: 768px) 50vw, 100vw" : undefined} />
              </div>
            ))}
          </div>
        ) : (
          <p className="t-lead mt-6 max-w-[52ch]">{d.solution.productsEmpty}</p>
        )}
        {parts.length > 0 && (
          <div className="mt-14 md:mt-20 md:grid md:grid-cols-12 md:gap-10">
            <div className="md:col-span-4 lg:col-span-3">
              <h3 className="t-h3">{d.solution.parts}</h3>
              <p className="mt-2 max-w-[36ch] text-[15px] leading-snug text-ink-2">{d.solution.partsLead}</p>
            </div>
            <ul className="mt-5 grid gap-x-10 border-b border-line sm:grid-cols-2 md:col-span-8 md:mt-0 lg:col-span-9">
              {parts.map((p) => (
                <li key={p.slug} className="border-t border-line">
                  <Link href={href(locale, `/katalog/${p.slug}/`)} className="group flex min-h-14 items-baseline justify-between gap-4 py-3">
                    <span>
                      <span className="block text-[17px] leading-snug underline-offset-[5px] group-hover:underline">{tr(p.title, locale)}</span>
                      <span className="mt-1 block text-[14px] leading-snug text-ink-2">{tr(p.short, locale)}</span>
                    </span>
                    <Price value={p.price.unit ?? null} locale={locale} className="shrink-0 text-[17px]" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {objs.length > 0 && (
        <section aria-labelledby="objects" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:px-8">
          <SectionHead
            id="objects"
            title={d.solution.objects}
            link={{
              href: href(locale, "/obekty/"),
              label: d.solution.allObjects,
            }}
          />
          <div className="mt-8 grid grid-cols-2 items-start gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-6">
            {/* На телефоне два объекта рядом: высокие фото друг под другом — лишние экраны прокрутки. */}
            {objs.map((p, i) => (
              <ProjectFigure key={p.slug} project={p} locale={locale} sizes="(min-width: 768px) 33vw, 50vw" className={i > 1 ? "hidden md:block" : undefined} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="faq" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:grid md:grid-cols-12 md:gap-10 md:px-8">
        <h2 id="faq" className="t-h2 md:col-span-4">
          {d.solution.faq}
        </h2>
        <div className="mt-6 md:col-span-8 md:mt-0">
          <Faq locale={locale} ids={s.faq} />
        </div>
      </section>

      {others.length > 0 && (
        <nav aria-labelledby="others" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-28 md:px-8">
          <h2 id="others" className="t-h3">
            {d.solution.other}
          </h2>
          <ul className="mt-4 grid gap-x-10 border-b border-line md:grid-cols-3 md:border-b-0">
            {others.map((o) => (
              <li key={o.slug} className="border-t border-line md:border-b">
                <Link href={href(locale, `/resheniya/${o.slug}/`)} className="flex min-h-14 items-center py-3 text-[17px] hover:underline">
                  {tr(o.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <CtaBand
        locale={locale}
        title={d.solution.ctaTitle}
        lead={d.solution.ctaLead}
        wa={s.priced ? d.solution.waInterest(lower(noun)) : d.solution.waCalc(noun)}
        label={s.priced ? tt.writeWa : d.solution.byCalcCta}
        track={`solution-cta-${s.slug}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(serviceLd(s, locale)) }} />
    </article>
  );
}
