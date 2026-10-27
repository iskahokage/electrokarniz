// Главная. Сайт многостраничный: главная показывает продукт в движении и цену, а дальше ведёт в разделы.
import Link from "next/link";
import { Picture, hasMedia } from "@/components/picture";
import { ProductCard } from "@/components/product-card";
import { SectionHead } from "@/components/section-head";
import { Reveal } from "@/components/curtain/reveal";
import { HeroStage } from "@/components/home/hero-stage";
import { CalcTeaser } from "@/components/home/calc-teaser";
import { FaqList } from "@/components/home/faq-list";
import { products, productBySlug } from "@/content/catalog";
import { solutions } from "@/content/solutions";
import { projects } from "@/content/projects";
import { brands } from "@/content/brands";
import { faq } from "@/content/faq";
import { site } from "@/content/site";
import { formatMeters, formatNumber } from "@/lib/format";
import { PRICING } from "@/lib/pricing";
import { waLink } from "@/lib/whatsapp";
import { buildMeta } from "@/lib/seo";
import { cn } from "@/lib/cn";
import { href, tr, type Locale } from "@/i18n";
import { t } from "@/i18n/common";
import { th } from "@/i18n/pages/home";

const wrap = "mx-auto max-w-[1440px] px-4 md:px-8";
// Отступы между разделами: на телефоне умереннее — страница и так длинная.
const gap = "mt-16 md:mt-32";
const DEMO_OBJECTS = ["living-grey", "kitchen-sheer", "bedroom-white"];
// Эти вопросы на главной уже закрыты разделами «Как управлять», «Как мы работаем» и «Доставка» — не повторяем.
const FAQ_SKIP = new Set(["delivery", "payment", "terms", "wifi", "warranty"]);

export function meta(locale: Locale) {
  const s = th(locale).meta;
  const from = th(locale).facts.price(formatNumber(PRICING.baseFirstMeter));
  return buildMeta({ locale, path: "/", title: s.title, description: s.description(from) });
}

export default function View({ locale }: { locale: Locale; params: Record<string, never> }) {
  return (
    <div lang={locale}>
      <Hero locale={locale} />
      <Facts locale={locale} />
      <Solutions locale={locale} />
      <Calc locale={locale} />
      <Catalog locale={locale} />
      <Objects locale={locale} />
      <Control locale={locale} />
      <Steps locale={locale} />
      {/* ОТЗЫВЫ: владелец пришлёт реальные отзывы из Instagram (имя, район, дата, источник) — блок появится здесь.
          Пока отзывов нет — блока нет (ТЗ, раздел 20). Не вставлять выдуманные. */}
      <Delivery locale={locale} />
      <Faq locale={locale} />
      <Final locale={locale} />
    </div>
  );
}

function Hero({ locale }: { locale: Locale }) {
  const s = th(locale).hero;
  const tt = t(locale);
  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-[1440px] md:px-8 md:pt-6">
      <HeroStage locale={locale}>
        {/* Видео владельца (public/video/hero-*.mp4) заменит фото, когда будет снято. */}
        <Picture name="hero-bedroom" alt={s.photoAlt} sizes="(min-width: 1440px) 1376px, 100vw" priority demo className="absolute inset-0" />
      </HeroStage>
      <div className="px-4 pt-5 md:grid md:grid-cols-12 md:gap-10 md:px-0 md:pt-12">
        <h1 id="hero-title" className="t-display max-w-[12ch] md:col-span-7 lg:col-span-8 lg:max-w-none lg:text-[clamp(4.5rem,1rem+5vw,6.5rem)]">
          {s.title}
        </h1>
        <div className="mt-4 md:col-span-5 md:mt-1 lg:col-span-4">
          <p className="t-lead max-w-[40ch] text-pretty">{s.lead}</p>
          {/* В узкой колонке планшета кнопки друг под другом, иначе подписи ломаются в две строки. */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row md:mt-8 md:flex-col xl:flex-row">
            <a href={waLink(s.wa)} data-track="home-hero" className="btn btn-accent">
              {tt.writeWa}
            </a>
            <Link href={href(locale, "/raschet/")} className="btn btn-line">
              {tt.calc}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Facts({ locale }: { locale: Locale }) {
  const s = th(locale).facts;
  const items: [string, string][] = [
    [s.price(formatNumber(PRICING.baseFirstMeter)), s.priceNote],
    [s.day, s.dayNote],
    [s.reply, s.replyNote],
  ];
  return (
    <section aria-label={s.label} className={cn(wrap, "mt-12 md:mt-28")}>
      <Reveal>
        {/* В три колонки — только с lg: «13 000 сомдон» не помещается в треть планшетной ширины. */}
        <dl className="grid border-y border-ink lg:grid-cols-3">
          {items.map(([big, small], i) => (
            <div
              key={big}
              className={cn(
                "flex flex-col-reverse gap-1 py-5 lg:py-8 lg:pr-6",
                i > 0 && "border-t border-line lg:border-t-0 lg:border-l lg:pl-6",
              )}
            >
              <dt className="text-[15px] text-ink-2">{small}</dt>
              <dd className="tnum text-[34px] leading-none font-semibold tracking-[-0.035em] whitespace-nowrap md:text-[44px] lg:text-[40px] xl:text-[56px]">{big}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
      <p className="mt-5 max-w-[60ch] text-[16px] leading-snug text-ink-2">{s.trust(site.facts.years, site.facts.objects)}</p>
    </section>
  );
}

function Solutions({ locale }: { locale: Locale }) {
  const s = th(locale).solutions;
  const featured = solutions.slice(0, 3);
  const rest = solutions.slice(3);
  return (
    <section aria-labelledby="home-solutions" className={cn(wrap, gap)}>
      <SectionHead id="home-solutions" title={s.title} lead={s.lead} link={{ href: href(locale, "/resheniya/"), label: s.all }} />
      {/* Три главных типа — с фото, остальные — спокойным списком: не сетка одинаковых карточек. */}
      {/* На телефоне — лента под палец (короче страница), с планшета — сетка. */}
      <ul className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {featured.map((x, i) => (
          <li key={x.slug} className={cn("w-[80%] shrink-0 snap-start sm:w-auto", i === 2 && "sm:col-span-2 lg:col-span-1")}>
            <Link href={href(locale, `/resheniya/${x.slug}/`)} className="group block">
              <Picture
                name={x.image}
                alt=""
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                demo
                className={cn("aspect-[4/3] lg:aspect-[4/5]", i === 2 && "sm:aspect-[16/9] lg:aspect-[4/5]")}
              />
              <h3 className="t-h3 mt-4 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">{tr(x.title, locale)}</h3>
              <p className="mt-1.5 max-w-[46ch] text-[15px] leading-snug text-ink-2">{tr(x.short, locale)}</p>
            </Link>
          </li>
        ))}
      </ul>
      {rest.length > 0 && (
        <ul className="mt-10 grid border-t border-line sm:mt-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3">
          {rest.map((x) => (
            <li key={x.slug} className="border-b border-line">
              <Link href={href(locale, `/resheniya/${x.slug}/`)} className="group flex min-h-12 flex-col justify-center py-2.5 sm:min-h-16 sm:py-4">
                <span className="text-[17px] leading-tight font-medium sm:text-[18px] tracking-[-0.01em] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                  {tr(x.title, locale)}
                </span>
                {/* На телефоне — только названия: описания есть на странице решения. */}
                <span className="mt-1 line-clamp-2 hidden text-[14px] leading-snug text-ink-2 sm:block">{tr(x.short, locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Calc({ locale }: { locale: Locale }) {
  const s = th(locale).calc;
  return (
    <section aria-labelledby="home-calc" className={cn(wrap, gap)}>
      <SectionHead id="home-calc" title={s.title} lead={s.lead} />
      <div className="mt-8">
        <CalcTeaser locale={locale} />
      </div>
    </section>
  );
}

function Catalog({ locale }: { locale: Locale }) {
  const s = th(locale).catalog;
  // Комплекты по длине — первыми: это основной товар; модель по умолчанию — в начале.
  const list = [...products]
    .sort((a, b) => Number(b.kind === "kit") - Number(a.kind === "kit") || Number(!!b.isDefault) - Number(!!a.isDefault))
    .slice(0, 4);
  return (
    <section aria-labelledby="home-catalog" className={cn(wrap, gap)}>
      <SectionHead id="home-catalog" title={s.title} link={{ href: href(locale, "/katalog/"), label: s.all }} />
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-6 lg:grid-cols-4">
        {/* Пока сетка в две колонки (телефон, планшет) — две карточки, один ряд; остальное в каталоге по ссылке выше. */}
        {list.map((p, i) => (
          <div key={p.slug} className={cn("flex", i >= 2 && "hidden lg:flex")}>
            <ProductCard product={p} locale={locale} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Objects({ locale }: { locale: Locale }) {
  const s = th(locale).objects;
  const list = projects.slice(0, 3);
  if (!list.length) return null;
  return (
    <section aria-labelledby="home-objects" className={cn(wrap, gap)}>
      <SectionHead id="home-objects" title={s.title} lead={s.lead} link={{ href: href(locale, "/obekty/"), label: s.all }} />
      <Reveal className="mt-8">
        {/* На телефоне — лента под палец, как в «Что ставим»: три фото подряд занимали два экрана. */}
        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
          {list.map((p, i) => {
            const prod = productBySlug(p.product);
            const model = prod ? (prod.brand ? `${brands[prod.brand].name} ${prod.name}` : tr(prod.title, locale)) : null;
            // Пока фото объекта нет в медиатеке — подставляем демо-интерьер, а не серую плашку.
            const img = hasMedia(p.images[0] ?? "") ? p.images[0] : DEMO_OBJECTS[i % DEMO_OBJECTS.length];
            // Комната уже в названии объекта — в подписи только длина и модель.
            const caption = [formatMeters(p.length, locale), model].filter(Boolean).join(", ");
            return (
              <li key={p.slug} className="w-[80%] shrink-0 snap-start md:w-auto">
                <Link href={href(locale, `/obekty/${p.slug}/`)} className="group block">
                  <figure>
                    <Picture name={img} alt={tr(p.title, locale)} sizes="(min-width: 768px) 33vw, 100vw" demo={p.demo || img !== p.images[0]} className="aspect-[4/3] md:aspect-[4/5]" />
                    <figcaption className="mt-3">
                      <span className="block text-[17px] leading-tight font-medium group-hover:underline group-hover:underline-offset-4">{tr(p.title, locale)}</span>
                      <span className="t-data mt-1 block">{caption}</span>
                    </figcaption>
                  </figure>
                </Link>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </section>
  );
}

function Control({ locale }: { locale: Locale }) {
  const s = th(locale).control;
  return (
    <section aria-labelledby="home-control" className={cn(wrap, gap, "grid gap-8 lg:grid-cols-12 lg:gap-10")}>
      {/* Две колонки — только с lg: на планшете описания пультов сжимались в узкий столбик. */}
      <div className="lg:col-span-5">
        <h2 id="home-control" className="t-h2 max-w-[14ch]">
          {s.title}
        </h2>
        <p className="t-lead mt-4 max-w-[40ch]">{s.lead}</p>
        <Link href={href(locale, "/upravlenie/")} className="mt-5 inline-flex min-h-11 items-center text-[15px] underline decoration-1 underline-offset-[6px] hover:decoration-2">
          {s.more}
        </Link>
      </div>
      <ul className="border-t border-ink lg:col-span-7">
        {s.items.map((x) => (
          <li key={x.t} className="grid gap-1 border-b border-line py-3.5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6 sm:py-5">
            <h3 className="text-[18px] leading-tight font-semibold md:text-[19px] tracking-[-0.015em]">{x.t}</h3>
            <p className="text-[16px] leading-snug text-ink-2">{x.d}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Steps({ locale }: { locale: Locale }) {
  const s = th(locale).steps;
  return (
    <section aria-labelledby="home-steps" className={cn(wrap, gap)}>
      <h2 id="home-steps" className="t-h2">
        {s.title}
      </h2>
      {/* Настоящая последовательность — поэтому номера. Линия сверху — рельс карниза с бегунками-шагами.
          В строку — только с lg: на планшете пять колонок слишком узкие для кыргызских заголовков. */}
      <Reveal className="mt-10">
        <ol className="relative grid gap-0 lg:grid-cols-5 lg:gap-6">
          <span aria-hidden className="absolute top-[5px] right-0 left-0 hidden h-px bg-ink lg:block" />
          {s.items.map((x, i) => (
            <li key={x.t} className="relative pb-6 pl-8 lg:pb-0 last:pb-0 lg:pt-8 lg:pl-0">
              {/* Вертикальный рельс — отрезками от бегунка до бегунка: за последним шагом линия не тянется. */}
              {i < s.items.length - 1 && <span aria-hidden className="absolute top-1 left-[5px] h-full w-px bg-ink lg:hidden" />}
              <span aria-hidden className={cn("absolute top-1 left-0 size-[11px] lg:top-0", i === s.items.length - 1 ? "bg-accent" : "bg-ink")} />
              <p className="t-data">{i + 1}</p>
              <h3 className="mt-1 text-[20px] leading-tight font-semibold tracking-[-0.02em]">{x.t}</h3>
              <p className="mt-2 max-w-[40ch] text-[15px] leading-snug text-ink-2">{x.d}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

function Delivery({ locale }: { locale: Locale }) {
  const s = th(locale).delivery;
  return (
    <section aria-labelledby="home-delivery" className={cn(gap, "bg-paper-2")}>
      <div className={cn(wrap, "grid gap-5 py-10 md:grid-cols-12 md:gap-10 md:py-20")}>
        <h2 id="home-delivery" className="t-h2 md:col-span-7">
          {s.title}
        </h2>
        <div className="md:col-span-5">
          <p className="text-[16px] leading-relaxed text-ink-2">{s.lead}</p>
          <p className="t-data mt-4">{s.install(site.installRegions[locale].join(", "))}</p>
          <Link href={href(locale, "/dostavka-i-oplata/")} className="btn btn-line mt-6">
            {s.more}
          </Link>
        </div>
      </div>
    </section>
  );
}

function Faq({ locale }: { locale: Locale }) {
  const s = th(locale).faq;
  const items = faq.filter((f) => !FAQ_SKIP.has(f.id)).map((f) => ({ id: f.id, q: tr(f.q, locale), a: tr(f.a, locale) }));
  return (
    <section aria-labelledby="home-faq" className={cn(wrap, gap, "grid gap-8 md:grid-cols-12 md:gap-10")}>
      <h2 id="home-faq" className="t-h2 md:col-span-4">
        {s.title}
      </h2>
      <div className="md:col-span-8">
        <FaqList items={items} />
      </div>
    </section>
  );
}

function Final({ locale }: { locale: Locale }) {
  const s = th(locale).final;
  const tt = t(locale);
  return (
    <section aria-labelledby="home-final" className={cn(wrap, gap)}>
      <div className="border-t border-ink pt-10 md:grid md:grid-cols-12 md:gap-10 md:pt-16">
        <h2 id="home-final" className="t-h1 max-w-[14ch] md:col-span-7">
          {s.title}
        </h2>
        <div className="mt-5 md:col-span-5 md:mt-2">
          <p className="t-lead max-w-[44ch] text-pretty">{s.lead}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row md:flex-col xl:flex-row">
            <a href={waLink(s.wa)} data-track="home-final" className="btn btn-accent">
              {tt.writeWa}
            </a>
            <a href={site.phoneHref} data-track="home-final" className="btn btn-line tnum">
              {s.call} {site.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
