import Link from "next/link";
import type { ReactNode } from "react";

/** Заголовок раздела на странице: h2 + необязательная ссылка справа. */
export function SectionHead({ title, lead, link, id }: { title: ReactNode; lead?: ReactNode; link?: { href: string; label: string }; id?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-ink pb-4">
      <div>
        <h2 id={id} className="t-h2 max-w-[20ch]">{title}</h2>
        {lead && <p className="t-lead mt-3 max-w-[56ch]">{lead}</p>}
      </div>
      {link && (
        <Link href={link.href} className="inline-flex min-h-11 items-center text-[15px] underline decoration-1 underline-offset-[6px] hover:decoration-2">
          {link.label}
        </Link>
      )}
    </div>
  );
}
