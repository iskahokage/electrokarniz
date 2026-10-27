"use client";

import { RadioGroup, Radio } from "@headlessui/react";
import { cn } from "@/lib/cn";

// Сегменты вместо выпадающих списков: все варианты видны сразу и нажимаются большим пальцем.
export function Segmented<T extends number>({
  label,
  options,
  value,
  onChange,
  className,
  itemClass,
}: {
  label: string;
  options: readonly string[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  itemClass?: string;
}) {
  return (
    <RadioGroup value={value} onChange={onChange} aria-label={label} className={cn("flex flex-wrap gap-px", className)}>
      {options.map((o, i) => (
        <Radio
          key={o}
          value={i as T}
          className={cn(
            "min-h-11 flex-1 cursor-pointer px-3 py-2 text-center text-[15px] leading-tight outline-none transition-colors duration-200 data-focus:ring-2 data-focus:ring-[var(--c-accent)]",
            itemClass,
          )}
        >
          {o}
        </Radio>
      ))}
    </RadioGroup>
  );
}

// Слайдер-рельс: нативный range (клавиатура и скринридер из коробки), выглядит как карниз с бегунком.
export function RailRange({
  value,
  onChange,
  min = 1,
  max = 12,
  step = 0.1,
  label,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  className?: string;
}) {
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("rail h-11 w-full cursor-pointer appearance-none bg-transparent", className)}
    />
  );
}
