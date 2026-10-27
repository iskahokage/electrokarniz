"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Radio, RadioGroup } from "@headlessui/react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Segmented } from "@/components/controls";
import { Price } from "@/components/price";
import { cart, useCart, type CartItem } from "@/lib/cart";
import { formatNumber } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { track } from "@/lib/track";
import { buildPayload, submitOrder } from "@/lib/order";
import {
  buildOrderMessage,
  cartTotals,
  configSummary,
} from "@/lib/order-message";
import { cn } from "@/lib/cn";
import { href, tr, type Locale } from "@/i18n";
import {
  os,
  payments,
  receiveMethods,
  type ReceiveMethod,
} from "@/i18n/pages/order";
import { checkPhone, formatPhone, phoneMode } from "./phone";
import { useMounted } from "./cart-page";
import { useCartSync } from "@/lib/cart-sync";

const LAST = "ek-last-order";
const MIN_FILL_MS = 3000; // быстрее человек форму не заполнит
const noop = () => () => {};

type Done = { number: string; text: string; dev?: boolean; at: number };

function readLast() {
  try {
    return sessionStorage.getItem(LAST);
  } catch {
    return null;
  }
}

function defaultMethod(items: CartItem[]): ReceiveMethod {
  const region = items.find((i) => i.config)?.config?.region;
  if (region === "bishkek") return "install-bishkek";
  if (region === "chui" || region === "issyk-kul" || region === "osh")
    return "install-region";
  if (region === "delivery") return "delivery-kg";
  // Без комплекта устанавливать нечего, а самовывоза нет — значит доставка.
  return items.some((i) => i.kind === "kit")
    ? "install-bishkek"
    : "delivery-kg";
}

export function CheckoutForm({ locale }: { locale: Locale }) {
  const s = os(locale).checkout;
  const mounted = useMounted();
  const { items } = useCart();
  // Прямой заход на оформление минуя корзину — тоже сверяем цены с каталогом.
  useCartSync(items, mounted);
  const lastRaw = useSyncExternalStore(noop, readLast, () => null);
  const [done, setDone] = useState<Done | null>(null);
  const [failed, setFailed] = useState<string | null>(null);


  if (!mounted)
    return (
      <p className="py-16 text-ink-3" role="status">
        …
      </p>
    );

  // Вернулись из WhatsApp, а корзина уже очищена — снова показываем «Заказ принят».
  let shown = done;
  if (!shown && !items.length && lastRaw) {
    try {
      const last = JSON.parse(lastRaw) as Done;
      if (Date.now() - last.at < 3 * 3600_000) shown = last;
    } catch {}
  }
  if (shown) return <Success locale={locale} done={shown} />;

  if (!items.length) {
    return (
      <div className="border-t border-ink pt-8">
        <h2 className="t-h3">{s.emptyTitle}</h2>
        <p className="t-lead mt-3 max-w-[48ch]">{s.emptyLead}</p>
        <div className="mt-6 grid gap-2 sm:flex">
          <Link href={href(locale, "/raschet/")} className="btn btn-accent">
            {os(locale).cart.toCalc}
          </Link>
          <Link href={href(locale, "/katalog/")} className="btn btn-line">
            {os(locale).cart.toCatalog}
          </Link>
        </div>
      </div>
    );
  }

  // При ошибке форму не размонтируем: «Попробовать ещё раз» возвращает к заполненным полям.
  return (
    <>
      {failed && (
        <Failed locale={locale} text={failed} onRetry={() => setFailed(null)} />
      )}
      <div hidden={!!failed}>
        <Form
          locale={locale}
          items={items}
          onDone={(d) => {
            try {
              sessionStorage.setItem(LAST, JSON.stringify(d));
            } catch {}
            setDone(d);
            cart.clear();
            window.scrollTo({ top: 0 });
          }}
          onFail={(text) => {
            setFailed(text);
            window.scrollTo({ top: 0 });
          }}
        />
      </div>
    </>
  );
}

type Errors = Partial<Record<"name" | "phone" | "city", string>>;

function Form({
  locale,
  items,
  onDone,
  onFail,
}: {
  locale: Locale;
  items: CartItem[];
  onDone: (d: Done) => void;
  onFail: (text: string) => void;
}) {
  const s = os(locale).checkout;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<ReceiveMethod>(() =>
    defaultMethod(items),
  );
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [payment, setPayment] = useState(-1);
  const [hp, setHp] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const startedAt = useRef(0);
  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    // Единственная точка begin_checkout: ловит и переход из корзины, и прямой заход на /oformlenie/.
    track("begin_checkout", { value: cartTotals(items).total, items: items.length });
    // Только при первом показе формы.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needCity = method !== "install-bishkek";
  const mode = phoneMode(phone);
  const phoneDigits = phone.replace(/\D/g, "");
  const normalized = checkPhone(phone);

  const errors: Errors = {};
  if (!name.trim()) errors.name = s.errors.name;
  if (phoneDigits.length <= 3) errors.phone = s.errors.phoneEmpty;
  else if (!normalized)
    errors.phone =
      mode === "kz"
        ? s.errors.phoneKz
        : mode === "other"
          ? s.errors.phoneOther
          : s.errors.phoneKg;
  if (needCity && !city.trim()) errors.city = s.errors.city;
  const visible = (k: keyof Errors) =>
    showErrors || touched[k] ? errors[k] : undefined;

  const onPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    // Маску применяем, только когда курсор в конце: правка в середине номера не прыгает.
    const atEnd = el.selectionStart === el.value.length;
    setPhone(atEnd ? formatPhone(el.value) : el.value);
  };
  const setPrefix = (p: string) => {
    const rest = phoneDigits.replace(/^(996|7)/, "");
    setPhone(
      formatPhone(p === "+" ? "+" : `${p}${mode === "other" ? "" : rest}`),
    );
    phoneRef.current?.focus();
  };

  const { total, discount, hasUnknown } = cartTotals(items);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (Object.keys(errors).length) {
      setShowErrors(true);
      (errors.name
        ? nameRef
        : errors.phone
          ? phoneRef
          : cityRef
      ).current?.focus();
      return;
    }
    setSending(true);
    const form = {
      name: name.trim().slice(0, 80),
      phone: normalized!.e164,
      method,
      city: needCity ? city.trim().slice(0, 120) : "Бишкек",
      address: address.trim().slice(0, 300),
      comment: comment.trim().slice(0, 1000),
      payment: payment >= 0 ? payments[payment] : null,
    };
    const text = (number?: string) =>
      buildOrderMessage({
        locale,
        number,
        items,
        method,
        city: needCity ? form.city : undefined,
        name: form.name,
      });
    // Honeypot заполнен — это бот: показываем «успех», ничего не отправляем.
    if (hp) {
      onDone({
        number: String(Math.floor(10000 + Math.random() * 90000)),
        text: text(),
        at: Date.now(),
      });
      return;
    }
    const elapsed = Date.now() - startedAt.current;
    // Автозаполнение браузера бывает быстрее порога — человека не наказываем, просто ждём.
    if (elapsed < MIN_FILL_MS)
      await new Promise((r) => setTimeout(r, MIN_FILL_MS - elapsed));
    const res = await submitOrder(
      buildPayload(form, items, locale, Date.now() - startedAt.current, hp),
    );
    setSending(false);
    if (res.ok) {
      track("order_submit", { value: total, number: res.number, method });
      onDone({
        number: res.number,
        text: text(res.number),
        dev: res.dev,
        at: Date.now(),
      });
    } else {
      track("order_error", { error: res.error.slice(0, 80) });
      onFail(text());
    }
  };

  const field =
    "block min-h-13 w-full border border-ink-3 bg-paper px-4 py-3 text-[17px] outline-none transition-colors placeholder:text-ink-3 focus:border-ink aria-invalid:border-error";

  return (
    <div className="md:grid md:grid-cols-12 md:gap-10">
      <OrderSummary
        locale={locale}
        items={items}
        total={total}
        discount={discount}
        hasUnknown={hasUnknown}
        className="md:order-2 md:col-span-5 lg:col-span-4 lg:col-start-9"
      />

      <form
        noValidate
        onSubmit={submit}
        className="mt-6 md:order-1 md:col-span-7 md:mt-0 [&_input]:scroll-mb-32 [&_textarea]:scroll-mb-32"
        aria-busy={sending}
      >
        <Fieldset legend={s.contacts}>
          <Field id="name" label={s.name} error={visible("name")}>
            {(a) => (
              <input
                ref={nameRef}
                {...a}
                name="name"
                autoComplete="name"
                autoCapitalize="words"
                value={name}
                maxLength={80}
                placeholder={s.namePh}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                className={field}
              />
            )}
          </Field>
          <Field
            id="phone"
            label={s.phone}
            hint={s.phoneHint}
            error={visible("phone")}
          >
            {(a) => (
              <>
                <Segmented
                  label={s.country}
                  options={[
                    s.countryOpts.kg,
                    s.countryOpts.kz,
                    s.countryOpts.other,
                  ]}
                  value={mode === "kg" ? 0 : mode === "kz" ? 1 : 2}
                  onChange={(i: number) => setPrefix(["+996", "+7", "+"][i])}
                  className="mb-2 w-full max-w-[320px]"
                  itemClass="flex items-center justify-center bg-paper-2 data-checked:bg-ink data-checked:text-paper"
                />
                <input
                  ref={phoneRef}
                  {...a}
                  type="tel"
                  name="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  placeholder="+996 555 123 456"
                  onFocus={() => !phone && setPhone("+996")}
                  onChange={onPhone}
                  onBlur={() => {
                    setPhone((p) =>
                      p.replace(/\D/g, "").length <= 3 ? "" : formatPhone(p),
                    );
                    setTouched((t) => ({ ...t, phone: true }));
                  }}
                  className={cn(field, "tnum")}
                />
              </>
            )}
          </Field>
        </Fieldset>

        <Fieldset legend={s.receive}>
          <RadioGroup
            value={method}
            onChange={setMethod}
            aria-label={s.receive}
            className="grid gap-px bg-line sm:grid-cols-2"
          >
            {receiveMethods.map((m) => (
              <Radio
                key={m}
                value={m}
                className="group flex cursor-pointer gap-3 bg-paper p-4 outline-none data-checked:bg-paper-2 data-focus:ring-2 data-focus:ring-accent data-focus:ring-inset"
              >
                <span
                  aria-hidden
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-ink"
                >
                  <span className="hidden size-2.5 rounded-full bg-ink group-data-checked:block" />
                </span>
                <span>
                  <span className="block text-[16px] leading-tight font-semibold">
                    {s.methods[m].t}
                  </span>
                  <span className="mt-1 block text-[14px] leading-snug text-ink-2">
                    {s.methods[m].d}
                  </span>
                </span>
              </Radio>
            ))}
          </RadioGroup>
          {needCity && (
            <Field id="city" label={s.city} error={visible("city")}>
              {(a) => (
                <input
                  ref={cityRef}
                  {...a}
                  name="city"
                  autoComplete="address-level2"
                  value={city}
                  maxLength={120}
                  placeholder={s.cityPh[method]}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                  className={field}
                />
              )}
            </Field>
          )}
          <Field
            id="address"
            label={s.address}
            optional={s.optional}
            hint={s.addressHint}
          >
            {(a) => (
              <input
                {...a}
                name="address"
                autoComplete="street-address"
                value={address}
                maxLength={300}
                placeholder={s.addressPh}
                onChange={(e) => setAddress(e.target.value)}
                className={field}
              />
            )}
          </Field>
        </Fieldset>

        <Fieldset legend={s.payment}>
          <p className="-mt-2 mb-3 text-[14px] text-ink-3">{s.paymentHint}</p>
          <Segmented
            label={s.payment}
            options={s.paymentOpts}
            value={payment}
            onChange={(v: number) => setPayment(v)}
            itemClass="flex basis-[45%] items-center justify-center bg-paper-2 data-checked:bg-ink data-checked:text-paper"
          />
          <Field id="comment" label={s.comment} optional={s.optional}>
            {(a) => (
              <textarea
                {...a}
                name="comment"
                rows={3}
                value={comment}
                maxLength={1000}
                placeholder={s.commentPh}
                onChange={(e) => setComment(e.target.value)}
                className={cn(field, "resize-y")}
              />
            )}
          </Field>
        </Fieldset>

        {/* Ловушка для ботов: человек это поле не видит и не заполняет. */}
        <div
          aria-hidden
          className="absolute -left-[10000px] h-px w-px overflow-hidden"
        >
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </label>
        </div>

        <div className="border-t border-ink pt-6">
          <p className="max-w-[52ch] text-[16px] leading-snug">{s.noPay}</p>
          {showErrors && Object.keys(errors).length > 0 && (
            <p role="alert" className="mt-4 text-[15px] text-error">
              {s.errors.title}
              <span className="sr-only">: {Object.values(errors).join(" ")}</span>
            </p>
          )}
        </div>
        {/* Прямой потомок формы: на телефоне кнопка прилипает к низу экрана, пока видна форма. */}
        <div className="sticky bottom-0 z-30 -mx-4 mt-4 bg-paper/95 px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <button
            type="submit"
            disabled={sending}
            className="btn btn-accent w-full disabled:opacity-70 md:w-auto md:min-w-[320px]"
          >
            {sending ? s.sending : s.submit}
          </button>
        </div>
        <p className="mt-3 max-w-[52ch] text-[13px] leading-snug text-ink-3">
          {s.consent}{" "}
          <Link
            href={href(locale, "/privacy/")}
            // Вертикальные отступы у строчной ссылки растят зону нажатия до 44 px, не двигая строки.
            className="py-3.5 underline underline-offset-2"
          >
            {s.consentLink}
          </Link>
          .
        </p>
      </form>
    </div>
  );
}

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="mb-8 border-t border-ink pt-5">
      <legend className="float-left mb-4 w-full text-[20px] font-semibold tracking-[-0.02em]">
        {legend}
      </legend>
      <div className="clear-both grid gap-5">{children}</div>
    </fieldset>
  );
}

type A = { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string };

function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: string;
  children: (a: A) => ReactNode;
}) {
  const uid = useId();
  const fid = `${id}-${uid}`;
  const desc =
    [hint && `${fid}-h`, error && `${fid}-e`].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div>
      <label htmlFor={fid} className="mb-1.5 block text-[15px] text-ink-2">
        {label}
        {optional && <span className="text-ink-3">, {optional}</span>}
      </label>
      {children({
        id: fid,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": desc,
      })}
      {error && (
        <p
          id={`${fid}-e`}
          className="mt-1.5 text-[14px] leading-snug text-error"
        >
          {error}
        </p>
      )}
      {hint && (
        <p
          id={`${fid}-h`}
          className="mt-1.5 text-[13px] leading-snug text-ink-3"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function OrderSummary({
  locale,
  items,
  total,
  discount,
  hasUnknown,
  className,
}: {
  locale: Locale;
  items: CartItem[];
  total: number;
  discount: number;
  hasUnknown: boolean;
  className?: string;
}) {
  const s = os(locale).checkout;
  const c = os(locale).cart;
  const [open, setOpen] = useState(false);
  // «Позиции» — строки заказа: комплект на 3 окна — одна позиция.
  const count = items.length;
  return (
    <aside aria-labelledby="sum-title" className={className}>
      <div className="border-t border-ink bg-paper-2 md:sticky md:top-24">
        <div className="flex items-start justify-between gap-3 p-4 md:p-6 md:pb-4">
          <div>
            <h2 id="sum-title" className="text-[15px] text-ink-2">
              {s.summary}, {c.items(count)}
            </h2>
            <p className="tnum mt-1 font-display text-[28px] leading-tight font-semibold tracking-[-0.03em]">
              {total > 0 ? (
                `${formatNumber(total)} сом`
              ) : (
                <Price value={null} locale={locale} />
              )}
            </p>
            {discount > 0 && (
              <p className="tnum text-[13px] text-accent">
                {c.discount}: −{formatNumber(discount)} сом
              </p>
            )}
            {hasUnknown && (
              <p className="text-[13px] text-ink-2">
                {total > 0 ? c.unknownExtra : c.unknownOnly}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="sum-list"
            onClick={() => setOpen((v) => !v)}
            className="-mr-2 inline-flex min-h-11 items-center gap-1 px-2 text-[14px] underline-offset-4 hover:underline md:hidden"
          >
            {open ? s.hideSummary : s.showSummary}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
        <div
          id="sum-list"
          className={cn(
            "border-t border-line px-4 pb-4 md:block md:px-6 md:pb-6",
            open ? "block" : "hidden",
          )}
        >
          <ul className="divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="py-3">
                <div className="flex justify-between gap-3 text-[15px] leading-snug">
                  <span>
                    {tr(i.title, locale)}{" "}
                    <span className="tnum text-ink-2">× {i.qty}{i.unit === "m" ? "\u00a0м" : ""}</span>
                  </span>
                  <span className="tnum shrink-0">
                    <Price
                      value={i.unitPrice == null ? null : i.unitPrice * i.qty}
                      locale={locale}
                    />
                  </span>
                </div>
                {i.config && (
                  <p className="t-data mt-1">
                    {configSummary(i.config, locale)}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[13px] text-ink-3">
            {c.delivery}: {c.deliveryValue}
          </p>
          <Link
            href={href(locale, "/korzina/")}
            className="mt-2 inline-flex min-h-11 items-center text-[14px] underline decoration-1 underline-offset-4"
          >
            {s.editCart}
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Success({ locale, done }: { locale: Locale; done: Done }) {
  const s = os(locale).checkout;
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <section className="border-t border-ink pt-8 md:grid md:grid-cols-12 md:gap-10 md:pt-12">
      <div className="md:col-span-7">
        <h2 ref={ref} tabIndex={-1} className="t-h2 outline-none">
          {s.success(done.number)}
        </h2>
        <p className="t-lead mt-4 max-w-[44ch]">{s.successLead}</p>
        <a
          href={waLink(done.text)}
          onClick={() =>
            track("whatsapp_click", {
              from: "order_success",
              number: done.number,
            })
          }
          className="btn btn-accent mt-8 w-full sm:w-auto sm:min-w-[340px]"
        >
          <MessageCircle aria-hidden className="size-5" strokeWidth={1.6} />
          {s.successWa}
        </a>
        <p className="mt-6 max-w-[48ch] text-[15px] leading-snug text-ink-2">
          {s.successNext}
        </p>
        {done.dev && <p className="t-data mt-4">{s.devNote}</p>}
        <Link
          href={href(locale, "/")}
          className="mt-4 inline-flex min-h-11 items-center text-[15px] underline decoration-1 underline-offset-[6px]"
        >
          {s.successHome}
        </Link>
      </div>
      <pre className="t-data mt-8 overflow-x-auto bg-paper-2 p-5 whitespace-pre-wrap md:col-span-5 md:mt-0">
        {done.text}
      </pre>
    </section>
  );
}

function Failed({
  locale,
  text,
  onRetry,
}: {
  locale: Locale;
  text: string;
  onRetry: () => void;
}) {
  const s = os(locale).checkout;
  return (
    <section role="alert" className="border-t border-error pt-8 md:pt-12">
      <h2 className="t-h2 max-w-[20ch]">{s.failTitle}</h2>
      <p className="t-lead mt-4 max-w-[48ch]">{s.failLead}</p>
      <div className="mt-8 grid gap-2 sm:flex">
        <a
          href={waLink(text)}
          onClick={() => track("whatsapp_click", { from: "order_error" })}
          className="btn btn-accent"
        >
          <MessageCircle aria-hidden className="size-5" strokeWidth={1.6} />
          {s.failWa}
        </a>
        <button type="button" onClick={onRetry} className="btn btn-line">
          {s.retry}
        </button>
      </div>
      <pre className="t-data mt-8 max-w-[60ch] bg-paper-2 p-5 whitespace-pre-wrap">
        {text}
      </pre>
    </section>
  );
}
