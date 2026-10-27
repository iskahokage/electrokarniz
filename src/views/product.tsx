import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/page-head";
import { ProductCard } from "@/components/product-card";
import { SectionHead } from "@/components/section-head";
import { Gallery } from "@/components/catalog/gallery";
import { ItemBuy, KitBuy } from "@/components/catalog/product-buy";
import { brands } from "@/content/brands";
import { productBySlug, products } from "@/content/catalog";
import { projects } from "@/content/projects";
import { ProjectFigure } from "@/components/info/project-figure";
import type { Product } from "@/content/types";
import { ldJson, productLd } from "@/lib/jsonld";
import { cornicePrice } from "@/lib/pricing";
import { buildMeta } from "@/lib/seo";
import { href, tr, type Locale } from "@/i18n";
import { tc } from "@/i18n/pages/catalog";

type Params = { slug?: string };

export function staticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export function meta(locale: Locale, params: Params) {
  const p = productBySlug(params.slug ?? "");
  if (!p) return buildMeta({ locale, path: "/katalog/", title: tc(locale).title, description: tc(locale).metaDescription });
  return buildMeta({
    locale,
    path: `/katalog/${p.slug}/`,
    title: tr(p.title, locale),
    description: metaDescription(p, locale),
  });
}

// Короткое описание (20–50 знаков) — слабый сниппет; длинное — обрезается поисковиком. Держим 70–160 знаков.
function metaDescription(p: Product, locale: Locale) {
  const tail = tc(locale).p.metaTail;
  const title = tr(p.title, locale);
  const short = tr(p.short, locale).replace(/\.$/, "");
  const desc = p.description ? tr(p.description, locale) : "";
  const base = `${title}. ${short}. ${tail}`;
  // Совсем короткое (комплектующие без описания) — добавляем, куда возим: иначе сниппет в 60 знаков.
  if (base.length < 80 && !desc) return `${base} ${tc(locale).p.metaTailMore}`;
  if (base.length >= 110 || !desc) return base;
  // Добавляем первое предложение описания, если влезает.
  const first = desc.split(/(?<=\.)\s/)[0];
  const withDesc = `${title}. ${first} ${tail}`;
  return withDesc.length <= 160 ? withDesc : base;
}

function priceFrom(p: Product) {
  return p.kind === "kit" ? cornicePrice({ length: 1, rows: 1, base: p.price.base, perMeter: p.price.perMeter }) : (p.price.unit ?? null);
}

/** Похожие: сначала та же категория, потом та же марка; не больше четырёх. */
function related(p: Product) {
  const same = products.filter((x) => x.slug !== p.slug && x.category === p.category);
  const brand = products.filter((x) => x.slug !== p.slug && x.category !== p.category && p.brand && x.brand === p.brand);
  const rest = products.filter((x) => x.slug !== p.slug && !same.includes(x) && !brand.includes(x));
  return { list: [...same, ...brand, ...rest].slice(0, 4), sameCategory: same.length > 0 };
}

export default function View({ locale, params }: { locale: Locale; params: Params }) {
  const p = productBySlug(params.slug ?? "");
  if (!p) notFound();
  const s = tc(locale);
  const title = tr(p.title, locale);
  const brand = p.brand ? brands[p.brand] : undefined;
  // Без источника характеристику не показываем (решение 27.10.2026): лучше пусто, чем выдумано.
  const specs = p.specs.filter((x) => x.source);
  const rel = related(p);
  // Объекты, где стоит именно эта модель; нет таких — раздела нет.
  const withProduct = projects.filter((x) => x.product === p.slug).slice(0, 3);
  const price = priceFrom(p);

  const notes = [
    { title: s.p.warrantyTitle, text: s.p.warrantyText, link: "/garantiya/" },
    ...(p.kind === "kit" ? [{ title: s.p.installTitle, text: s.p.installText, link: "/dostavka-i-oplata/" }] : []),
    { title: s.p.deliveryTitle, text: s.p.deliveryText, link: "/dostavka-i-oplata/" },
    ...(p.kind === "kit" || p.category === "motors" ? [{ title: s.p.powerTitle, text: s.p.powerText, link: "/upravlenie/" }] : []),
  ];

  return (
    <>
      <PageHead
        locale={locale}
        crumbs={[
          { path: "/katalog/", label: s.title },
          { path: `/katalog/${p.slug}/`, label: p.kind === "kit" || p.brand ? p.name : title },
        ]}
        title={title}
      >
        <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {brand && (
            <Link href={href(locale, `/brendy/${brand.id}/`)} className="t-data inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:text-ink">
              {brand.name}, {tr(brand.country, locale)}
            </Link>
          )}
          <span className="t-data">{s.categories[p.category]}</span>
        </p>
      </PageHead>

      {/* Две колонки — только с 1024 px: на планшете цене и конфигуратору тесно в 5/12. */}
      <div className="mx-auto mt-4 grid max-w-[1440px] gap-8 px-4 md:mt-8 md:px-8 lg:grid-cols-12 lg:gap-10">
        <div className="-mx-4 min-w-0 md:mx-0 lg:sticky lg:top-20 lg:col-span-7 lg:self-start">
          <Gallery images={p.images} alt={title} demo={p.demo} fit={p.category === "kits" ? "cover" : "contain"} locale={locale} />
        </div>
        {/* На телефоне блок цены поднимается над описанием (order в Summary): цена и «В корзину» — в первом экране. */}
        <div className="flex min-w-0 flex-col lg:col-span-5">
          <p className="t-lead mt-6 max-w-[48ch] lg:mt-0 lg:mb-6">{tr(p.short, locale)}</p>
          {p.kind === "kit" ? <KitBuy product={p} locale={locale} /> : <ItemBuy product={p} locale={locale} />}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        {p.description && (
          <section className="mt-16 grid gap-6 md:mt-28 md:grid-cols-12 md:gap-10">
            <p className="text-[19px] leading-relaxed md:col-span-7 md:col-start-6 md:text-[22px]">{tr(p.description, locale)}</p>
          </section>
        )}

        {specs.length > 0 && (
          <section aria-labelledby="specs" className="mt-16 grid gap-6 md:mt-28 md:grid-cols-12 md:gap-10">
            <h2 id="specs" className="t-h2 md:col-span-4">{s.p.specs}</h2>
            <dl className="border-t border-ink md:col-span-7 md:col-start-6">
              {specs.map((x) => (
                <div key={x.label.ru} className="grid grid-cols-[1fr_1.2fr] gap-4 border-b border-line py-3.5">
                  <dt className="text-[15px] text-ink-2">{tr(x.label, locale)}</dt>
                  <dd className="tnum text-[15px]">{typeof x.value === "string" ? x.value : tr(x.value, locale)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {p.ecosystems.length > 0 && (
          <section aria-labelledby="eco" className="mt-16 grid gap-6 md:mt-28 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-4">
              <h2 id="eco" className="t-h2">{s.p.ecosystems}</h2>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <ul className="flex flex-wrap gap-x-8 gap-y-3 border-t border-ink pt-5">
                {p.ecosystems.map((e) => (
                  <li key={e} className="text-[clamp(1.25rem,1rem+1vw,1.75rem)] leading-tight font-semibold tracking-[-0.02em]">
                    {s.eco[e]}
                  </li>
                ))}
              </ul>
              {p.ecosystems.includes("alice") && <p className="mt-5 max-w-[52ch] text-[15px] leading-snug text-ink-2">{s.p.ecosystemsLead}</p>}
              <Link href={href(locale, "/upravlenie/")} className="mt-4 inline-flex min-h-11 items-center text-[15px] underline decoration-1 underline-offset-[6px] hover:decoration-2">
                {s.p.controlLink}
              </Link>
            </div>
          </section>
        )}

        {/* Что в комплекте — только когда владелец подтвердит состав; поля в данных пока нет. */}

        <section aria-label={s.p.warrantyTitle} className="mt-16 grid border-t border-ink sm:grid-cols-2 md:mt-28 lg:grid-cols-4">
          {notes.map((n, i) => (
            <div key={n.title} className={i > 0 ? "border-t border-line py-6 sm:border-t-0 sm:border-l sm:pl-6 lg:pr-6" : "py-6 sm:pr-6"}>
              {/* Заголовок — сама ссылка: четыре одинаковых «Подробнее» подряд читаются как шаблон. */}
              <h3 className="t-h3">
                <Link href={href(locale, n.link)} className="-my-3 inline-block py-3 underline decoration-line decoration-1 underline-offset-[6px] hover:decoration-ink">
                  {n.title}
                </Link>
              </h3>
              <p className="mt-2 max-w-[40ch] text-[15px] leading-snug text-ink-2">{n.text}</p>
            </div>
          ))}
        </section>

        {p.demo && <p className="t-data mt-6 text-ink-3">{s.p.demoData}</p>}

        {withProduct.length > 0 && (
          <section aria-labelledby="with-product" className="mt-16 md:mt-28">
            <SectionHead id="with-product" title={s.p.projects} link={{ href: href(locale, "/obekty/"), label: s.p.allProjects }} />
            <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 md:mt-8 lg:grid-cols-3">
              {withProduct.map((x) => (
                <li key={x.slug}>
                  <ProjectFigure project={x} locale={locale} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" aspect="4 / 3" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {rel.list.length > 0 && (
          <section aria-labelledby="related" className="mt-16 pb-20 md:mt-28 md:pb-32">
            <SectionHead id="related" title={rel.sameCategory ? s.p.related : s.p.relatedOther} link={{ href: href(locale, "/katalog/"), label: s.title }} />
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 md:mt-8 md:grid-cols-4 md:gap-x-6">
              {rel.list.map((x) => (
                <li key={x.slug} className="flex">
                  <ProductCard product={x} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Product без цены Google считает ошибкой разметки (нужны offers) — выводим только с реальной ценой. */}
      {typeof price === "number" && price > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(productLd(p, locale, price)) }} />}
    </>
  );
}
