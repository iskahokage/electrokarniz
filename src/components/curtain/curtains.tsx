"use client";

import { cn } from "@/lib/cn";

export type CurtainState = "open" | "closed";

type Props = {
  state: CurtainState;
  oneSide?: boolean;
  tone?: string; // цвет ткани
  className?: string;
};

// Две полосы ткани поверх фото. Открытые шторы не уезжают целиком, а собираются к краю — как настоящие.
// Складки — повторяющийся градиент, без картинок: ноль лишних килобайт.
export function Curtains({ state, oneSide, tone = "#d9d2c5", className }: Props) {
  const fabric = {
    backgroundColor: tone,
    backgroundImage:
      "repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, rgba(255,255,255,.18) 6px 14px, rgba(0,0,0,.06) 22px 26px)",
  } as const;
  const panel =
    "absolute top-0 bottom-0 transition-transform duration-[1300ms] ease-[cubic-bezier(.22,.61,.36,1)] motion-reduce:transition-none";
  const open = state === "open";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {oneSide ? (
        <div
          className={cn(panel, "left-0 w-full origin-left")}
          style={{ ...fabric, transform: open ? "scaleX(.14)" : "scaleX(1)" }}
        />
      ) : (
        <>
          <div
            className={cn(panel, "left-0 w-1/2 origin-left")}
            style={{ ...fabric, transform: open ? "scaleX(.24)" : "scaleX(1)" }}
          />
          <div
            className={cn(panel, "right-0 w-1/2 origin-right")}
            style={{ ...fabric, transform: open ? "scaleX(.24)" : "scaleX(1)" }}
          />
        </>
      )}
    </div>
  );
}
