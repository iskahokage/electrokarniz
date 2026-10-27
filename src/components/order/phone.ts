// Маска телефона для поля оформления поверх formatPhoneInput: добавляет +7 и привычку «восьмёрки».
// Правило: ничего не ломать при вводе и удалении — всё, что не распознали, оставляем как ввели.
import { formatPhoneInput, normalizePhone } from "@/lib/phone";

function kz(n: string) {
  const d = n.slice(0, 10);
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean);
  return parts.length ? `+7 ${parts.join(" ")}` : "+7";
}

export type PhoneMode = "kg" | "kz" | "other";

export function phoneMode(v: string): PhoneMode {
  const t = v.trim();
  if (!t || t.startsWith("+996")) return "kg";
  if (t.startsWith("+7")) return "kz";
  return t.startsWith("+") ? "other" : "kg";
}

export function formatPhone(raw: string): string {
  const t = raw.trim();
  const plus = t.startsWith("+");
  const d = t.replace(/\D/g, "");
  if (!d) return plus ? "+" : "";
  if (plus && d.startsWith("996")) {
    let loc = d.slice(3);
    // Поле уже начинается с «+996», а человек по привычке набрал или вставил весь номер:
    // «+996 996 555…» → убираем повтор кода, «+996 0555…» → убираем местный ноль.
    if (loc.startsWith("996") && loc.length > 9) loc = loc.slice(3);
    if (/^0[1-9]/.test(loc)) loc = loc.slice(1);
    // «8 (0555)…» набрали поверх +996: восьмёрку убираем.
    if (loc.startsWith("80")) return formatPhoneInput(loc.slice(1));
    // «8 701…» — казахстанский номер по старой привычке.
    if (/^8[1-9]/.test(loc)) return kz(loc.slice(1));
    return formatPhoneInput(`+996${loc}`);
  }
  // «+7» уже в поле, дальше набрали «8 701…» — 12 цифр значит лишнюю восьмёрку.
  if (plus && d.startsWith("78") && d.length === 12) return kz(d.slice(2));
  if (plus && d.startsWith("7")) return kz(d.slice(1));
  if (plus) return `+${d.slice(0, 15)}`;
  if (d.startsWith("80")) return formatPhoneInput(d.slice(1));
  if (/^8[1-9]/.test(d) || (d.length === 11 && d.startsWith("7"))) return kz(d.slice(1));
  return formatPhoneInput(d);
}

/**
 * Строгая проверка поверх normalizePhone: номер с кодом +996 — ровно 9 цифр после кода, с +7 — ровно 10.
 * Без неё «+996 555 123» прошёл бы как «любой международный» (ТЗ, раздел 17).
 */
export function checkPhone(raw: string) {
  const n = normalizePhone(raw);
  if (!n) return null;
  const d = n.e164.slice(1);
  if (d.startsWith("996") && d.length !== 12) return null;
  if (d.startsWith("7") && d.length !== 11) return null;
  return n;
}
