// Телефон: по умолчанию Кыргызстан (+996), плюс +7 (Казахстан, Россия) и любой международный с «+».
// Нормализуем то, что люди реально вводят и вставляют, без жёсткого списка кодов операторов.

export type PhoneResult = { e164: string; country: "kg" | "kz" | "intl" } | null;

const digits = (s: string) => s.replace(/\D/g, "");

export function normalizePhone(raw: string): PhoneResult {
  const s = raw.trim();
  const d = digits(s);
  if (!d) return null;

  // +996 / 996 XXX XXX XXX
  if (d.startsWith("996") && d.length === 12) return { e164: `+${d}`, country: "kg" };
  // 0555 123 456 — местный формат КР
  if (d.startsWith("0") && d.length === 10) return { e164: `+996${d.slice(1)}`, country: "kg" };
  // 8 (0555) 123 456 — старая привычка «восьмёрки» перед местным номером
  if (d.startsWith("80") && d.length === 11) return { e164: `+996${d.slice(2)}`, country: "kg" };
  // 555 123 456 — без кода
  if (d.length === 9 && !s.startsWith("+")) return { e164: `+996${d}`, country: "kg" };
  // +7 701 123 45 67 / 8 701 123 45 67
  if ((d.startsWith("7") || d.startsWith("8")) && d.length === 11 && !d.startsWith("80"))
    return { e164: `+7${d.slice(1)}`, country: "kz" };
  // С кодом +996 или +7, но не той длины — это ошибка ввода, а не «другая страна».
  if (s.startsWith("+") && (d.startsWith("996") || d.startsWith("7"))) return null;
  // Любой другой международный номер с «+»
  if (s.startsWith("+") && d.length >= 8 && d.length <= 15) return { e164: `+${d}`, country: "intl" };
  return null;
}

/** Маска для поля: +996 555 123 456. Для других стран — как ввели. */
export function formatPhoneInput(raw: string): string {
  const d = digits(raw);
  if (raw.trim().startsWith("+") && !d.startsWith("996")) return `+${d}`;
  let local = d;
  if (d.startsWith("996")) local = d.slice(3);
  else if (d.startsWith("0")) local = d.slice(1);
  local = local.slice(0, 9);
  const parts = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 9)].filter(Boolean);
  return `+996${parts.length ? " " + parts.join(" ") : ""}`;
}
