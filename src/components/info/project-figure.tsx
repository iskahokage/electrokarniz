import Link from "next/link";
import { Picture } from "@/components/picture";
import type { Project } from "@/content/types";
import { href, tr, type Locale } from "@/i18n";
import { cn } from "@/lib/cn";
import { mediaRatio, projectCaption, projectImage } from "./project-lib";
import { Reveal } from "./reveal";

/** Объект в галерее: фото в родных пропорциях, название, подпись-данные. Вся карточка — одна ссылка. */
export function ProjectFigure({ project: p, locale, sizes, className, priority, reveal = true, aspect }: {
  project: Project;
  locale: Locale;
  sizes: string;
  className?: string;
  priority?: boolean;
  reveal?: boolean;
  /** Общая пропорция для ровного ряда (например «4 / 3»); без неё — родная пропорция фото. */
  aspect?: string;
}) {
  const img = projectImage(p);
  const title = tr(p.title, locale);
  const pic = (
    // На телефоне высокое фото ограничиваем: иначе один объект занимает больше экрана.
    <span className="block max-h-[70svh] overflow-hidden bg-paper-2 md:max-h-none" style={{ aspectRatio: aspect ?? mediaRatio(img) }}>
      <Picture name={img} alt={title} sizes={sizes} className="h-full" priority={priority} demo={p.demo} />
    </span>
  );
  return (
    <Link href={href(locale, `/obekty/${p.slug}/`)} className={cn("group block", className)}>
      <figure>
        {reveal ? <Reveal>{pic}</Reveal> : pic}
        <figcaption className="mt-3">
          <span className="block text-[19px] leading-tight font-semibold tracking-[-0.02em] underline-offset-[5px] group-hover:underline">{title}</span>
          <span className="t-data mt-1 block">{projectCaption(p, locale)}</span>
        </figcaption>
      </figure>
    </Link>
  );
}
