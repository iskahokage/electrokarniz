import { cn } from "@/lib/cn";

// Временный текстовый логотип (владелец делает новый). Рельс с бегунком над словом — тот же приём, что в калькуляторе.
// Замена на SVG — здесь, в одном месте.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span aria-hidden className="relative mb-[3px] block h-px w-full bg-ink">
        <span className="absolute -top-[2px] right-[18%] h-[5px] w-[9px] bg-accent" />
      </span>
      <span className="font-display text-[19px] font-semibold tracking-[-0.035em] md:text-[21px]">электрокарниз</span>
    </span>
  );
}
