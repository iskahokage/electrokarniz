import { faq } from "@/content/faq";
import { EscClose } from "./esc-close";
import { tr, type Locale } from "@/i18n";
import { solutionsDict, type FaqId } from "@/i18n/pages/solutions";

// Ответы — из общего списка вопросов (подтверждены владельцем), чтобы формулировки на сайте не расходились.
// Разметку FAQPage не добавляем: её собирает этап SEO (см. src/content/faq.ts).
export function Faq({ locale, ids }: { locale: Locale; ids: FaqId[] }) {
  const items = ids
    .map((id): [string, string] | null => {
      if (id === "priceCalc") {
        const [q, a] = solutionsDict[locale].faqs.priceCalc;
        return [q, a];
      }
      const f = faq.find((x) => x.id === id);
      return f ? [tr(f.q, locale), tr(f.a, locale)] : null;
    })
    .filter((x): x is [string, string] => x !== null);
  if (!items.length) return null;
  return (
    <div className="border-b border-line">
      {items.map(([q, a]) => (
        <details key={q} data-esc className="group border-t border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 text-[18px] leading-snug font-medium tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
            {q}
            <span aria-hidden className="relative size-4 shrink-0">
              <span className="absolute top-1/2 left-0 h-px w-4 bg-ink" />
              <span className="absolute top-0 left-1/2 h-4 w-px bg-ink transition-transform duration-200 group-open:scale-y-0 motion-reduce:transition-none" />
            </span>
          </summary>
          <p className="max-w-[62ch] pb-5 text-[16px] leading-relaxed text-ink-2">{a}</p>
        </details>
      ))}
      <EscClose />
    </div>
  );
}
