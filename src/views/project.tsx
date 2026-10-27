import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { PageHead } from "@/components/page-head";
import { Picture } from "@/components/picture";
import { Price } from "@/components/price";
import { ProjectFigure } from "@/components/info/project-figure";
import { mediaRatio, projectCaption, projectImage, projectModel, sameCalcHref } from "@/components/info/project-lib";
import { WaButton } from "@/components/info/wa-button";
import { projectBySlug, projects } from "@/content/projects";
import { href, tr, type Locale } from "@/i18n";
import { info } from "@/i18n/pages/info";
import { formatMeters } from "@/lib/format";
import { cornicePrice } from "@/lib/pricing";
import { buildMeta } from "@/lib/seo";
import { cn } from "@/lib/cn";

// Пустой список при output: export валит сборку, поэтому без объектов (production до реальных фото) — одна заглушка-404.
export function staticParams() {
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "skoro" }];
}

export function meta(locale: Locale, params: { slug?: string }) {
  const p = projectBySlug(params.slug ?? "");
  if (!p) return buildMeta({ locale, path: "/obekty/", title: info[locale].projects.title, description: info[locale].projects.lead });
  const s = info[locale].project;
  const title = tr(p.title, locale);
  return buildMeta({ locale, path: `/obekty/${p.slug}/`, title: s.metaTitle(title), description: s.metaDescription(title, projectCaption(p, locale)) });
}

export default function View({ locale, params }: { locale: Locale; params: { slug?: string } }) {
  const p = projectBySlug(params.slug ?? "");
  if (!p) notFound();
  const s = info[locale];
  const title = tr(p.title, locale);
  const img = projectImage(p);
  const ratio = mediaRatio(img);
  const portrait = (() => {
    const [w, h] = ratio.split(" / ").map(Number);
    return h > w;
  })();
  const model = projectModel(p);
  // Цена такого же карниза сегодня — по подтверждённой формуле (база и метр из каталога, если у модели свои).
  const kit = model?.product.kind === "kit" ? model.product.price : undefined;
  const estimate = cornicePrice({ length: p.length, rows: 1, base: kit?.base, perMeter: kit?.perMeter });
  const others = projects.filter((x) => x.slug !== p.slug).slice(0, 3);

  const rows: { k: string; v: ReactNode }[] = [
    { k: s.project.room, v: tr(p.room, locale) },
    { k: s.project.district, v: tr(p.district, locale) },
    { k: s.project.length, v: <span className="tnum">{formatMeters(p.length, locale)}</span> },
    ...(model
      ? [{ k: s.project.model, v: <Link href={href(locale, `/katalog/${model.slug}/`)} className="-my-3 inline-flex min-h-11 items-center underline decoration-1 underline-offset-[5px] hover:decoration-2">{model.label}</Link> }]
      : []),
    { k: s.project.mount, v: s.mount[p.mount] },
    { k: s.project.opening, v: s.opening[p.opening] },
    { k: s.project.control, v: s.control[p.control] },
    { k: s.project.install, v: s.project.days(p.days) },
  ];

  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/obekty/", label: s.projects.title }, { path: `/obekty/${p.slug}/`, label: title }]} title={title}>
        <p className="t-data mt-4">{projectCaption(p, locale)}</p>
      </PageHead>

      <div className="mx-auto mt-8 grid max-w-[1440px] gap-10 px-4 md:mt-12 md:grid-cols-12 md:gap-8 md:px-8">
        <div className={cn("md:col-span-8", portrait && "lg:col-span-6 lg:col-start-2")}>
          {/* На телефоне высокое фото ограничиваем, чтобы цена и кнопка были близко. */}
          <div className="max-h-[56svh] overflow-hidden bg-paper-2 md:max-h-none" style={{ aspectRatio: ratio }}>
            <Picture name={img} alt={title} sizes="(min-width: 768px) 66vw, 100vw" className="h-full" priority demo={p.demo} />
          </div>
          {p.demo && <p className="mt-3 text-[14px] leading-snug text-ink-2">{s.project.demo}</p>}
        </div>

        <aside aria-labelledby="facts" className="md:col-span-4 md:col-start-9">
          <div className="md:sticky md:top-24">
            {/* Цена и «Хочу так же» — первыми: на ноутбуке видны без прокрутки, факты ниже. */}
            <div>
              <p className="t-data">{s.project.estimate}</p>
              <p className="mt-1 text-[32px] leading-none font-semibold tracking-[-0.03em]">
                <Price value={estimate} locale={locale} />
              </p>
              <p className="mt-3 text-[14px] leading-snug text-ink-2">{s.project.estimateNote}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <WaButton text={s.project.waText(title)} from={`project:${p.slug}`} className="btn btn-ink w-full md:btn-accent">
                <MessageCircle className="size-5" strokeWidth={1.6} aria-hidden />
                {s.project.same}
              </WaButton>
              <Link href={sameCalcHref(p, locale)} className="btn btn-line w-full">
                {s.project.sameCalc}
              </Link>
            </div>

            <h2 id="facts" className="t-h3 mt-12">{s.project.facts}</h2>
            <dl className="mt-5 border-t border-ink">
              {rows.map((r) => (
                <div key={r.k} className="grid grid-cols-[minmax(7.5rem,40%)_1fr] gap-x-4 border-b border-line py-3">
                  <dt className="t-data pt-0.5">{r.k}</dt>
                  <dd className="text-[16px] leading-snug">{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="others" className="mx-auto mt-20 max-w-[1440px] px-4 md:mt-32 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-b border-ink pb-4">
            <h2 id="others" className="t-h2">{s.project.others}</h2>
            <Link href={href(locale, "/obekty/")} className="inline-flex min-h-11 items-center text-[15px] underline decoration-1 underline-offset-[6px] hover:decoration-2">
              {s.project.all}
            </Link>
          </div>
          <ul className="mt-8 grid items-start gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <ProjectFigure project={o} locale={locale} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
