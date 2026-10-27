"use client";

import { useRef, useState } from "react";
import { hasMedia, Picture } from "@/components/picture";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n";
import { tc } from "@/i18n/pages/catalog";

/** Галерея без библиотек: лента со scroll-snap листается пальцем, на десктопе — миниатюры. */
export function Gallery({ images, alt, demo, fit, locale }: { images: string[]; alt: string; demo: boolean; fit: "cover" | "contain"; locale: Locale }) {
  const s = tc(locale);
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  // Нет фото — одна нейтральная плашка, страница не разваливается.
  const list = images.length ? images : [""];
  const n = list.length;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div role="group" aria-roledescription="carousel" aria-label={s.p.gallery}>
      <ul
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
        className="no-scrollbar flex snap-x snap-mandatory items-center overflow-x-auto bg-paper-2"
      >
        {list.map((name, i) => (
          <li key={name + i} className="w-full shrink-0 snap-center" aria-label={n > 1 ? s.p.photo(i + 1, n) : undefined}>
            <Picture
              name={name}
              alt={n > 1 ? `${alt} — ${s.p.photo(i + 1, n)}` : alt}
              sizes="(min-width: 1024px) 58vw, 100vw"
              priority={i === 0}
              demo={demo}
              fit={fit}
              // На телефоне — низкая 3:2 и не выше половины экрана: название, цена и «В корзину» видны в первом экране.
              // С 1024 px у фото-комплекта родная пропорция (галерея прилипает рядом с ценой).
              className={cn(
                "mx-auto aspect-[3/2] max-h-[52vh] w-full md:aspect-[4/3]",
                fit === "cover" && hasMedia(name) ? "lg:aspect-auto lg:max-h-none" : "lg:max-h-[calc(100vh-7rem)]",
              )}
              imgClassName={fit === "cover" ? "block object-cover lg:h-auto lg:max-h-[calc(100vh-7rem)]" : "block p-5 md:p-12"}
            />
          </li>
        ))}
      </ul>

      {n > 1 && (
        <>
          {/* Точки на телефоне: показывают, что фото несколько и где вы сейчас. */}
          <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
            {list.map((name, i) => (
              <span key={name + i} className={cn("h-[3px] w-6 transition-colors", i === index ? "bg-ink" : "bg-line")} />
            ))}
          </div>
          <ul className="mt-3 hidden gap-2 md:flex">
            {list.map((name, i) => (
              <li key={name + i}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={s.p.photo(i + 1, n)}
                  aria-current={i === index}
                  className={cn("block w-20 border bg-paper-2 p-0.5 transition-colors", i === index ? "border-ink" : "border-transparent hover:border-line")}
                >
                  <Picture name={name} alt="" sizes="80px" fit={fit} className="aspect-square" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
