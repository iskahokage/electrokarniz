"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ChevronsLeftRight, Pause, ChevronsRightLeft } from "lucide-react";
import { RemoteCurtains, type CurtainStatus, type Motion } from "@/components/curtain/remote-curtains";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n";
import { th } from "@/i18n/pages/home";

// Сигнатурный момент сайта: пульт на экране управляет шторами в кадре. Фото приходит готовым из Server Component —
// manifest картинок не попадает в клиентский бандл.
// Строки берём здесь, а не пропсом: функцию (stopped) нельзя передать из Server Component.
export function HeroStage({ locale, children }: { locale: Locale; children: ReactNode }) {
  const labels = th(locale).hero;
  const [cmd, setCmd] = useState<Motion | null>(null);
  // До первой команды шторы стоят закрытыми, затем расходятся сами.
  const [status, setStatus] = useState<CurtainStatus>({ kind: "closed" });
  const onStatus = useCallback((s: CurtainStatus) => setStatus(s), []);
  const text = status.kind === "stopped" ? labels.status.stopped(status.percent) : labels.status[status.kind];
  // Подсвечиваем кнопку текущего движения или итогового положения — как индикатор на пульте.
  const active: Motion = status.kind === "opening" || status.kind === "open" ? "open" : status.kind === "stopped" ? "stop" : "closed";
  const buttons: [Motion, string, typeof Pause][] = [
    ["open", labels.open, ChevronsLeftRight],
    ["stop", labels.stop, Pause],
    ["closed", labels.close, ChevronsRightLeft],
  ];
  // Телефон — 4:3, чтобы заголовок и кнопка WhatsApp попали в первый экран; десктоп — высота от экрана по той же причине.
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-paper-2 sm:aspect-[16/9] lg:aspect-auto lg:h-[calc(100svh-23rem)] lg:min-h-[420px] lg:max-h-[680px]">
      {children}
      <RemoteCurtains cmd={cmd} onStatus={onStatus} />
      <p aria-live="polite" className="absolute top-3 left-3 bg-paper/90 px-2 py-1 font-mono text-[12px] leading-none text-ink md:top-5 md:left-5">
        {text}
      </p>
      <div
        role="group"
        aria-label={labels.remote}
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 bg-paper shadow-[0_8px_30px_rgba(23,21,18,.18)] md:bottom-6"
      >
        {buttons.map(([m, l, Icon]) => (
          <button
            key={m}
            type="button"
            onClick={() => setCmd(m)}
            aria-pressed={active === m}
            className={cn(
              "flex min-h-12 min-w-[88px] flex-col items-center justify-center gap-1 px-3 py-1.5 text-[13px] leading-none transition-colors duration-200 md:min-h-14 md:min-w-[112px] md:text-[14px]",
              active === m ? "bg-ink text-paper" : "hover:bg-paper-2",
            )}
          >
            <Icon className="size-4" strokeWidth={1.6} aria-hidden />
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
