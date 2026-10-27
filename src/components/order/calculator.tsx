"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Radio, RadioGroup } from "@headlessui/react";
import { Minus, Plus, Share2, MessageCircle, Check } from "lucide-react";
import { RailRange, Segmented } from "@/components/controls";
import { WindowScheme } from "@/components/window-scheme";
import { SomSign } from "@/components/price";
import { CalcPreview } from "./preview";
import { useReached } from "./use-reached";
import { setOwnSticky } from "@/lib/own-sticky";
import { brands } from "@/content/brands";
import { solutionImages } from "@/content/solution-images";
import type { Ecosystem, Product } from "@/content/types";
import { DEFAULTS, MAX_INPUT, MAX_WINDOWS, fromQuery, kits, parseStored, toQuery, type CalcState } from "./calc-state";
import { cart, kitId, type KitConfig } from "@/lib/cart";
import { cornicePrice, orderDiscount, PRICING } from "@/lib/pricing";
import { formatMeters, formatNumber } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { track } from "@/lib/track";
import { buildCalcMessage, configSummary, type KitConfigX } from "@/lib/order-message";
import { cn } from "@/lib/cn";
import { href, tr, type Locale } from "@/i18n";
import { os, calcTypes, openings, mounts, shapes, fabrics, controls, regions, type CalcType } from "@/i18n/pages/order";

type S = CalcState;
const STORE = "ek-calc-v1";

const TYPE_IMAGE: Record<CalcType, string> = {
  sliding: "living-window",
  roller: solutionImages.rulonnye,
  roman: solutionImages.rimskie,
  plisse: solutionImages["zhalyuzi-i-plisse"],
  lift: solutionImages["lift-sistemy"],
  outdoor: solutionImages.ulichnye,
};

// Какие экосистемы закрывают выбор «управление».
const ECO: Record<(typeof controls)[number], Ecosystem[]> = {
  remote: ["remote"],
  app: ["tuya", "mihome", "homekit", "google"],
  alice: ["alice"],
  switch: ["switch"],
};

const noop = () => () => {};
function readStoredRaw() {
  try {
    return localStorage.getItem(STORE);
  } catch {
    return null;
  }
}

/** Максимальная длина из паспорта, если она указана с источником; иначе не отсекаем. */
function maxLength(p: Product): number | null {
  const spec = p.specs.find((s) => /макс/i.test(s.label.ru) && /длин/i.test(s.label.ru));
  if (!spec) return null;
  const raw = typeof spec.value === "string" ? spec.value : spec.value.ru;
  const n = Number(raw.replace(",", ".").match(/\d+(\.\d+)?/)?.[0]);
  return n > 0 ? n : null;
}

/** Наибольший вес шторы по паспорту («до 50 кг», «50 / 75 / 100 кг»); нет данных — null. */
function maxLoad(p: Product): number | null {
  const spec = p.specs.find((x) => x.source && /вес/i.test(x.label.ru));
  if (!spec) return null;
  const raw = typeof spec.value === "string" ? spec.value : spec.value.ru;
  const nums = (raw.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(",", ".")));
  return nums.length ? Math.max(...nums) : null;
}

// Тяжёлые портьеры — тяжелее 50 кг на карниз: моторы «до 45–50 кг» для них не предлагаем (ТЗ, раздел 16).
const HEAVY_MIN_KG = 50;

const seg = "flex items-center justify-center bg-paper-2 data-checked:bg-ink data-checked:text-paper data-hover:bg-paper-3 data-checked:data-hover:bg-ink";

export function Calculator({ locale }: { locale: Locale }) {
  // useSearchParams в статической сборке требует Suspense. Запасной вариант — тот же калькулятор
  // с параметрами по умолчанию: в HTML сразу полноценная страница, а не пустое место.
  return (
    <Suspense fallback={<CalcApp locale={locale} search={null} live={false} />}>
      <WithParams locale={locale} />
    </Suspense>
  );
}

function WithParams({ locale }: { locale: Locale }) {
  const search = useSearchParams();
  return <CalcApp locale={locale} search={search} live />;
}

function CalcApp({ locale, search, live }: { locale: Locale; search: URLSearchParams | null; live: boolean }) {
  const s = os(locale).calc;
  const fromLink = useMemo(() => (live && search ? fromQuery(new URLSearchParams(search.toString())) : null), [live, search]);
  const [st, setSt] = useState<S>(() => ({ ...DEFAULTS, ...(fromLink ?? {}) }));
  const [restored, setRestored] = useState(false);
  const [lenText, setLenText] = useState(() => st.l.toFixed(1).replace(".", ","));
  const [added, setAdded] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const started = useRef(false);

  const set = <K extends keyof S>(k: K, v: S[K]) => {
    if (!started.current) {
      started.current = true;
      track("calculator_start", { type: st.type });
    }
    setAdded(false);
    setShareMsg("");
    setSt((p) => ({ ...p, [k]: v }));
  };

  // Состояние — в адрес (ссылка открывает тот же расчёт) и в localStorage (вернулся — всё на месте).
  // localStorage и адрес страницы читаем через useSyncExternalStore: при гидрации берётся серверный
  // снимок (пусто), затем клиентский — HTML сервера и клиента не расходятся.
  const storedRaw = useSyncExternalStore(noop, readStoredRaw, () => null);
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  // Ссылка важнее сохранённого: человек открыл чужой расчёт — показываем именно его.
  if (live && !restored && origin) {
    setRestored(true);
    const stored = fromLink ? null : parseStored(storedRaw);
    if (stored) {
      const next = { ...DEFAULTS, ...stored };
      setSt(next);
      setLenText(next.l.toFixed(1).replace(".", ","));
    }
  }
  const query = toQuery(st);
  const pageUrl = origin ? `${origin}${href(locale, "/raschet/")}?${query}` : undefined;
  useEffect(() => {
    if (!live || !restored) return;
    try {
      localStorage.setItem(STORE, JSON.stringify(st));
    } catch {}
    window.history.replaceState(window.history.state, "", `${window.location.pathname}?${query}`);
  }, [st, query, live, restored]);

  const priced = st.type === "sliding";
  // Больше 12 м — только про раздвижной карниз; ширина окна для штор этим не ограничена.
  const over = priced && st.l > PRICING.maxLength;
  const len = Math.max(PRICING.minLength, Math.min(st.l, PRICING.maxLength));
  const control = controls[st.c];

  const variants = useMemo(() => {
    const heavy = fabrics[st.f] === "heavy";
    const fits = kits.filter(
      (p) =>
        ECO[control].some((e) => p.ecosystems.includes(e)) &&
        (maxLength(p) ?? Infinity) >= len &&
        // Вес неизвестен — тяжёлые шторы не обещаем.
        (!heavy || (maxLoad(p) ?? 0) > HEAVY_MIN_KG),
    );
    return { list: fits.length ? fits : kits, none: fits.length === 0 };
  }, [control, len, st.f]);
  const product = variants.list.find((p) => p.slug === st.m) ?? variants.list[0];

  const config: KitConfigX = {
    length: len,
    opening: openings[st.o],
    mount: mounts[st.mt],
    control,
    rows: st.r === 1 ? 2 : 1,
    region: regions[st.rg],
    shape: shapes[st.sh],
    fabric: fabrics[st.f],
  };
  const unit = product && product.price.base != null ? cornicePrice({ length: len, rows: config.rows, base: product.price.base, perMeter: product.price.perMeter }) : null;
  // Скидка от 4 карнизов: окна × ряды (два ряда — два карниза).
  const gross = unit == null ? null : unit * st.w;
  const discount = gross == null ? 0 : orderDiscount(gross, st.w * config.rows);
  const total = gross == null ? null : gross - discount;
  const showPrice = priced && !over;

  const typeLabel = s.typeOpts[st.type];
  // «Алиса» — имя, остальное в середине строки — со строчной.
  const controlLabel = st.c === 2 ? s.controlOpts[st.c] : s.controlOpts[st.c].toLowerCase();
  const waText = buildCalcMessage({
    locale,
    typeLabel,
    // Больше 12 м: длину пишем ту, что ввели, а модель не называем — её подберём сами.
    config: priced ? (over ? { ...config, length: st.l } : config) : undefined,
    model: showPrice && product ? `${product.brand ? brands[product.brand].name + " " : ""}${product.name}` : undefined,
    details: priced ? undefined : [`${s.width.toLowerCase()} ${formatMeters(st.l, locale)}`, controlLabel, s.regionOpts[st.rg]],
    windows: st.w,
    price: showPrice ? total : null,
    discount: showPrice ? discount : 0,
    over,
    url: pageUrl,
  });

  const complete = (how: string) => track("calculator_complete", { how, type: st.type, length: len, value: total ?? undefined });

  const addToCart = () => {
    if (!product) return;
    const base: KitConfig = config;
    cart.add({
      id: kitId(product.slug, base),
      slug: product.slug,
      kind: "kit",
      title: product.title,
      brand: product.brand,
      image: product.images[0],
      unitPrice: unit,
      config,
      qty: st.w,
    });
    track("add_to_cart", { item: product.slug, value: total ?? undefined });
    complete("cart");
    setAdded(true);
  };

  const share = async () => {
    complete("share");
    const link = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: s.shareTitle, text: waText.split("\n").slice(1, 3).join(" "), url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setShareMsg(s.copied);
    } catch (e) {
      // Отмена шаринга — не ошибка; если буфер недоступен, хотя бы показываем ссылку.
      if ((e as Error)?.name !== "AbortError") setShareMsg(link);
    }
  };

  const onLenText = (v: string) => {
    setLenText(v);
    const n = Number(v.replace(",", ".").trim());
    if (v.trim() && Number.isFinite(n) && n > 0) set("l", Math.round(Math.min(n, MAX_INPUT) * 10) / 10);
  };
  const onLenBlur = () => {
    const n = Math.max(PRICING.minLength, st.l);
    if (n !== st.l) set("l", n);
    setLenText(n.toFixed(1).replace(".", ","));
  };

  // Нижняя закреплённая полоса на телефоне прячется, когда блок итога на экране или уже позади.
  const [resultRef, resultVisible] = useReached<HTMLDivElement>(0.25);
  // Полоса с ценой уехала — общая нижняя панель возвращается (и наоборот).
  useEffect(() => {
    setOwnSticky(!resultVisible);
    return () => setOwnSticky(true);
  }, [resultVisible]);

  // Больше 12 м модель не подбираем — в подписи только то, что человек ввёл.
  const caption = [formatMeters(st.l, locale), priced && product && !over ? product.name : typeLabel, controlLabel].join(", ");
  const priceText = total != null ? `${formatNumber(total)} сом` : null;

  const scheme = (cls?: string) => (
    <figure className={cls}>
      <WindowScheme length={len} oneSide={st.o === 1} rows={st.r === 1 ? 1 : 0} locale={locale} animate className="w-full text-ink" accent="var(--color-accent)" />
      <figcaption className="sr-only">{s.schemeTitle}</figcaption>
    </figure>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-8">
      <div className="grid gap-x-12 md:grid-cols-12">
        {/* Левая колонка: фото с пультом и схема окна — едут вместе с прокруткой формы. */}
        <div className="md:col-span-6">
          <div className="md:sticky md:top-24">
            <CalcPreview
              image={TYPE_IMAGE[st.type]}
              alt={s.previewAlt}
              curtains={priced}
              oneSide={st.o === 1}
              fabric={fabrics[st.f]}
              twoRows={st.r === 1}
              caption={caption}
              labels={s.remote}
              className="-mx-4 aspect-[4/3] md:mx-0 lg:aspect-[3/2]"
            />
            {priced && !over && scheme("mt-6 hidden border-t border-line pt-6 md:block [&_svg]:mx-auto [&_svg]:h-[min(220px,22vh)]")}
            {/* На компьютере итог далеко внизу — цена здесь, рядом с фото, меняется вместе с выбором.
                Для экранного диктора дублирует блок итога, поэтому скрыта от него. */}
            <div aria-hidden className="mt-5 hidden items-baseline justify-between gap-6 border-t border-line pt-4 md:flex">
              <span className="text-[15px] text-ink-2">{showPrice ? s.result : over ? s.overMax : s.byRequest}</span>
              <span className="tnum font-display text-[32px] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap">
                {showPrice && priceText ? priceText : <SomSign />}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 md:col-span-6 md:mt-0 lg:col-span-5 lg:col-start-8">
          <Group label={s.type}>
            <Segmented
              label={s.type}
              options={calcTypes.map((k) => s.typeOpts[k])}
              value={calcTypes.indexOf(st.type)}
              onChange={(i: number) => set("type", calcTypes[i])}
              className="grid grid-cols-2"
              itemClass={cn(seg, "justify-start text-left")}
            />
          </Group>

          <Group label={priced ? s.length : s.width} first>
            <div className="flex items-end justify-between gap-4">
              <label className="flex items-baseline gap-3">
                <span className="sr-only">{s.lengthInput}</span>
                {/* Ширина поля — по тексту: невидимая копия задаёт размер, поле лежит поверх неё. */}
                <span className="tnum inline-grid min-w-[1.4em] border-b border-ink font-display text-[56px] leading-none font-semibold tracking-[-0.04em] focus-within:border-accent md:text-[72px]">
                  <span aria-hidden className="invisible col-start-1 row-start-1 pr-[0.06em] whitespace-pre">{lenText || "0"}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    size={1}
                    value={lenText}
                    onChange={(e) => onLenText(e.target.value)}
                    onBlur={onLenBlur}
                    aria-describedby="len-hint"
                    className="col-start-1 row-start-1 w-full min-w-0 bg-transparent p-0 outline-none"
                  />
                </span>
                <span className="text-[24px] font-semibold">{s.meters}</span>
              </label>
            </div>
            <RailRange label={priced ? s.length : s.width} value={len} onChange={(v) => { set("l", v); setLenText(v.toFixed(1).replace(".", ",")); }} className="mt-3 text-ink" />
            <p id="len-hint" className={cn("mt-1 text-[14px] leading-snug", over ? "text-error" : "text-ink-3")}>{over ? s.overMax : priced ? s.lengthHint : s.widthHint}</p>
            {priced && !over && scheme("mt-4 md:hidden")}
          </Group>

          {priced && (
            <>
              <Group label={s.opening}>
                <Segmented label={s.opening} options={s.openingOpts} value={st.o} onChange={(v: number) => set("o", v)} itemClass={seg} />
              </Group>
              <Group label={s.mount}>
                <Segmented label={s.mount} options={s.mountOpts} value={st.mt} onChange={(v: number) => set("mt", v)} itemClass={seg} />
              </Group>
              <Group label={s.shape}>
                <Segmented label={s.shape} options={s.shapeOpts} value={st.sh} onChange={(v: number) => set("sh", v)} itemClass={seg} />
              </Group>
              <Group label={s.rows}>
                <Segmented label={s.rows} options={s.rowsOpts} value={st.r} onChange={(v: number) => set("r", v)} itemClass={seg} />
              </Group>
              <Group label={s.fabric}>
                <Segmented label={s.fabric} options={s.fabricOpts} value={st.f} onChange={(v: number) => set("f", v)} itemClass={seg} />
              </Group>
            </>
          )}
          <Group label={s.control}>
            <Segmented label={s.control} options={s.controlOpts} value={st.c} onChange={(v: number) => set("c", v)} itemClass={cn(seg, "basis-[40%] sm:basis-0")} />
          </Group>
          <Group label={s.region}>
            <Segmented label={s.region} options={s.regionOpts} value={st.rg} onChange={(v: number) => set("rg", v)} itemClass={cn(seg, "basis-[40%]")} />
          </Group>
          <Group label={s.windows}>
            <Stepper value={st.w} onChange={(v) => set("w", v)} less={s.windowsLess} more={s.windowsMore} label={s.windows} />
          </Group>

          {priced && !over && (
            <Group label={s.motor}>
              <p className="-mt-1 mb-3 text-[14px] text-ink-3">{variants.none ? s.motorNone : s.motorLead}</p>
              <RadioGroup value={product?.slug ?? ""} onChange={(v: string) => set("m", v)} aria-label={s.motor} className="grid gap-px bg-line">
                {variants.list.map((p) => {
                  const price = p.price.base != null ? cornicePrice({ length: len, rows: config.rows, windows: st.w, base: p.price.base, perMeter: p.price.perMeter }) : null;
                  return (
                    <Radio
                      key={p.slug}
                      value={p.slug}
                      className="group flex cursor-pointer items-start gap-3 bg-paper p-4 outline-none data-checked:bg-paper-2 data-focus:ring-2 data-focus:ring-accent data-focus:ring-inset"
                    >
                      <span aria-hidden className="mt-1 grid size-5 shrink-0 place-items-center border border-ink group-data-checked:bg-ink">
                        <Check className="hidden size-3.5 text-paper group-data-checked:block" strokeWidth={2.5} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="t-data block">
                          {p.brand ? brands[p.brand].name : ""}
                        </span>
                        <span className="mt-0.5 block text-[18px] leading-tight font-semibold tracking-[-0.02em]">{p.name}</span>
                        <span className="mt-1 block text-[14px] leading-snug text-ink-2">{tr(p.short, locale)}</span>
                      </span>
                      <span className="tnum shrink-0 pt-4 text-[16px]">{price != null ? `${formatNumber(price)} сом` : <SomSign />}</span>
                    </Radio>
                  );
                })}
              </RadioGroup>
            </Group>
          )}

          {/* Итог */}
          <div ref={resultRef} id="calc-result" className="mt-2 scroll-mt-24 border-t border-ink bg-paper-2 p-5 md:p-7">
            <h2 className="text-[15px] text-ink-2">{showPrice ? s.result : over ? s.overMax : s.byRequest}</h2>
            <p aria-live="polite" aria-atomic className="tnum mt-2 font-display text-[48px] leading-none font-semibold tracking-[-0.04em] md:text-[64px]">
              {showPrice && priceText ? priceText : <SomSign />}
              {showPrice && !priceText && <span className="sr-only">{s.byRequest}</span>}
            </p>
            {showPrice && discount > 0 && (
              <p className="tnum mt-2 text-[15px] text-accent">
                {os(locale).msg.discount}: −{formatNumber(discount)} сом
              </p>
            )}
            {showPrice && unit != null && st.w > 1 && <p className="t-data mt-2">{s.perWindow(`${formatNumber(unit)} сом`)}</p>}
            {showPrice && product && (
              // Резюме выбора чипами (ТЗ, раздел 16): видно, за что эта цена.
              <ul aria-label={s.chips} className="mt-4 flex flex-wrap gap-1.5">
                {[`${product.brand ? brands[product.brand].name + " " : ""}${product.name}`, ...configSummary(config, locale).split(", "), ...(st.w > 1 ? [os(locale).msg.windows(st.w)] : [])].map((c) => (
                  <li key={c} className="t-data border border-line bg-paper px-2 py-1 text-ink">{c}</li>
                ))}
              </ul>
            )}
            <ul className="mt-4 space-y-1.5 text-[14px] leading-snug text-ink-2">
              {!showPrice && <li>{over ? s.overNote : s.byRequestNote}</li>}
              {showPrice && st.rg !== 4 && <li>{s.notes.install}</li>}
              {showPrice && st.rg > 0 && st.rg < 4 && <li>{s.notes.outOfTown[st.rg - 1]}</li>}
              {showPrice && st.rg === 4 && <li>{s.notes.delivery}</li>}
              {showPrice && st.sh > 0 && <li>{s.notes.shape}</li>}
              {showPrice && <li>{s.notes.measure}</li>}
              {showPrice && <li>{s.notes.power}</li>}
              {showPrice && discount === 0 && <li>{s.notes.discount}</li>}
            </ul>

            <div className="mt-6 grid gap-2">
              {showPrice ? (
                added ? (
                  <Link href={href(locale, "/korzina/")} className="btn btn-ink w-full">
                    <Check aria-hidden className="size-[18px]" strokeWidth={1.8} />
                    {s.goCart}
                  </Link>
                ) : (
                  <button type="button" onClick={addToCart} className="btn btn-accent w-full">
                    {s.toCart}
                  </button>
                )
              ) : (
                <a href={waLink(waText)} onClick={() => { complete("whatsapp"); track("whatsapp_click", { from: "calculator" }); }} className="btn btn-accent w-full">
                  <MessageCircle aria-hidden className="size-[18px]" strokeWidth={1.6} />
                  {s.waAsk}
                </a>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {showPrice && (
                  <a href={waLink(waText)} onClick={() => { complete("whatsapp"); track("whatsapp_click", { from: "calculator" }); }} className="btn btn-line w-full px-3">
                    <MessageCircle aria-hidden className="size-[18px] shrink-0" strokeWidth={1.6} />
                    {s.wa}
                  </a>
                )}
                <button type="button" onClick={share} className={cn("btn btn-line w-full px-3", !showPrice && "sm:col-span-2")}>
                  <Share2 aria-hidden className="size-[18px] shrink-0" strokeWidth={1.6} />
                  {s.share}
                </button>
              </div>
              <p role="status" className="min-h-5 text-[14px] break-all text-ink-2">
                {shareMsg || (added ? s.added : "")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Телефон: цена и главное действие под пальцем, пока не дошли до итога. Дальше полоса уезжает,
          и вместо неё появляется общая нижняя панель (у неё своя «подкладка» под подвалом). */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-paper/95 px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 motion-reduce:transition-none md:hidden",
          resultVisible && "translate-y-full",
        )}
        inert={resultVisible}
      >
        <a href="#calc-result" className="min-w-0 flex-1">
          <span className="block truncate text-[12px] leading-tight text-ink-3">{showPrice ? s.result : s.byRequest}</span>
          <span className="tnum block truncate font-display text-[24px] leading-tight font-semibold tracking-[-0.03em]">
            {showPrice && priceText ? priceText : <SomSign />}
          </span>
        </a>
        {showPrice ? (
          added ? (
            <Link href={href(locale, "/korzina/")} className="btn btn-ink min-h-12 shrink-0 px-5">{s.goCart}</Link>
          ) : (
            <button type="button" onClick={addToCart} className="btn btn-accent min-h-12 shrink-0 px-5">{s.toCart}</button>
          )
        ) : (
          <a href={waLink(waText)} onClick={() => complete("whatsapp")} className="btn btn-accent min-h-12 shrink-0 px-4">
            <MessageCircle aria-hidden className="size-[18px]" strokeWidth={1.6} />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

function Group({ label, children, first }: { label: string; children: React.ReactNode; first?: boolean }) {
  return (
    <section className={cn("border-t border-line py-5", first && "md:py-6")}>
      <h2 className="mb-3 text-[15px] text-ink-2">{label}</h2>
      {children}
    </section>
  );
}

function Stepper({ value, onChange, less, more, label }: { value: number; onChange: (v: number) => void; less: string; more: string; label: string }) {
  return (
    <div className="flex items-center gap-px" role="group" aria-label={label}>
      <button type="button" aria-label={less} disabled={value <= 1} onClick={() => onChange(value - 1)} className="grid size-12 place-items-center bg-paper-2 hover:bg-paper-3 disabled:opacity-40">
        <Minus aria-hidden className="size-4" />
      </button>
      <output aria-live="polite" className="tnum grid h-12 w-16 place-items-center bg-paper-2 text-[20px] font-semibold">{value}</output>
      <button type="button" aria-label={more} disabled={value >= MAX_WINDOWS} onClick={() => onChange(value + 1)} className="grid size-12 place-items-center bg-paper-2 hover:bg-paper-3 disabled:opacity-40">
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}
