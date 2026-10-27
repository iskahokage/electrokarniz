import manifestJson from "../../../public/media/manifest.json";
import { hasMedia } from "@/components/picture";
import { brands } from "@/content/brands";
import { productBySlug } from "@/content/catalog";
import type { Project } from "@/content/types";
import { href, tr, type Locale } from "@/i18n";
import { info } from "@/i18n/pages/info";
import { formatMeters } from "@/lib/format";

const manifest = manifestJson as Record<string, { width: number; height: number }>;

/** Первое фото объекта, которое реально есть в медиа; иначе первое по списку (Picture покажет плашку). */
export function projectImage(p: Project) {
  return p.images.find(hasMedia) ?? p.images[0];
}

/** Родные пропорции фото: объекты показываем без кадрирования под одну сетку. */
export function mediaRatio(name: string) {
  const m = manifest[name];
  return m ? `${m.width} / ${m.height}` : "3 / 2";
}

/** «Dooya DT82TV» — или null, если товара уже нет в каталоге. */
export function projectModel(p: Project) {
  const prod = productBySlug(p.product);
  if (!prod) return null;
  return { slug: prod.slug, label: prod.brand ? `${brands[prod.brand].name} ${prod.name}` : prod.name, product: prod };
}

/** Подпись-данные: «Гостиная, 4,1 м, Dooya DT82TV, потолок, от центра». */
export function projectCaption(p: Project, locale: Locale) {
  const s = info[locale];
  const model = projectModel(p);
  return [tr(p.room, locale), formatMeters(p.length, locale), model?.label, s.mountShort[p.mount], s.openingShort[p.opening]]
    .filter(Boolean)
    .join(", ");
}

/** «Рассчитать такой же» → калькулятор с параметрами объекта.
 *  Имена параметров — как в fromQuery калькулятора: mt — монтаж, m — slug мотора из каталога. */
export function sameCalcHref(p: Project, locale: Locale) {
  const q = new URLSearchParams({ type: "sliding", l: String(p.length), o: p.opening, mt: p.mount, c: p.control });
  if (productBySlug(p.product)?.kind === "kit") q.set("m", p.product);
  return `${href(locale, "/raschet/")}?${q.toString()}`;
}
