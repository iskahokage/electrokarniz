"use client";

import { useEffect } from "react";

// Escape закрывает раскрытый вопрос, в котором стоит фокус: у нативного <details> этого поведения нет.
export function EscClose() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const d = (document.activeElement as HTMLElement | null)?.closest<HTMLDetailsElement>("details[data-esc][open]");
      if (!d) return;
      d.open = false;
      d.querySelector<HTMLElement>("summary")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
