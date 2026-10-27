import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Строка информационной страницы: заголовок слева, текст справа — как разворот, а не стопка карточек. */
export function InfoRow({ id, title, children, className }: { id: string; title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={cn("grid gap-5 border-t border-line py-10 md:grid-cols-12 md:gap-8 md:py-16", className)}>
      <h2 id={id} className="t-h3 md:col-span-4">
        {title}
      </h2>
      <div className="text-[17px] leading-[1.55] md:col-span-7 md:col-start-6">{children}</div>
    </section>
  );
}

/** Нумерация только там, где это правда последовательность (заказ, гарантийный случай). */
export function Steps({ items }: { items: { t: string; d: string }[] }) {
  return (
    // Нижней линии нет: следующий раздел начинается со своей — без двойной черты.
    <ol className="divide-y divide-line border-t border-line">
      {items.map((s, i) => (
        <li key={s.t} className="grid grid-cols-[2rem_1fr] gap-x-3 py-5 md:grid-cols-[3rem_1fr]">
          <span className="t-data tnum pt-1" aria-hidden>
            {i + 1}
          </span>
          <div>
            <p className="text-[19px] leading-tight font-semibold tracking-[-0.015em]">{s.t}</p>
            <p className="mt-1.5 text-[16px] leading-[1.5] text-ink-2">{s.d}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Ряд фактов: крупное значение и подпись обычным текстом — подписи бывают целыми фразами (особенно на кыргызском). */
export function FactsRow({ items, label }: { items: { k: string; v: string }[]; label: string }) {
  return (
    <section aria-label={label} className="mx-auto max-w-[1440px] px-4 md:px-8">
      <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-3 md:mt-16">
        {items.map((f) => (
          <div key={f.k} className="flex flex-col border-t-2 border-ink pt-4">
            <dt className="order-last mt-2 max-w-[32ch] text-[15px] leading-snug text-ink-2">{f.v}</dt>
            <dd className="tnum text-[clamp(2rem,1.4rem+2.4vw,3.5rem)] leading-none font-semibold tracking-[-0.04em]">{f.k}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Простой список с линиями — для коротких пунктов. */
export function LineList({ items }: { items: string[] }) {
  return (
    <ul className="divide-y divide-line border-t border-line">
      {items.map((x) => (
        <li key={x} className="py-4">
          {x}
        </li>
      ))}
    </ul>
  );
}
