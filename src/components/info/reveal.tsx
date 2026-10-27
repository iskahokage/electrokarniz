"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

// Фото раскрывается от центра, как раздвигаются шторы (концепт C).
// На сервере всё видно сразу: прячем только то, что ниже экрана, — без вспышки и без JS контент не теряется.
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const box = inner.current;
    if (!el || !box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    // Обрезаем внутренний блок, а следим за внешним: Chrome учитывает clip-path цели и не видит «нулевой» элемент.
    box.style.clipPath = "inset(0 50% 0 50%)";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        box.style.transition = "clip-path 1100ms var(--ease-motor)";
        box.style.clipPath = "inset(0 0 0 0)";
        io.disconnect();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn(className)}>
      <div ref={inner}>{children}</div>
    </div>
  );
}
