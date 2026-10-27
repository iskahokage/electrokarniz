"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
import { RailRange, Segmented } from "@/components/controls";
import { Price } from "@/components/price";
import { WindowScheme } from "@/components/window-scheme";
import { brands } from "@/content/brands";
import type { Ecosystem, Product } from "@/content/types";
import { cart, kitId, type KitConfig } from "@/lib/cart";
import { cn } from "@/lib/cn";
import { formatMeters, formatSom } from "@/lib/format";
import { cornicePrice, PRICING } from "@/lib/pricing";
import { track } from "@/lib/track";
import { waLink } from "@/lib/whatsapp";
import { href, tr, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { tc } from "@/i18n/pages/catalog";

type Control = KitConfig["control"];
type Region = KitConfig["region"];
const CONTROLS: Control[] = ["remote", "app", "alice", "switch"];
const REGIONS: Region[] = ["bishkek", "chui", "issyk-kul", "osh", "delivery"];
const OPENINGS: KitConfig["opening"][] = ["center", "side"];
const MOUNTS: KitConfig["mount"][] = ["ceiling", "wall", "niche"];
const APP_ECOS: Ecosystem[] = ["tuya", "mihome", "zigbee", "homekit", "google"];

/** Способы управления — только те, что умеет мотор этой модели. */
function controlsFor(ecos: Ecosystem[]): Control[] {
  const has: Record<Control, boolean> = {
    remote: ecos.includes("remote"),
    app: ecos.some((e) => APP_ECOS.includes(e)),
    alice: ecos.includes("alice"),
    switch: ecos.includes("switch"),
  };
  const list = CONTROLS.filter((c) => has[c]);
  return list.length ? list : ["remote"];
}

const seg = "bg-paper-2 data-checked:bg-ink data-checked:text-paper data-hover:not-data-checked:bg-paper-3";

function useTrackView(p: Product) {
  useEffect(() => {
    track("view_item", { item_id: p.slug, item_category: p.category, item_brand: p.brand });
  }, [p.slug, p.category, p.brand]);
}

/** Сброс подтверждения «Добавлено», когда меняется то, что кладём в корзину. */
function useAdded(key: string) {
  const [addedKey, setAddedKey] = useState<string | null>(null);
  return { added: addedKey === key, markAdded: () => setAddedKey(key) };
}

// ---------- Комплект по длине ----------

export function KitBuy({ product: p, locale }: { product: Product; locale: Locale }) {
  const s = tc(locale);
  useTrackView(p);
  const controls = controlsFor(p.ecosystems);
  const [cfg, setCfg] = useState<KitConfig>({
    length: 3,
    opening: "center",
    mount: "ceiling",
    control: controls[0],
    rows: 1,
    region: "bishkek",
  });
  const set = <K extends keyof KitConfig>(k: K, v: KitConfig[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const price = cornicePrice({ length: cfg.length, rows: cfg.rows, base: p.price.base, perMeter: p.price.perMeter });
  const id = kitId(p.slug, cfg);
  const { added, markAdded } = useAdded(id);
  const title = tr(p.title, locale);

  const summary = [
    formatMeters(cfg.length, locale),
    s.p.openingOpts[OPENINGS.indexOf(cfg.opening)].toLowerCase(),
    s.p.mountWa[MOUNTS.indexOf(cfg.mount)],
    // «Алиса» — имя, остальное в тексте сообщения со строчной.
    cfg.control === "alice" ? s.p.controlOpts.alice : s.p.controlOpts[cfg.control].toLowerCase(),
    s.p.rowsWa[cfg.rows - 1],
    s.p.regionOpts[cfg.region],
  ].join(", ");

  const add = () => {
    cart.add({ id, slug: p.slug, kind: "kit", title: p.title, brand: p.brand, image: p.images[0], unitPrice: price, config: cfg });
    track("add_to_cart", { item_id: p.slug, value: price, currency: "KGS", length: cfg.length });
    markAdded();
  };
  const wa = waLink(s.p.waKit(title, summary, formatSom(price)));

  const priceNode = <span className="tnum">{formatSom(price)}</span>;
  const actionsRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Summary
        locale={locale}
        product={p}
        priceLabel={s.p.priceKit}
        price={<span aria-live="polite" aria-atomic>{priceNode}</span>}
        note={s.p.priceNote}
        actions={
          <div ref={actionsRef}>
            <Actions locale={locale} added={added} onAdd={add} wa={wa} />
          </div>
        }
      />

      <div className="mt-8 md:mt-10">
        <div className="flex items-end justify-between gap-4 border-b border-ink pb-2">
          <span className="t-data">{s.p.length}</span>
          <output className="tnum text-[40px] leading-none font-semibold tracking-[-0.03em] md:text-[48px]">
            {cfg.length.toFixed(1).replace(".", ",")}
            <span className="text-[20px]"> м</span>
          </output>
        </div>
        <RailRange label={s.p.length} value={cfg.length} min={PRICING.minLength} max={PRICING.maxLength} onChange={(v) => set("length", Math.round(v * 10) / 10)} className="text-ink" />
        <div className="t-data -mt-1 flex justify-between text-ink-3" aria-hidden>
          <span>1 м</span>
          <span>12 м</span>
        </div>

        <WindowScheme
          length={cfg.length}
          oneSide={cfg.opening === "side"}
          rows={cfg.rows === 2 ? 1 : 0}
          locale={locale}
          animate
          className="mx-auto mt-4 w-full max-w-[300px] text-ink md:max-w-[360px]"
          accent="var(--color-accent)"
        />

        <div className="mt-6 space-y-5">
          <Field label={s.p.opening}>
            <Segmented label={s.p.opening} options={s.p.openingOpts} value={OPENINGS.indexOf(cfg.opening)} onChange={(i) => set("opening", OPENINGS[i])} itemClass={seg} />
          </Field>
          <Field label={s.p.mount}>
            <Segmented label={s.p.mount} options={s.p.mountOpts} value={MOUNTS.indexOf(cfg.mount)} onChange={(i) => set("mount", MOUNTS[i])} itemClass={seg} />
          </Field>
          {controls.length > 1 && (
            <Field label={s.p.control}>
              <Segmented
                label={s.p.control}
                options={controls.map((c) => s.p.controlOpts[c])}
                value={Math.max(0, controls.indexOf(cfg.control))}
                onChange={(i) => set("control", controls[i])}
                itemClass={cn(seg, "min-w-[40%] sm:min-w-0")}
              />
            </Field>
          )}
          <Field label={s.p.rows} hint={cfg.rows === 2 ? s.p.rowsNote : undefined}>
            <Segmented label={s.p.rows} options={s.p.rowsOpts} value={cfg.rows - 1} onChange={(i) => set("rows", (i + 1) as 1 | 2)} itemClass={seg} />
          </Field>
          <Field label={s.p.region} hint={s.p.regionNote[cfg.region]}>
            <Segmented
              label={s.p.region}
              options={REGIONS.map((r) => s.p.regionOpts[r])}
              value={REGIONS.indexOf(cfg.region)}
              onChange={(i) => set("region", REGIONS[i])}
              itemClass={cn(seg, "min-w-[30%] px-2 sm:min-w-0")}
            />
          </Field>
        </div>
      </div>

      <StickyBar locale={locale} caption={`${p.name}, ${formatMeters(cfg.length, locale)}`} price={priceNode} added={added} onAdd={add} watch={actionsRef} />
    </>
  );
}

// ---------- Штучный товар ----------

export function ItemBuy({ product: p, locale }: { product: Product; locale: Locale }) {
  const s = tc(locale);
  useTrackView(p);
  const [qty, setQty] = useState(1);
  const { added, markAdded } = useAdded(String(qty));
  const unit = p.price.unit ?? null;
  // Профиль и ремень продаются метрами: количество — это метры, иначе в WhatsApp уйдёт «3 шт.» профиля.
  const meters = p.price.per?.ru === "за метр";
  const add = () => {
    cart.add({ id: p.slug, slug: p.slug, kind: "item", title: p.title, brand: p.brand, image: p.images[0], unitPrice: unit, qty, ...(meters ? { unit: "m" as const } : {}) });
    track("add_to_cart", { item_id: p.slug, quantity: qty, value: unit ? unit * qty : undefined, currency: "KGS" });
    markAdded();
  };
  const per = p.price.per ? tr(p.price.per, locale) : undefined;
  const wa = waLink(s.p.waItem(tr(p.title, locale), qty, meters));
  // «за метр» / «за штуку» рядом со знаком сома: без числа иначе непонятно, за что будет цена.
  const priceNode = (
    <>
      <Price value={unit} locale={locale} />
      {per && <span className="t-data ml-2 align-middle font-normal tracking-normal text-ink-2">{per}</span>}
    </>
  );
  const actionsRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <Summary
        locale={locale}
        product={p}
        priceLabel={s.p.price}
        price={priceNode}
        note={unit == null ? s.p.priceItem : undefined}
        actions={
          <>
            <div className="mb-3 flex items-center justify-between gap-4">
              <span className="t-data" id="qty-label">{meters ? s.p.qtyMeters : s.p.qty}</span>
              <Qty value={qty} onChange={setQty} locale={locale} />
            </div>
            <div ref={actionsRef}>
              <Actions locale={locale} added={added} onAdd={add} wa={wa} />
            </div>
          </>
        }
      />
      <StickyBar locale={locale} caption={p.brand ? `${brands[p.brand].name} ${p.name}` : tr(p.title, locale)} price={priceNode} added={added} onAdd={add} watch={actionsRef} />
    </>
  );
}

function Qty({ value, onChange, locale }: { value: number; onChange: (n: number) => void; locale: Locale }) {
  const s = tc(locale);
  return (
    <div role="group" aria-labelledby="qty-label" className="flex items-center border border-ink">
      <button type="button" aria-label={s.p.less} disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))} className="inline-flex size-11 items-center justify-center disabled:text-ink-3">
        <Minus className="size-4" strokeWidth={1.6} aria-hidden />
      </button>
      <output aria-live="polite" className="tnum w-10 text-center text-[17px]">{value}</output>
      <button type="button" aria-label={s.p.moreQty} disabled={value >= 99} onClick={() => onChange(Math.min(99, value + 1))} className="inline-flex size-11 items-center justify-center disabled:text-ink-3">
        <Plus className="size-4" strokeWidth={1.6} aria-hidden />
      </button>
    </div>
  );
}

// ---------- Общие куски ----------

/** Цена, наличие и действия — то, что должно быть видно без скролла. На десктопе прилипает под шапкой. */
function Summary({ locale, product: p, priceLabel, price, note, actions }: { locale: Locale; product: Product; priceLabel: string; price: ReactNode; note?: string; actions: ReactNode }) {
  const tt = t(locale);
  return (
    <div className="border-t border-ink pt-4 max-lg:-order-1 lg:sticky lg:top-16 lg:z-10 lg:border-b lg:border-line lg:bg-paper lg:pb-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="t-data">{priceLabel}</span>
        <span className={cn("t-data", p.stock === "in" ? "text-accent" : "text-ink-2")}>
          {p.stock === "in" ? tt.inStock : tt.onOrder(p.leadDays ?? "15–20")}
        </span>
      </div>
      <p className="mt-1 text-[44px] leading-none font-semibold tracking-[-0.04em] md:text-[56px]">{price}</p>
      {note && <p className="mt-3 max-w-[46ch] text-[14px] leading-snug text-ink-2">{note}</p>}
      <div className="mt-5">{actions}</div>
    </div>
  );
}

function Actions({ locale, added, onAdd, wa }: { locale: Locale; added: boolean; onAdd: () => void; wa: string }) {
  const s = tc(locale);
  const tt = t(locale);
  return (
    <>
      {/* Две равные кнопки в строку; если длинная кыргызская подпись не влезает в половину — кнопки встают друг под другом. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={onAdd} className="btn btn-accent sm:min-w-max sm:grow sm:basis-[calc(50%-4px)]">
          {tt.toCart}
        </button>
        <a href={wa} onClick={() => track("whatsapp_click", { source: "product" })} className="btn btn-line sm:min-w-max sm:grow sm:basis-[calc(50%-4px)]">
          {s.p.askWa}
        </a>
      </div>
      <p aria-live="polite" className="mt-2 min-h-6 text-[15px]">
        {added && (
          <>
            {s.p.added} —{" "}
            <Link href={href(locale, "/korzina/")} className="underline decoration-1 underline-offset-4 hover:decoration-2">
              {s.p.goCart}
            </Link>
          </>
        )}
      </p>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <p className="t-data mb-2">{label}</p>
      {children}
      {hint && <p className="mt-2 text-[14px] leading-snug text-ink-2">{hint}</p>}
    </div>
  );
}

/**
 * Своя нижняя панель на телефоне (общая на странице товара скрыта). Пока кнопки «В корзину» в самом блоке цены
 * на экране, панель уезжает вниз: одна акцентная кнопка на экран.
 */
function StickyBar({ locale, caption, price, added, onAdd, watch }: { locale: Locale; caption: string; price: ReactNode; added: boolean; onAdd: () => void; watch: RefObject<HTMLDivElement | null> }) {
  const s = tc(locale);
  const tt = t(locale);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Портал только после гидрации: на сервере document нет.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const el = watch.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHidden(e.isIntersecting), { rootMargin: "0px 0px -72px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);
  return (
    <>
      <div
        inert={hidden}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-paper/95 px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 ease-out-soft motion-reduce:transition-none md:hidden",
          hidden && "translate-y-full",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="t-data truncate">{caption}</p>
          <p className="mt-0.5 truncate text-[20px] leading-tight font-semibold tracking-[-0.03em]">{price}</p>
        </div>
        {added ? (
          <Link href={href(locale, "/korzina/")} className="btn btn-ink min-h-12 max-w-[50%] shrink-0 px-4 text-center text-[15px] leading-tight">
            {s.p.goCart}
          </Link>
        ) : (
          <button type="button" onClick={onAdd} className="btn btn-accent min-h-12 max-w-[50%] shrink-0 px-5 text-center text-[15px] leading-tight">
            {tt.toCart}
          </button>
        )}
      </div>
      {/* Отступ после подвала, чтобы панель не закрывала его низ. */}
      {mounted && createPortal(<div aria-hidden className="h-[calc(68px+env(safe-area-inset-bottom))] md:hidden" />, document.body)}
    </>
  );
}
