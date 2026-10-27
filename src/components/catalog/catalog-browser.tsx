"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { brands } from "@/content/brands";
import { products as allProducts } from "@/content/catalog";
import type { CategoryId, Product } from "@/content/types";
import { cn } from "@/lib/cn";
import { waLink } from "@/lib/whatsapp";
import type { Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { tc } from "@/i18n/pages/catalog";
import { apply, available, CATEGORY_ORDER, EMPTY, extraCount, parse, toggle, toQuery, type Filters } from "./filters";

const toggleCls =
  "inline-flex min-h-11 items-center border border-line px-3.5 text-[15px] leading-tight transition-colors duration-200 hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper";

/** Каталог с фильтрами из URL. useSearchParams — только внутри Suspense (статическая сборка). */
export function CatalogBrowser({ locale }: { locale: Locale }) {
  const sp = useSearchParams();
  const pathname = usePathname();
  const filters = parse(new URLSearchParams(sp.toString()), allProducts);
  const onChange = (f: Filters) => {
    const q = toQuery(f);
    // replaceState без перезагрузки: Next синхронизирует его с useSearchParams, история не засоряется.
    window.history.replaceState(null, "", q ? `${pathname}?${q}` : pathname);
  };
  useScrollMemory();
  return <Browser locale={locale} filters={filters} onChange={onChange} />;
}

const SCROLL_KEY = "ek-catalog-scroll";

/**
 * Возврат «Назад» из товара: фильтр живёт в URL, а позиция теряется — до гидрации виден полный каталог,
 * и браузер восстанавливает прокрутку по чужой высоте. Запоминаем позицию при уходе в товар и возвращаем её сами.
 */
function useScrollMemory() {
  useEffect(() => {
    const here = () => location.pathname + location.search;
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (raw) {
        sessionStorage.removeItem(SCROLL_KEY);
        const saved = JSON.parse(raw) as { url: string; y: number; at: number };
        // Только тот же адрес и недавно: свежий заход в каталог начинается сверху.
        if (saved.url === here() && Date.now() - saved.at < 30 * 60_000) requestAnimationFrame(() => window.scrollTo(0, saved.y));
      }
    } catch {}
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a || !/\/katalog\/[^/?#]+\/?$/.test(a.getAttribute("href") || "")) return;
      try {
        sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ url: here(), y: window.scrollY, at: Date.now() }));
      } catch {}
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}

/** То же без URL — для серверного HTML до гидрации: все товары видны сразу и индексируются. */
export function CatalogFallback({ locale }: { locale: Locale }) {
  return <Browser locale={locale} filters={EMPTY} onChange={() => {}} />;
}

function Browser({ locale, filters: f, onChange }: { locale: Locale; filters: Filters; onChange: (f: Filters) => void }) {
  const s = tc(locale);
  const av = available(allProducts);
  const list = apply(allProducts, f);
  const [sheet, setSheet] = useState(false);
  const extra = extraCount(f);

  const chips: { key: string; label: string; next: Filters }[] = [
    ...f.brand.map((b) => ({ key: `b-${b}`, label: brands[b].name, next: { ...f, brand: f.brand.filter((x) => x !== b) } })),
    ...(f.stock ? [{ key: "stock", label: s.f.onlyInStock, next: { ...f, stock: false } }] : []),
    ...f.eco.map((e) => ({ key: `e-${e}`, label: s.eco[e], next: { ...f, eco: f.eco.filter((x) => x !== e) } })),
  ];

  // Без выбранной категории — товары по разделам: так каталог читается как оглавление, а не как свалка.
  const groups: { cat: CategoryId; items: Product[] }[] = f.cat
    ? [{ cat: f.cat, items: list }]
    : CATEGORY_ORDER.map((cat) => ({ cat, items: list.filter((p) => p.category === cat) })).filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-8">
      {/* Категории — строка вкладок; на телефоне листается пальцем. */}
      <nav aria-label={s.f.category} className="-mx-4 mt-8 border-b border-line md:mx-0 md:mt-12">
        <ul className="no-scrollbar flex gap-6 overflow-x-auto px-4 md:flex-wrap md:gap-x-8 md:px-0">
          {[null, ...av.cats].map((c) => {
            const active = f.cat === c;
            return (
              <li key={c ?? "all"} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ ...f, cat: c })}
                  className={cn(
                    "-mb-px inline-flex min-h-12 min-w-11 items-center justify-center border-b-2 text-[16px] whitespace-nowrap transition-colors",
                    active ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink",
                  )}
                >
                  {c ? s.categories[c] : s.all}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Панель фильтров: на телефоне — кнопка и шторка снизу, на десктопе — всё на виду. */}
      <div className="mt-4 flex items-center justify-between gap-4 md:hidden">
        <button type="button" onClick={() => setSheet(true)} className="inline-flex min-h-11 items-center gap-2 border border-ink px-4 text-[15px]">
          <SlidersHorizontal className="size-4" strokeWidth={1.6} aria-hidden />
          {s.f.filters}
          {extra > 0 && <span className="tnum bg-ink px-1.5 text-[12px] leading-5 text-paper">{extra}</span>}
        </button>
        <p className="t-data" aria-live="polite">{s.f.found(list.length)}</p>
      </div>

      <div className="mt-6 hidden flex-wrap items-start gap-x-10 gap-y-5 md:flex">
        <FilterGroups locale={locale} f={f} onChange={onChange} av={av} />
        <div className="ml-auto flex min-h-11 items-center gap-6 self-end">
          <p className="t-data" aria-live="polite">{s.f.found(list.length)}</p>
          {(extra > 0 || f.cat) && (
            <button type="button" onClick={() => onChange(EMPTY)} className="min-h-11 text-[15px] underline decoration-1 underline-offset-[6px] hover:decoration-2">
              {s.f.reset}
            </button>
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2 md:hidden">
          {chips.map((c) => (
            <li key={c.key}>
              <button type="button" onClick={() => onChange(c.next)} aria-label={s.f.remove(c.label)} className="inline-flex min-h-11 items-center gap-2 bg-paper-2 pr-3 pl-3.5 text-[14px]">
                {c.label}
                <X className="size-4" strokeWidth={1.6} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {list.length === 0 ? (
        <div className="mt-12 max-w-[52ch] border-t border-ink pt-6 pb-8 md:mt-16">
          <h2 className="t-h3">{s.f.emptyTitle}</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{s.f.emptyText}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => onChange(EMPTY)} className="btn btn-line">
              {s.f.reset}
            </button>
            <a href={waLink(s.f.emptyWa)} className="btn btn-accent">
              {t(locale).writeWa}
            </a>
          </div>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.cat} aria-labelledby={`cat-${g.cat}`} className="mt-10 md:mt-16">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-b border-ink pb-3">
              <h2 id={`cat-${g.cat}`} className="t-h3">{s.categories[g.cat]}</h2>
              <p className="max-w-[48ch] text-[14px] leading-snug text-ink-2">{s.categoryLead[g.cat]}</p>
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-10 md:mt-8 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4">
              {g.items.map((p) => (
                <li key={p.slug} className="flex">
                  <ProductCard product={p} locale={locale} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <FilterSheet open={sheet} onClose={() => setSheet(false)} locale={locale} f={f} onApply={onChange} />
    </div>
  );
}

type Av = ReturnType<typeof available>;

function FilterGroups({ locale, f, onChange, av, withCategory }: { locale: Locale; f: Filters; onChange: (f: Filters) => void; av: Av; withCategory?: boolean }) {
  const s = tc(locale);
  return (
    <>
      {withCategory && (
        <Group label={s.f.category}>
          {av.cats.map((c) => (
            <button key={c} type="button" aria-pressed={f.cat === c} onClick={() => onChange({ ...f, cat: f.cat === c ? null : c })} className={toggleCls}>
              {s.categories[c]}
            </button>
          ))}
        </Group>
      )}
      {av.brands.length > 1 && (
        <Group label={s.f.brand}>
          {av.brands.map((b) => (
            <button key={b} type="button" aria-pressed={f.brand.includes(b)} onClick={() => onChange({ ...f, brand: toggle(f.brand, b) })} className={toggleCls}>
              {brands[b].name}
            </button>
          ))}
        </Group>
      )}
      {av.stockToggle && (
        <Group label={s.f.stock}>
          <button type="button" aria-pressed={f.stock} onClick={() => onChange({ ...f, stock: !f.stock })} className={toggleCls}>
            {s.f.onlyInStock}
          </button>
        </Group>
      )}
      {av.ecos.length > 1 && (
        <Group label={s.f.control}>
          {av.ecos.map((e) => (
            <button key={e} type="button" aria-pressed={f.eco.includes(e)} onClick={() => onChange({ ...f, eco: toggle(f.eco, e) })} className={toggleCls}>
              {s.eco[e]}
            </button>
          ))}
        </Group>
      )}
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="t-data mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/** Шторка фильтров на телефоне: выбор копится в черновике и применяется по «Показать N». */
function FilterSheet({ open, onClose, locale, f, onApply }: { open: boolean; onClose: () => void; locale: Locale; f: Filters; onApply: (f: Filters) => void }) {
  const s = tc(locale);
  const [draft, setDraft] = useState(f);
  const [prevOpen, setPrevOpen] = useState(open);
  // При каждом открытии черновик = текущие фильтры (паттерн «состояние от пропса» без эффекта).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraft(f);
  }
  const n = apply(allProducts, draft).length;
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 md:hidden">
      <div aria-hidden className="fixed inset-0 bg-ink/40" />
      <DialogPanel
        transition
        className="fixed inset-x-0 bottom-0 flex max-h-[88dvh] flex-col bg-paper transition-transform duration-300 ease-out-soft data-closed:translate-y-full motion-reduce:transition-none"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2">
          <DialogTitle className="t-h3">{s.f.filters}</DialogTitle>
          <button type="button" onClick={onClose} aria-label={t(locale).close} className="inline-flex size-11 items-center justify-center">
            <X className="size-5" strokeWidth={1.6} aria-hidden />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5">
          <FilterGroups locale={locale} f={draft} onChange={setDraft} av={available(allProducts)} withCategory />
        </div>
        <div className="grid grid-cols-[1fr_1.6fr] gap-2 border-t border-line px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setDraft(EMPTY)} className="btn btn-line px-3">
            {s.f.reset}
          </button>
          <button
            type="button"
            disabled={n === 0}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="btn btn-accent px-3 disabled:opacity-50"
          >
            {/* При нуле — словами, а не «Показать 0»: сразу ясно, что выбор слишком узкий. */}
            <span aria-live="polite">{n === 0 ? s.f.none : s.f.show(n)}</span>
          </button>
        </div>
      </DialogPanel>
    </Dialog>
  );
}
