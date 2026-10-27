import manifestJson from "../../public/media/manifest.json";
import { cn } from "@/lib/cn";

type Entry = { width: number; height: number; widths: number[] };
const manifest = manifestJson as Record<string, Entry>;

type Props = {
  name: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  /** Пометка демо-фото: снимаем, когда приходят фото владельца. */
  demo?: boolean;
  fit?: "cover" | "contain";
};

export function hasMedia(name: string) {
  return name in manifest;
}

// Свой <picture>: в статической сборке next/image не оптимизирует, форматы и ширины готовит scripts/media.mjs.
export function Picture({ name, alt, sizes, className, imgClassName, priority, demo = false, fit = "cover" }: Props) {
  const m = manifest[name];
  if (!m) {
    // Нет файла — нейтральная плашка вместо сломанной картинки.
    return <span role="img" aria-label={alt} className={cn("block bg-paper-2", className)} />;
  }
  const set = (ext: string) => m.widths.map((w) => `/media/${name}-${w}.${ext} ${w}w`).join(", ");
  const fallback = `/media/${name}-${m.widths[m.widths.length - 1]}.webp`;
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <picture>
        <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
        <img
          src={fallback}
          srcSet={set("webp")}
          sizes={sizes}
          width={m.width}
          height={m.height}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain", imgClassName)}
        />
      </picture>
      {demo && (
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 bg-black/50 px-1 py-px font-mono text-[9px] tracking-wide text-white/85">
          demo
        </span>
      )}
    </span>
  );
}
