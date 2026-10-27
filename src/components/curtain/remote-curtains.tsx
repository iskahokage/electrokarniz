"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type Motion = "open" | "stop" | "closed";
export type CurtainStatus =
  | { kind: "opening" | "closing" | "open" | "closed" }
  | { kind: "stopped"; percent: number };

type Props = {
  /** null — ещё не нажимали: шторы сами расходятся CSS-анимацией (работает и без JS). */
  cmd: Motion | null;
  tone?: string;
  onStatus?: (s: CurtainStatus) => void;
  className?: string;
};

// Собранная штора занимает 22 % своей половины — как настоящая ткань у края окна.
const OPEN = 0.22;
// Полный ход от «закрыто» до «открыто»: мотор едет с постоянной скоростью, поэтому короткий ход — короче по времени.
const FULL_MS = 2600;
const EASE = "cubic-bezier(.45,.05,.25,1)";

const KEYFRAMES = `@keyframes ek-curtain-open{from{transform:scaleX(1)}to{transform:scaleX(${OPEN})}}`;

function scaleOf(el: HTMLElement) {
  const m = getComputedStyle(el).transform;
  if (!m || m === "none") return 1;
  return new DOMMatrixReadOnly(m).a;
}

const percentOf = (scale: number) => Math.round(((1 - scale) / (1 - OPEN)) * 100);

/** Шторы поверх фото с настоящей кнопкой «Стоп»: при остановке фиксируем текущее положение полотен из computed transform. */
export function RemoteCurtains({ cmd, tone = "#ece6da", onStatus, className }: Props) {
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  // Колбэк в ref: эффект зависит только от команды и не перезапускается при каждом рендере родителя.
  const status = useRef(onStatus);
  useEffect(() => {
    status.current = onStatus;
  }, [onStatus]);

  // При reduced motion стартовой анимации нет — шторы сразу открыты, сообщаем об этом.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) status.current?.({ kind: "open" });
  }, []);

  useEffect(() => {
    if (cmd === null) return;
    const els = [left.current, right.current].filter((e): e is HTMLDivElement => !!e);
    if (!els.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cur = scaleOf(els[0]);
    // Снимаем стартовую анимацию и замораживаем полотна там, где они сейчас.
    for (const el of els) {
      el.style.animation = "none";
      el.style.transition = "none";
      el.style.transform = `scaleX(${cur})`;
    }
    if (cmd === "stop") {
      status.current?.({ kind: "stopped", percent: percentOf(cur) });
      return;
    }
    const target = cmd === "open" ? OPEN : 1;
    const final: CurtainStatus = { kind: cmd === "open" ? "open" : "closed" };
    const dist = Math.abs(target - cur) / (1 - OPEN);
    if (reduce || dist < 0.01) {
      for (const el of els) el.style.transform = `scaleX(${target})`;
      status.current?.(final);
      return;
    }
    void els[0].offsetWidth; // фиксируем стартовую точку перед переходом
    for (const el of els) {
      el.style.transition = `transform ${Math.round(dist * FULL_MS)}ms ${EASE}`;
      el.style.transform = `scaleX(${target})`;
    }
    status.current?.({ kind: cmd === "open" ? "opening" : "closing" });
    const el = els[0];
    const done = (e: TransitionEvent) => e.target === el && status.current?.(final);
    el.addEventListener("transitionend", done);
    return () => el.removeEventListener("transitionend", done);
  }, [cmd]);

  const fabric = {
    backgroundColor: tone,
    backgroundImage:
      "repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, rgba(255,255,255,.2) 7px 15px, rgba(0,0,0,.06) 24px 28px)",
    transform: `scaleX(${OPEN})`,
  } as const;
  const panel = "absolute top-0 bottom-0 w-1/2 animate-[ek-curtain-open_2600ms_cubic-bezier(.45,.05,.25,1)_600ms_both] motion-reduce:animate-none";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <style>{KEYFRAMES}</style>
      <div
        ref={left}
        className={cn(panel, "left-0 origin-left")}
        style={fabric}
        onAnimationStart={() => status.current?.({ kind: "opening" })}
        onAnimationEnd={() => status.current?.({ kind: "open" })}
      />
      {/* Линию профиля сверху не рисуем: под шапкой она читалась как толстая тёмная полоса. */}
      <div ref={right} className={cn(panel, "right-0 origin-right")} style={fabric} />
    </div>
  );
}
