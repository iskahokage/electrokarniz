"use client";

import { useEffect, useState } from "react";

/**
 * true, когда элемент на экране или уже прокручен выше. Нижняя панель телефона по нему прячется:
 * главное действие видно в самом блоке, а у футера панель не закрывает последние строки.
 * Считаем по положению при прокрутке, а не IntersectionObserver: при прыжке (якорь, End) элемент
 * перескакивает экран, не пересекая порог, и наблюдатель молчит.
 * Ref — через setState, чтобы проверка началась, даже если элемент появился не в первом рендере.
 */
export function useReached<T extends Element>(share = 0) {
  const [el, setEl] = useState<T | null>(null);
  const [reached, setReached] = useState(false);
  useEffect(() => {
    if (!el) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      // Видна нужная доля элемента (или он уже выше экрана).
      setReached(r.height > 0 && r.top + share * Math.min(r.height, window.innerHeight) < window.innerHeight);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [el, share]);
  return [setEl, reached] as const;
}
