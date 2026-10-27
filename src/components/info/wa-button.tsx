"use client";

import type { ReactNode } from "react";
import { waLink } from "@/lib/whatsapp";
import { track } from "@/lib/track";

/** Ссылка в WhatsApp с текстом по месту и событием аналитики. */
export function WaButton({ text, from, className, children }: { text: string; from: string; className?: string; children: ReactNode }) {
  return (
    <a href={waLink(text)} className={className} onClick={() => track("whatsapp_click", { method: "whatsapp", item_id: from })}>
      {children}
    </a>
  );
}
