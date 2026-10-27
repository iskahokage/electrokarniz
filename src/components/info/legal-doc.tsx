import { site } from "@/content/site";
import { info } from "@/i18n/pages/info";
import type { Locale } from "@/i18n";
import { InfoRow } from "./info-row";

// Подставляем реквизиты из site.ts: в текстах черновиков ничего не хардкодим (ИП пока временный).
// Пока ИП временный, номер лицензии не показываем (как в футере): «№ 000000000» выглядел бы настоящим.
function fill(s: string) {
  const t = site.legal.temporary ? s.replace(/,\s*лицензия \(патент\) № \{license\}/g, "") : s;
  return t
    .replaceAll("{legal}", site.legal.name)
    .replaceAll("{license}", site.legal.license)
    .replaceAll("{phone}", site.phone.replaceAll(" ", "\u00a0")) // номер не рвём переносом
    .replaceAll("{email}", site.email);
}

/** Пометка черновика: видна сразу под заголовком, чтобы текст не приняли за проверенный юристом. */
export function DraftBadge({ locale }: { locale: Locale }) {
  const s = info[locale];
  return (
    <div className="mt-6 flex max-w-[60ch] flex-wrap items-baseline gap-x-3 gap-y-2 border border-ink px-4 py-3">
      <span className="bg-ink px-2 py-0.5 text-[14px] font-semibold text-paper">{s.draft}</span>
      <span className="text-[15px] leading-snug text-ink-2">{s.draftNote}</span>
      <span className="t-data w-full">{s.updated}</span>
    </div>
  );
}

/** Разделы юридического черновика: каждый — строка «заголовок слева, текст справа». */
export function LegalSections({ sections, prefix }: { sections: { t: string; p: string[] }[]; prefix: string }) {
  return (
    <div className="mx-auto mt-10 max-w-[1440px] px-4 md:mt-16 md:px-8">
      {sections.map((sec, i) => (
        <InfoRow key={sec.t} id={`${prefix}-${i}`} title={sec.t}>
          <div className="max-w-[62ch] space-y-4">
            {sec.p.map((p) => (
              <p key={p}>{fill(p)}</p>
            ))}
          </div>
        </InfoRow>
      ))}
    </div>
  );
}
