import { PageHead } from "@/components/page-head";
import { CtaBand } from "@/components/info/cta-band";
import { ProjectFigure } from "@/components/info/project-figure";
import { projects } from "@/content/projects";
import { href, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { info } from "@/i18n/pages/info";
import { buildMeta } from "@/lib/seo";
import { cn } from "@/lib/cn";

export function meta(locale: Locale) {
  const s = info[locale].projects;
  return buildMeta({ locale, path: "/obekty/", title: s.metaTitle, description: s.metaDescription });
}

// Редакционная сетка: широкое и узкое фото чередуются и сдвинуты по вертикали — как развороты журнала.
// Фильтр появится, когда объектов станет больше 8 (ТЗ, раздел 20).
const LAYOUT = [
  "md:col-span-7",
  "md:col-span-4 md:col-start-9 md:mt-40",
  "md:col-span-5 md:col-start-2",
  "md:col-span-6 md:col-start-7 md:mt-24",
  "md:col-span-12",
  "md:col-span-5 md:mt-8",
  "md:col-span-6 md:col-start-7 md:mt-32",
  "md:col-span-7 md:col-start-3",
];
const SIZES = ["58vw", "33vw", "42vw", "50vw", "100vw", "42vw", "50vw", "58vw"];

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  const s = info[locale];
  const anyDemo = projects.some((p) => p.demo);
  return (
    <>
      <PageHead locale={locale} crumbs={[{ path: "/obekty/", label: s.projects.title }]} title={s.projects.title} lead={s.projects.lead}>
        {/* Пустой список — до прихода реальных объектов в production: честная фраза вместо «0 объектов». */}
        {projects.length ? <p className="t-data tnum mt-4">{s.projects.count(projects.length)}</p> : <p className="t-lead mt-4 max-w-[56ch]">{s.projects.empty}</p>}
        {/* Моно — только для данных; пометка о демо — обычной фразой. */}
        {anyDemo && <p className="mt-2 max-w-[60ch] text-[15px] leading-snug text-ink-2">{s.projects.demoNote}</p>}
      </PageHead>

      <ul className="mx-auto mt-10 grid max-w-[1440px] items-start gap-x-8 gap-y-12 px-4 md:mt-16 md:grid-cols-12 md:gap-y-20 md:px-8">
        {projects.map((p, i) => (
          <li key={p.slug} className={cn(LAYOUT[i % LAYOUT.length])}>
            <ProjectFigure project={p} locale={locale} priority={i === 0} reveal={i > 0} sizes={`(min-width: 768px) ${SIZES[i % SIZES.length]}, 100vw`} />
          </li>
        ))}
      </ul>

      <CtaBand
        from="projects"
        title={s.projects.endTitle}
        lead={s.projects.endLead}
        waText={s.projects.waText}
        waLabel={t(locale).writeWa}
        second={{ href: href(locale, "/raschet/"), label: t(locale).calc }}
        note={s.replyNote}
      />
    </>
  );
}
