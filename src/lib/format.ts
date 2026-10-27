// Узкий неразрывный пробел между разрядами: «13 000», а не «13,000» и не перенос посреди числа.
const NNBSP = " ";

export function formatNumber(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
}

export function formatSom(n: number) {
  return `${formatNumber(n)} сом`;
}

export function formatMeters(m: number, locale: "ru" | "ky" = "ru") {
  const v = m.toFixed(1).replace(".", ",");
  return `${v} ${locale === "ky" ? "м" : "м"}`;
}
