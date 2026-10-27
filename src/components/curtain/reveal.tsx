"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Раздел раскрывается от центра к краям, как шторы, когда доходит до экрана.
 * По умолчанию контент виден (без JS, при reduced motion и если блок уже на экране) —
 * прячем только то, что ещё ниже экрана, чтобы не было мигания и пустых мест.
 * Наблюдаем внешний блок, а обрезаем внутренний: Chrome учитывает clip-path самой цели,
 * и полностью обрезанный блок IntersectionObserver считает невидимым — раздел оставался пустым.
 */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  // done — анимация закончилась: clip-path снимаем, иначе он обрезает обводку фокуса и тени у краёв.
  const [state, setState] = useState<"idle" | "hidden" | "shown" | "done">("idle");
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setState("hidden");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      // Порог по краю экрана, а не долей блока: высокий блок на телефоне иначе может не набрать нужную долю.
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}>
      <div
        onTransitionEnd={(e) => e.target === e.currentTarget && state === "shown" && setState("done")}
        className={cn((state === "hidden" || state === "shown") && "transition-[clip-path] duration-[900ms] ease-out-soft")}
        style={{ clipPath: state === "hidden" ? "inset(0 50% 0 50%)" : state === "shown" ? "inset(0 0% 0 0%)" : undefined, transitionDelay: delay ? `${delay}ms` : undefined }}
      >
        {children}
      </div>
    </div>
  );
}
