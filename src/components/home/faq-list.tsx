"use client";

import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { Plus } from "lucide-react";

// Аккордеон вопросов: Headless UI даёт aria-expanded и клавиатуру; текст ответа уже в HTML для поиска.
export function FaqList({ items }: { items: { id: string; q: string; a: string }[] }) {
  return (
    <ul className="border-t border-ink">
      {items.map((f) => (
        <li key={f.id} className="border-b border-line">
          <Disclosure>
            <DisclosureButton className="group flex min-h-14 w-full items-start justify-between gap-6 py-4 text-left text-[18px] leading-snug font-medium tracking-[-0.01em] md:text-[20px]">
              <span>{f.q}</span>
              <Plus
                aria-hidden
                strokeWidth={1.5}
                className="mt-0.5 size-5 shrink-0 transition-transform duration-300 group-data-open:rotate-45 motion-reduce:transition-none"
              />
            </DisclosureButton>
            <DisclosurePanel unmount={false} className="max-w-[64ch] pb-5 text-[16px] leading-relaxed text-ink-2">
              {f.a}
            </DisclosurePanel>
          </Disclosure>
        </li>
      ))}
    </ul>
  );
}
