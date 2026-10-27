"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsLeftRight, ChevronsRightLeft, Pause, type LucideIcon } from "lucide-react";
import { Picture } from "@/components/picture";
import { cn } from "@/lib/cn";

type Motion = "open" | "closed" | "stop";

// Экранный пульт двигает шторы в кадре. «Стоп» — настоящий: фиксируем текущее положение полотен,
// поэтому transition задаём руками, а не через состояние open/closed.
export function RemoteDemo({ image, labels, caption }: { image: string; labels: { group: string; open: string; stop: string; close: string }; caption: string }) {
  const [cmd, setCmd] = useState<Motion>("closed");
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);

  // Один раз приоткрываем шторы при загрузке — показать, что кадр живой. При reduced motion — сразу открыты.
  useEffect(() => {
    const id = setTimeout(() => setCmd("open"), 600);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    for (const el of [left.current, right.current]) {
      if (!el) continue;
      if (cmd === "stop") {
        el.style.transform = getComputedStyle(el).transform;
        el.style.transition = "none";
      } else {
        el.style.transition = "";
        el.style.transform = cmd === "open" ? "scaleX(.2)" : "scaleX(1)";
      }
    }
  }, [cmd]);

  const fabric = {
    backgroundColor: "#ece6da",
    backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, rgba(255,255,255,.2) 7px 15px, rgba(0,0,0,.06) 24px 28px)",
  };
  const panel = "absolute top-0 bottom-0 w-1/2 transition-transform duration-[2400ms] ease-linear motion-reduce:duration-0";
  const buttons: [Motion, string, LucideIcon][] = [
    ["open", labels.open, ChevronsLeftRight],
    ["stop", labels.stop, Pause],
    ["closed", labels.close, ChevronsRightLeft],
  ];
  return (
    <figure>
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2 md:aspect-[21/9]">
        <Picture name={image} alt="" sizes="(min-width: 1440px) 1376px, 100vw" priority demo className="absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div ref={left} className={cn(panel, "left-0 origin-left")} style={fabric} />
          <div ref={right} className={cn(panel, "right-0 origin-right")} style={fabric} />
        </div>
        <div role="group" aria-label={labels.group} className="absolute bottom-3 left-1/2 flex -translate-x-1/2 bg-paper shadow-[0_8px_30px_rgba(0,0,0,.18)] md:bottom-6">
          {buttons.map(([m, l, Icon]) => (
            <button
              key={m}
              type="button"
              onClick={() => setCmd(m)}
              aria-pressed={cmd === m}
              className={cn("flex min-h-14 min-w-[88px] flex-col items-center justify-center gap-1 px-3 text-[13px] transition-colors", cmd === m ? "bg-ink text-paper" : "hover:bg-paper-2")}
            >
              <Icon className="size-4" strokeWidth={1.6} aria-hidden />
              {l}
            </button>
          ))}
        </div>
      </div>
      <figcaption className="t-data mt-3 px-4 md:px-0">{caption}</figcaption>
    </figure>
  );
}
