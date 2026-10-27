import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { WaButton } from "./wa-button";

/** Финальный блок страницы: один главный шаг — WhatsApp, второй — тихой ссылкой. */
export function CtaBand({ title, lead, waText, waLabel, from, second, note }: {
  title: string;
  lead?: string;
  waText: string;
  waLabel: string;
  from: string;
  second?: { href: string; label: string };
  note?: ReactNode;
}) {
  return (
    <section aria-labelledby={`cta-${from}`} className="mx-auto mt-16 max-w-[1440px] px-4 md:mt-24 md:px-8">
      <div className="grid gap-6 border-t border-ink pt-8 md:grid-cols-12 md:gap-8 md:pt-12">
        <div className="md:col-span-6">
          <h2 id={`cta-${from}`} className="t-h2 max-w-[16ch]">
            {title}
          </h2>
          {lead && <p className="t-lead mt-4 max-w-[46ch]">{lead}</p>}
        </div>
        <div className="flex flex-col items-start gap-4 md:col-span-5 md:col-start-8 md:justify-end">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <WaButton text={waText} from={from} className="btn btn-ink w-full sm:w-auto md:btn-accent">
              <MessageCircle className="size-5" strokeWidth={1.6} aria-hidden />
              {waLabel}
            </WaButton>
            {second && (
              <Link href={second.href} className="inline-flex min-h-11 items-center self-start text-[16px] underline decoration-1 underline-offset-[6px] hover:decoration-2 sm:self-auto">
                {second.label}
              </Link>
            )}
          </div>
          {note && <p className="text-[14px] leading-snug text-ink-2">{note}</p>}
        </div>
      </div>
    </section>
  );
}
