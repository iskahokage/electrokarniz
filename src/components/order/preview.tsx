"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsLeftRight, ChevronsRightLeft, Pause } from "lucide-react";
import { Picture } from "@/components/picture";
import { cn } from "@/lib/cn";
import type { Fabric } from "@/i18n/pages/order";

type Motion = "open" | "closed" | "stop";

// Цвет и прозрачность полотна показывают выбранную ткань: тюль просвечивает, тяжёлые — плотные и темнее.
const TONES: Record<Fabric, string> = {
  sheer: "rgba(250, 248, 243, .62)",
  regular: "#d9d2c5",
  heavy: "#7f766a",
};

const folds =
  "repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, rgba(255,255,255,.2) 7px 15px, rgba(0,0,0,.06) 24px 28px)";

/** Шторы с настоящей кнопкой «Стоп»: при остановке фиксируем текущее положение полотен. */
function RemoteCurtains({ cmd, oneSide, fabric, sheerLayer }: { cmd: Motion; oneSide: boolean; fabric: Fabric; sheerLayer: boolean }) {
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const open = oneSide ? "scaleX(.14)" : "scaleX(.22)";
    for (const el of [left.current, right.current]) {
      if (!el) continue;
      if (cmd === "stop") {
        el.style.transform = getComputedStyle(el).transform;
        el.style.transition = "none";
      } else {
        el.style.transition = "";
        el.style.transform = cmd === "open" ? open : "scaleX(1)";
      }
    }
  }, [cmd, oneSide]);
  const style = { backgroundColor: TONES[fabric], backgroundImage: folds };
  const cls = "absolute top-0 bottom-0 transition-transform duration-[2000ms] ease-[cubic-bezier(.45,.05,.25,1)] motion-reduce:transition-none";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Второй ряд — тюль, он остаётся закрытым: так видно, что рядов два. */}
      {sheerLayer && fabric !== "sheer" && (
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(250,248,243,.32)", backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,.18) 0 3px, transparent 3px 11px)" }} />
      )}
      {oneSide ? (
        <div key="one" ref={left} className={cn(cls, "left-0 w-full origin-left")} style={style} />
      ) : (
        <>
          <div key="l" ref={left} className={cn(cls, "left-0 w-1/2 origin-left")} style={style} />
          <div key="r" ref={right} className={cn(cls, "right-0 w-1/2 origin-right")} style={style} />
        </>
      )}
    </div>
  );
}

type Props = {
  image: string;
  alt: string;
  curtains: boolean;
  oneSide: boolean;
  fabric: Fabric;
  twoRows: boolean;
  caption: string;
  labels: { open: string; stop: string; close: string; label: string };
  className?: string;
};

/** Фото-превью с пультом на экране: «Открыть / Стоп / Закрыть» двигают шторы в кадре (концепт C). */
export function CalcPreview({ image, alt, curtains, oneSide, fabric, twoRows, caption, labels, className }: Props) {
  const [cmd, setCmd] = useState<Motion>("closed");
  // Один раз после загрузки шторы открываются сами — показываем, что делает мотор.
  useEffect(() => {
    const id = setTimeout(() => setCmd("open"), 600);
    return () => clearTimeout(id);
  }, []);
  const btns: [Motion, string, typeof Pause][] = [
    ["open", labels.open, ChevronsLeftRight],
    ["stop", labels.stop, Pause],
    ["closed", labels.close, ChevronsRightLeft],
  ];
  return (
    <figure className={cn("relative overflow-hidden bg-paper-2", className)}>
      <Picture name={image} alt={alt} sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0" priority />
      {/* Метка «demo» своя, в правом верхнем углу: внизу её закрывают пульт и подпись. */}
      <span className="pointer-events-none absolute top-1.5 right-1.5 bg-black/50 px-1 py-px font-mono text-[9px] tracking-wide text-white/85">demo</span>
      {curtains && <RemoteCurtains cmd={cmd} oneSide={oneSide} fabric={fabric} sheerLayer={twoRows} />}
      {curtains && (
        <div role="group" aria-label={labels.label} className="absolute inset-x-3 bottom-3 grid grid-cols-3 bg-paper sm:inset-x-auto sm:left-1/2 sm:w-[340px] sm:-translate-x-1/2">
          {btns.map(([m, l, Icon]) => (
            <button
              key={m}
              type="button"
              aria-pressed={cmd === m}
              onClick={() => setCmd(m)}
              className={cn("flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-[13px] leading-tight transition-colors", cmd === m ? "bg-ink text-paper" : "hover:bg-paper-2")}
            >
              <Icon aria-hidden className="size-4" strokeWidth={1.6} />
              {l}
            </button>
          ))}
        </div>
      )}
      <figcaption className="tnum absolute top-3 left-3 max-w-[calc(100%-72px)] bg-paper px-2 py-1 font-mono text-[12px] leading-snug text-ink">{caption}</figcaption>
    </figure>
  );
}
