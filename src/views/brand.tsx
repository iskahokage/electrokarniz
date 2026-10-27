import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/page-head";
import { Picture } from "@/components/picture";
import { ProductCard } from "@/components/product-card";
import { SectionHead } from "@/components/section-head";
import { brands } from "@/content/brands";
import { products } from "@/content/catalog";
import type { BrandId } from "@/content/types";
import { buildMeta } from "@/lib/seo";
import { waLink } from "@/lib/whatsapp";
import { href, tr, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { tc } from "@/i18n/pages/catalog";

type Params = { slug?: string };

export function staticParams() {
  return (Object.keys(brands) as BrandId[]).map((slug) => ({ slug }));
}

const brandOf = (slug?: string) => (slug && slug in brands ? brands[slug as BrandId] : undefined);

export function meta(locale: Locale, params: Params) {
  const b = brandOf(params.slug);
  const s = tc(locale);
  if (!b) return buildMeta({ locale, path: "/katalog/", title: s.title, description: s.metaDescription });
  return buildMeta({ locale, path: `/brendy/${b.id}/`, title: s.b.metaTitle(b.name), description: s.b.metaDescription(b.name) });
}

export default function View({ locale, params }: { locale: Locale; params: Params }) {
  const b = brandOf(params.slug);
  if (!b) notFound();
  const s = tc(locale);
  const models = products.filter((p) => p.brand === b.id);
  // Комплекты первыми: с них начинают выбор.
  models.sort((x, y) => Number(y.kind === "kit") - Number(x.kind === "kit"));
  const other = (Object.values(brands) as (typeof b)[]).find((x) => x.id !== b.id);
  const coverProduct = models.find((p) => p.category === "kits" && p.images.length);
  const cover = coverProduct?.images[0];

  return (
    <>
      <PageHead
        locale={locale}
        crumbs={[
          { path: "/katalog/", label: s.title },
          { path: `/brendy/${b.id}/`, label: b.name },
        ]}
        title={b.name}
        lead={tr(b.about, locale)}
      >
        <dl className="mt-8 grid max-w-xl grid-cols-2 border-t border-ink">
          <div className="py-4 pr-4">
            <dt className="t-data">{s.b.country}</dt>
            <dd className="mt-1 flex min-h-11 items-center text-[17px]">{tr(b.country, locale)}</dd>
          </div>
          {b.site && (
            <div className="border-l border-line py-4 pl-4">
              <dt className="t-data">{s.b.site}</dt>
              <dd className="mt-1 flex min-h-11 items-center text-[17px]">
                <a href={b.site} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2">
                  {new URL(b.site).hostname.replace(/^www\./, "")}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </PageHead>

      {/* Слова владельца — главное на странице: человеку нужен совет, а не каталог производителя.
          Совет и кнопка идут первыми на любой ширине; две колонки — с 1024 px, на планшете длинное слово цитаты не влезает в половину. */}
      <section aria-labelledby="advice" className="mx-auto mt-14 grid max-w-[1440px] gap-8 px-4 md:mt-24 md:px-8 lg:grid-cols-12 lg:gap-10">
        <figure className={cover ? "lg:col-span-6 lg:self-center" : "lg:col-span-8"}>
          <h2 id="advice" className="t-data">{s.b.ourWords}</h2>
          <blockquote className="t-h2 mt-4 max-w-[20ch] hyphens-auto">{tr(b.ownerWords, locale)}</blockquote>
          <figcaption className="t-data mt-4">{t(locale).brand}</figcaption>
          <a href={waLink(s.b.wa(b.name))} className="btn btn-accent mt-8 w-full sm:w-auto">
            {t(locale).writeWa}
          </a>
        </figure>
        {cover && (
          <div className="lg:col-span-5 lg:col-start-8">
            <Picture name={cover} alt={b.name} sizes="(min-width: 1024px) 40vw, 100vw" className="aspect-[4/3]" demo={coverProduct?.demo} />
          </div>
        )}
      </section>

      {b.facts && b.facts.length > 0 && (
        <section aria-labelledby="facts" className="mx-auto mt-16 grid max-w-[1440px] gap-6 px-4 md:mt-28 md:grid-cols-12 md:gap-10 md:px-8">
          <h2 id="facts" className="t-h2 md:col-span-4">{s.b.facts}</h2>
          {/* Каждый факт — со ссылкой на источник: ничего с чужих слов. */}
          <ul className="border-t border-ink md:col-span-7 md:col-start-6">
            {b.facts.map((x) => (
              <li key={x.source + x.text.ru} className="border-b border-line py-4">
                <p className="max-w-[60ch] text-[17px] leading-snug">{tr(x.text, locale)}</p>
                <a href={x.source} target="_blank" rel="noopener noreferrer" className="t-data mt-1 inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:text-ink">
                  {s.p.specsSource}: {new URL(x.source).hostname.replace(/^www\./, "")}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="models" className="mx-auto mt-16 max-w-[1440px] px-4 md:mt-28 md:px-8">
        <SectionHead id="models" title={s.b.models(b.name)} link={models.length ? { href: `${href(locale, "/katalog/")}?brand=${b.id}`, label: s.b.allBrand(b.name) } : undefined} />
        {models.length ? (
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-10 md:mt-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {models.map((p) => (
              <li key={p.slug} className="flex">
                <ProductCard product={p} locale={locale} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 max-w-[52ch] text-[16px] text-ink-2">{s.b.modelsEmpty}</p>
        )}
      </section>

      <section className="mx-auto mt-16 max-w-[1440px] px-4 pb-20 md:mt-28 md:px-8 md:pb-32">
        <div className="grid border-y border-ink md:grid-cols-2">
          <Link href={href(locale, "/resheniya/pryamye/")} className="group block py-6 md:pr-8">
            <span className="t-h3 group-hover:underline">{s.b.compare}</span>
            <span className="mt-2 block text-[15px] text-ink-2">{s.b.compareText}</span>
          </Link>
          {other && (
            <Link href={href(locale, `/brendy/${other.id}/`)} className="group block border-t border-line py-6 md:border-t-0 md:border-l md:pl-8">
              <span className="t-data block">{s.b.otherBrand}</span>
              <span className="t-h3 mt-1 block group-hover:underline">{other.name}</span>
              <span className="mt-2 block text-[15px] text-ink-2">{tr(other.ownerWords, locale)}</span>
            </Link>
          )}
        </div>
      </section>
    </>
  );
}
